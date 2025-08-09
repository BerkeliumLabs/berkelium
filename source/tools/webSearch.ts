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
}

/**
 * Default configuration for web search
 */
const DEFAULT_CONFIG = {
  maxResults: 10,
  language: 'en',
  region: 'us'
};

/**
 * Web Search Tool for fetching real-time information
 */
export class WebSearchTool {
  private config = DEFAULT_CONFIG;

  /**
   * Perform a web search query
   */
  async search(query: string): Promise<ToolResult> {
    try {
      const startTime = Date.now();
      let results: SearchResult[] = [];

      results = await this.searchDuckDuckGo(query);

      const searchTime = Date.now() - startTime;

      const response: WebSearchResponse = {
        query,
        results: results.slice(0, this.config.maxResults),
        totalResults: results.length,
        searchTime
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
    webSearchTool['config'].maxResults = maxResults;
  }
  
  return webSearchTool.search(query);
}

