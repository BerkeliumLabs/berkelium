import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ConfigManager } from "../utils/config.js";
import { tools } from "../tools/index.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { executeTool } from "../tools/executor.js";

export class BerkeliumContextManager {
  private configManager: ConfigManager;

  public contextManager!: ReturnType<typeof createReactAgent>;

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

      this.contextManager = createReactAgent({
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

  generateResponse(prompt: string): Promise<string> {
    const systemMessage = new SystemMessage(
      "You are Berkelium, a powerful AI assistant designed to help users with various tasks."
    );

    const userMessage = new HumanMessage(prompt);

    return this.contextManager
      .invoke({
        messages: [systemMessage, userMessage]
      })
      .then((result) => {
        console.log("✅ Response generated successfully", result);
        if (result.tool_calls && result.tool_calls.length > 0) {
          console.log("🔧 Tool calls detected:", result.tool_calls);
          executeTool(result.tool_calls[0].name, result.tool_calls[0].args);
        }
        return result.content || "";
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Context Manager API error: ${errorMessage}`);
      });
  }
}
