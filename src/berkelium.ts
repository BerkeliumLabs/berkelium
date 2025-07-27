#!/usr/bin/env node

import { input } from "@inquirer/prompts";
import chalk from "chalk";
import { ConfigManager } from "./utils/config.js";
import boxen from "boxen";
import { BerkeliumContextManager } from "./core/context-manager.js";

class BerkeliumCLI {
  private isRunning = true;
  private configManager: ConfigManager;
  private contextManager: BerkeliumContextManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.contextManager = new BerkeliumContextManager();

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      this.exit();
    });

    process.on("SIGTERM", () => {
      this.exit();
    });
  }

  async start(): Promise<void> {
    await this.displayWelcome();
    await this.checkAndConfigureApiKey();
    await this.runREPL();
  }

  private async displayWelcome(): Promise<void> {
    try {
      // Lazy load heavy dependencies
      const [{ default: figlet }, { default: gradient }] = await Promise.all([
        import("figlet"),
        import("gradient-string"),
      ]);

      const coolGradient = gradient(["#FFA800", "#FF6F00"]);
      const title = coolGradient(
        figlet.textSync("Berkelium.dev", {
          font: "ANSI Shadow",
          horizontalLayout: "default",
          verticalLayout: "default",
          whitespaceBreak: true,
        })
      );
      console.log(title);
    } catch (err) {
      console.log(chalk.red("Failed to display welcome message"));
      console.dir(err);
    }

    const infoBox = boxen(
      chalk.blueBright(
        'Type your questions or commands. Use "help" for available commands, "exit" or "quit" to leave.'
      ),
      {
        width: process.stdout.columns || 80,
        padding: { left: 2, right: 2 },
        borderStyle: "round",
        borderColor: "cyan",
        float: "center",
      }
    );

    console.log(infoBox);
  }

  /**
   * Check if API key is configured and prompt for it if not
   */
  private async checkAndConfigureApiKey(): Promise<void> {
    try {
      if (!this.configManager.isApiKeyConfigured()) {
        console.log(
          chalk.yellow(
            "🔑 API key not found. Let's set up your Gemini API key."
          )
        );
        console.log(
          chalk.gray(
            "You can get your API key from: https://makersuite.google.com/app/apikey\n"
          )
        );

        const apiKey = await input({
          message: "Please enter your Gemini API key:",
          validate: (value: string) => {
            if (!value.trim()) {
              return "API key cannot be empty";
            }
            if (!value.startsWith("AIza")) {
              return "Invalid API key format.";
            }
            return true;
          },
        });

        await this.configManager.saveApiKey(apiKey.trim());
        console.log(chalk.green("✅ API key saved successfully!\n"));
      }
    } catch (error) {
      console.error(chalk.red("❌ Failed to configure API key:"), error);
      process.exit(1);
    }
  }

  private async runREPL(): Promise<void> {
    while (this.isRunning) {
      try {
        const userInput = await input({
          message: "> ",
          theme: {
            prefix: ""
          },
        });

        await this.processCommand(userInput.trim());
      } catch (error: Error | any) {
        if (error.name === "ExitPromptError") {
          // User pressed Ctrl+C
          this.exit();
        } else {
          console.error(chalk.red("An error occurred:"), error);
        }
      }
    }
  }

  private async processCommand(command: string): Promise<void> {
    if (!command) return;

    switch (command.toLowerCase()) {
      case "exit":
      case "quit":
        this.exit();
        break;
      case "help":
        this.showHelp();
        break;
      default:
        this.processPrompt(command);
        break;
    }
  }

  private showHelp(): void {
    console.log(chalk.cyan("Available commands:"));
    console.log(chalk.white("  help  - Show this help message"));
    console.log(chalk.white("  exit  - Exit the application"));
    console.log(chalk.white("  quit  - Exit the application\n"));
  }

  private exit(): void {
    const idlebox = boxen(
      chalk.hex("#FF6F00").bold("👋 Goodbye! Thanks for using Berkelium."),
      {
        width: process.stdout.columns || 80,
        padding: { left: 2, right: 2 },
        borderStyle: "round",
        borderColor: "yellow",
        float: "center",
      }
    );
    console.log("\n");
    console.log(idlebox);
    this.isRunning = false;
    process.exit(0);
  }

  private processPrompt(prompt: string): void {
    if (!prompt) return;

    this.contextManager
      .generateResponse(prompt)
      .then((response) => {
        console.log(chalk.blueBright(`${response}`));
      })
      .catch((error) => {
        console.error(chalk.red("❌ Error generating response:"), error, "\n ");
      });
  }
}

// Start the application
const cli = new BerkeliumCLI();
cli.start().catch((error) => {
  console.error(chalk.red("Failed to start Berkelium:"), error);
  process.exit(1);
});
