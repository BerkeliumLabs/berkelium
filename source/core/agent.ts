import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ConfigManager } from "../utils/config.js";
import { tools } from "../tools/index.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { executeTool } from "../tools/executor.js";
import { ToolMessage } from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import useProgressStore from "../store/progress.js";
import { MemorySaver } from "@langchain/langgraph";

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
        throw new Error("API key is not set in the configuration.");
      }

      // Initialize the context manager with the API key
      const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash-lite",
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
    const maxTurns = 5;

    try {
      for (let turn = 0; turn < maxTurns; turn++) {
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
          finalAnswer = result["messages"].at(-1)?.content || "";
          break;
        }
      }
      return finalAnswer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`🔴 Berkelium Agent API error: ${errorMessage}`);
    }
  }
}
