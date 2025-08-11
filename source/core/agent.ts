import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ConfigManager } from "../utils/config.js";
import { tools } from "../tools/index.js";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { executeTool } from "../tools/executor.js";
import { ToolMessage } from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import useProgressStore from "../store/progress.js";
import { MemorySaver } from "@langchain/langgraph";
import { useUsageMetaDataStore } from "../store/usage.js";

export class BerkeliumAgent {
  private configManager: ConfigManager;

  public berkeliumAgent!: ReturnType<typeof createReactAgent>;
  private memory: MemorySaver;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.memory = new MemorySaver();
    this.initializeContext();
  }

  private initializeContext(): void {
    try {
      const apiKey = this.configManager.getApiKey();
      if (!apiKey) {
        console.error("🔴 API key is not set in the configuration.\n");
        return;
      }

      // Initialize the context manager with the API key
      const llm = new ChatGoogleGenerativeAI({
        model: process.env['GEMINI_MODEL'] || "gemini-2.5-flash-lite",
        maxOutputTokens: 2048,
        apiKey: apiKey,
      });

      this.berkeliumAgent = createReactAgent({
        llm,
        tools,
        checkpointer: this.memory,
      });

      // console.log("✅ Context Manager initialized successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("🔴 Failed to initialize Context Manager:", errorMessage);
      process.exit(1);
    }
  }

  async generateResponse(
    prompt: string,
    context: string,
    threadId: string
  ): Promise<string> {
    const config = {
      configurable: {
        thread_id: threadId,
      },
    };
    const checkpoint = await this.memory.get(config);
    const currentMessages = checkpoint?.channel_values["messages"] ?? [];
    let messages: (SystemMessage | HumanMessage | ToolMessage)[] = [];
    if (Array.isArray(currentMessages) && currentMessages.length === 0) {
      messages.push(new SystemMessage(context));
    }
    messages.push(new HumanMessage(prompt));
    let finalAnswer = "";
    const maxTurns = 10;
    let turn = 0;

    try {
      for (turn = 0; turn < maxTurns; turn++) {
        const result = await this.berkeliumAgent.invoke(
          { messages },
          {
            configurable: {
              thread_id: threadId,
            },
          }
        );
        // console.log("✅ Response generated successfully", result);

        if (result["tool_calls"] && result["tool_calls"].length > 0) {
          // console.log("🔧 Tool calls detected:", result['tool_calls']);

          // Run all tool calls in parallel
          const toolResults = await Promise.all(
            result["tool_calls"].map(async (toolCall: ToolCall) => {
              const toolResult = await executeTool(
                toolCall.name,
                toolCall.args
              );
              console.log("🔧 Tool result:", toolResult);
              useProgressStore
                .getState()
                .setProgress(toolResult || "Tool executed successfully");
              return {
                tool_call_id: toolCall.id,
                result: toolResult,
              };
            })
          );
          const toolMessages = toolResults.map(
            ({ result, tool_call_id }) => new ToolMessage(result, tool_call_id)
          );

          // Feed tool results back to the agent as system messages
          messages = [...messages, ...toolMessages];
        } else {
          // console.log("✅ No tool calls detected, finalizing response.", result);
          const aiResponse: AIMessage = (result["messages"].at(-1) as AIMessage);
          const aiContent = aiResponse?.content;
          if (typeof aiContent === "string") {
            finalAnswer = aiContent;
          } else if (Array.isArray(aiContent)) {
            finalAnswer = aiContent
              .map(item => {
                if (typeof item === "string") {
                  return item;
                } else if ("text" in item && typeof item.text === "string") {
                  return item.text;
                } else if ("image_url" in item && typeof item.image_url === "string") {
                  // Optionally handle image URLs or return a placeholder
                  return "[Image]";
                }
                return "";
              })
              .join(" ");
          } else {
            finalAnswer = "";
          }

          if (aiResponse.response_metadata['finishReason'] !== 'STOP' && turn < maxTurns - 1) {
            finalAnswer = `Reach ${turn + 1} turns limit. Type "continue" to proceed.`;
          }

          const usageMetaData = aiResponse?.usage_metadata ?? {
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
          };
          useUsageMetaDataStore.getState().setUsageMetaData(usageMetaData);
          break;
        }
      }
      return finalAnswer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return `🔴 Berkelium Agent API error: ${errorMessage}`;
    }
  }
}
