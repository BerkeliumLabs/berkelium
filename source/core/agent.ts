import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ConfigManager } from "../utils/config.js";
import { tools } from "../tools/index.js";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
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
  ): Promise<{
    finished: boolean;
    answer?: string;
    toolCalls?: ToolCall[];
    error?: string;
  }> {
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

    try {
      const result = await this.berkeliumAgent.invoke(
        { messages },
        {
          configurable: {
            thread_id: threadId,
          },
        }
      );

      if (result["tool_calls"] && result["tool_calls"].length > 0) {
        // Return tool calls for external processing
        return {
          finished: false,
          toolCalls: result["tool_calls"]
        };
      } else {
        // Process final answer
        const aiResponse: AIMessage = (result["messages"].at(-1) as AIMessage);
        const aiContent = aiResponse?.content;
        let finalAnswer = "";

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
                return "[Image]";
              }
              return "";
            })
            .join(" ");
        }

        const usageMetaData = aiResponse?.usage_metadata ?? {
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
        };
        useUsageMetaDataStore.getState().setUsageMetaData(usageMetaData);

        return {
          finished: true,
          answer: finalAnswer
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        finished: true,
        error: `🔴 Berkelium Agent API error: ${errorMessage}`
      };
    }
  }

  async processToolResults(
    toolResults: { tool_call_id: string; result: any }[],
    threadId: string
  ): Promise<{
    finished: boolean;
    answer?: string;
    toolCalls?: ToolCall[];
    error?: string;
  }> {
    try {
      const toolMessages = toolResults.map(
        ({ result, tool_call_id }) => new ToolMessage(result, tool_call_id)
      );

      const result = await this.berkeliumAgent.invoke(
        { messages: toolMessages },
        {
          configurable: {
            thread_id: threadId,
          },
        }
      );

      if (result["tool_calls"] && result["tool_calls"].length > 0) {
        return {
          finished: false,
          toolCalls: result["tool_calls"]
        };
      } else {
        const aiResponse: AIMessage = (result["messages"].at(-1) as AIMessage);
        const aiContent = aiResponse?.content;
        let finalAnswer = "";

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
                return "[Image]";
              }
              return "";
            })
            .join(" ");
        }

        const usageMetaData = aiResponse?.usage_metadata ?? {
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
        };
        useUsageMetaDataStore.getState().setUsageMetaData(usageMetaData);

        return {
          finished: true,
          answer: finalAnswer
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        finished: true,
        error: `🔴 Berkelium Agent API error: ${errorMessage}`
      };
    }
  }
}
