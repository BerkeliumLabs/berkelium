/**
 * Configuration for web search
 */
export interface WebSearchConfig {
  provider: 'google' | 'bing' | 'duckduckgo';
  apiKey?: string;
  searchEngineId?: string; // For Google Custom Search
  maxResults?: number;
  language?: string;
  region?: string;
}

/**
 * Search result interface
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
  date?: string;
}

/**
 * Web search response interface
 */
export interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  totalResults?: number;
  searchTime?: number;
  provider: string;
}

/**
 * Default configuration for web search
 */
const DEFAULT_CONFIG: WebSearchConfig = {
  provider: 'duckduckgo', // Default to DuckDuckGo as it doesn't require API key
  maxResults: 10,
  language: 'en',
  region: 'us'
};

/**
 * Web Search Tool for fetching real-time information
 */
export class WebSearchTool {
  private config: WebSearchConfig;

  constructor(config: Partial<WebSearchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Perform a web search query
   */
  async search(query: string): Promise<ToolResult> {
    try {
      const startTime = Date.now();
      let results: SearchResult[] = [];

      switch (this.config.provider) {
        case 'google':
          results = await this.searchGoogle(query);
          break;
        case 'bing':
          results = await this.searchBing(query);
          break;
        case 'duckduckgo':
        default:
          results = await this.searchDuckDuckGo(query);
          break;
      }

      const searchTime = Date.now() - startTime;

      const response: WebSearchResponse = {
        query,
        results: results.slice(0, this.config.maxResults),
        totalResults: results.length,
        searchTime,
        provider: this.config.provider
      };

      return {
        success: true,
        output: JSON.stringify(response, null, 2)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        output: '',
        error: `Web search failed: ${errorMessage}`
      };
    }
  }

  /**
   * Search using Google Custom Search API
   */
  private async searchGoogle(query: string): Promise<SearchResult[]> {
    if (!this.config.apiKey || !this.config.searchEngineId) {
      throw new Error('Google search requires API key and search engine ID');
    }

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', this.config.apiKey);
    url.searchParams.append('cx', this.config.searchEngineId);
    url.searchParams.append('q', query);
    url.searchParams.append('num', Math.min(this.config.maxResults || 10, 10).toString());

    if (this.config.language) {
      url.searchParams.append('lr', `lang_${this.config.language}`);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (!data.items) {
      return [];
    }

    return data.items.map((item: any): SearchResult => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink,
      date: item.pagemap?.metatags?.[0]?.['article:published_time']
    }));
  }

  /**
   * Search using Bing Search API
   */
  private async searchBing(query: string): Promise<SearchResult[]> {
    if (!this.config.apiKey) {
      throw new Error('Bing search requires API key');
    }

    const url = new URL('https://api.bing.microsoft.com/v7.0/search');
    url.searchParams.append('q', query);
    url.searchParams.append('count', (this.config.maxResults || 10).toString());

    if (this.config.language) {
      url.searchParams.append('setLang', this.config.language);
    }
    if (this.config.region) {
      url.searchParams.append('cc', this.config.region);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Ocp-Apim-Subscription-Key': this.config.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Bing search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (!data.webPages?.value) {
      return [];
    }

    return data.webPages.value.map((item: any): SearchResult => ({
      title: item.name,
      url: item.url,
      snippet: item.snippet,
      displayUrl: item.displayUrl,
      date: item.dateLastCrawled
    }));
  }

  /**
   * Search using DuckDuckGo (no API key required)
   */
  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      // DuckDuckGo Instant Answer API
      const url = new URL('https://api.duckduckgo.com/');
      url.searchParams.append('q', query);
      url.searchParams.append('format', 'json');
      url.searchParams.append('no_html', '1');
      url.searchParams.append('skip_disambig', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Berkelium-WebSearch/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const results: SearchResult[] = [];

      // Add instant answer if available
      if (data.AbstractText) {
        results.push({
          title: data.Heading || 'DuckDuckGo Instant Answer',
          url: data.AbstractURL || 'https://duckduckgo.com',
          snippet: data.AbstractText,
          displayUrl: 'duckduckgo.com'
        });
      }

      // Add related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, this.config.maxResults || 10)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text,
              displayUrl: new URL(topic.FirstURL).hostname
            });
          }
        }
      }

      // If no results from instant API, fallback to a simple search indication
      if (results.length === 0) {
        results.push({
          title: `Search results for: ${query}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: `Perform this search on DuckDuckGo to find current information about: ${query}`,
          displayUrl: 'duckduckgo.com'
        });
      }

      return results;
    } catch (error) {
      // Fallback: provide search URL    
      return [{
        title: `Search for: ${query}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `Visit DuckDuckGo to search for current information about: ${query}`,
        displayUrl: 'duckduckgo.com'
      }];
    }
  }

  /**
   * Update search configuration
   */
  updateConfig(newConfig: Partial<WebSearchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): WebSearchConfig {
    return { ...this.config };
  }
}

// Default instance
const webSearchTool = new WebSearchTool();

/**
 * Perform a web search
 */
export async function webSearch(
  query: string,
  maxResults?: number
): Promise<ToolResult> {
  if (maxResults) {
    webSearchTool.updateConfig({ maxResults });
  }
  
  return webSearchTool.search(query);
}

/**
 * Configure web search provider and settings
 */
export function configureWebSearch(config: Partial<WebSearchConfig>): void {
  webSearchTool.updateConfig(config);
}
