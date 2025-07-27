import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ConfigManager } from "../utils/config.js";

export class BerkeliumContextManager {
  private configManager: ConfigManager;

  public contextManager!: ChatGoogleGenerativeAI;

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
      this.contextManager = new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash-exp",
        maxOutputTokens: 2048,
        apiKey: apiKey,
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
    return this.contextManager
      .invoke(prompt)
      .then((result) => result.text)
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Context Manager API error: ${errorMessage}`);
      });
  }
}
