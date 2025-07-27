import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  version: string;
  createdAt: string;
  updatedAt: string;
  geminiApiKey: string;
}

/**
 * Configuration manager for Berkelium
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(os.homedir(), '.berkelium/config.json');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get the config file path
   */
  public getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Check if API key is configured
   */
  public isApiKeyConfigured(): boolean {
    try {
      if (!fs.existsSync(this.configPath)) {
        return false;
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config: Config = JSON.parse(configData);
      
      return !!(config.geminiApiKey && config.geminiApiKey.trim());
    } catch (error) {
      return false;
    }
  }

  /**
   * Load configuration from file
   */
  public loadConfig(): Config {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(
          `Configuration file not found at ${this.configPath}. ` +
          'Please create a config.json file in your home directory with your Gemini API key.'
        );
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config: Config = JSON.parse(configData);

      if (!config.geminiApiKey) {
        throw new Error(
          'geminiApiKey is missing from config.json. ' +
          'Please add your Google Gemini API key to the configuration file.'
        );
      }

      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file at ${this.configPath}. Please check the file format.`);
      }
      throw error;
    }
  }

  /**
   * Save API key to config file
   */
  public async saveApiKey(apiKey: string): Promise<void> {
    const now = new Date().toISOString();
    
    let config: Config = {
      version: "0.0.1",
      createdAt: now,
      updatedAt: now,
      geminiApiKey: apiKey
    };

    // If config file exists, preserve existing values and update
    if (fs.existsSync(this.configPath)) {
      try {
        const existingConfigData = fs.readFileSync(this.configPath, 'utf8');
        const existingConfig: Config = JSON.parse(existingConfigData);
        config = {
          ...existingConfig,
          updatedAt: now,
          geminiApiKey: apiKey
        };
      } catch (error) {
        // If existing config is corrupted, use new config
        // Let the caller handle the warning message
      }
    }

    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * Get API key from config
   */
  public getApiKey(): string {
    const config = this.loadConfig();
    return config.geminiApiKey;
  }
}
