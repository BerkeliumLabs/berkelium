import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ConfigManager } from "../utils/config.js";
import { tools } from "../tools/index.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { executeTool } from "../tools/executor.js";
import { ToolMessage } from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";

export class BerkeliumAgent {
  private configManager: ConfigManager;

  public berkeliumAgent!: ReturnType<typeof createReactAgent>;

  constructor() {
    this.configManager = ConfigManager.getInstance();
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
      });

      console.log("✅ Context Manager initialized successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to initialize Context Manager:", errorMessage);
      process.exit(1);
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    const systemMessage = new SystemMessage(
      "You are Berkelium, a powerful AI assistant designed to help users with various tasks."
    );

    let messages = [systemMessage, new HumanMessage(prompt)];
    let finalAnswer = "";
    const maxTurns = 5;

    try {
      for (let turn = 0; turn < maxTurns; turn++) {
        const result = await this.berkeliumAgent.invoke({ messages });
        console.log("✅ Response generated successfully", result);

        if (result.tool_calls && result.tool_calls.length > 0) {
          console.log("🔧 Tool calls detected:", result.tool_calls);

          // Run all tool calls in parallel
          const toolResults = await Promise.all(
            result.tool_calls.map(async (toolCall: ToolCall) => {
              const toolResult = await executeTool(
                toolCall.name,
                toolCall.args
              );
              return {
                name: toolCall.name,
                result: toolResult,
              };
            })
          );

          // Feed tool results back to the agent as system messages
          toolResults.forEach(({ result }) => {
            messages.push(
              new ToolMessage(
                result
              )
            );
          });
        } else {
          console.log("✅ No tool calls detected, finalizing response.", result);
          finalAnswer = result.messages.at(-1)?.content || "";
          break;
        }
      }
      return finalAnswer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Berkelium Agent API error: ${errorMessage}`);
    }
  }
}
