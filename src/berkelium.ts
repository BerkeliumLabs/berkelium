#!/usr/bin/env node

import { input } from "@inquirer/prompts";
import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";

/**
 * Main Berkelium CLI application
 */
class BerkeliumCLI {
  private isRunning = true;
  /**
   * Start the REPL loop
   */
  async start(): Promise<void> {
    const coolGradient = gradient(["#FFA800", "#FF6F00"]);
    try {
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
      console.log("Something went wrong...");
      console.dir(err);
    }
    console.log(
      chalk.blueBright(
        'Type your questions or commands. Use "help" for available commands, "exit" or "quit" to leave.\n'
      )
    );

    while (this.isRunning) {
      try {
        const userInput = await input({
          message: "> ",
        });
        console.log(chalk.red(`You entered: ${userInput}`));
        if (userInput === "exit" || userInput === "quit") {
          this.exit();
        }
      } catch (error) {
        console.error("An error occurred:", error);
      }
    }
  }

  private exit(): void {
    console.log("\n👋 Goodbye! Thanks for using Berkelium.");
    this.isRunning = false;
    process.exit(0);
  }
}

// Start the application
const cli = new BerkeliumCLI();
cli.start().catch((error) => {
  console.error("Failed to start Berkelium:", error);
  process.exit(1);
});
