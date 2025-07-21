'use server';
/**
 * @fileOverview An AI tool for fetching and parsing content from a web page.
 * This tool allows the agent to "browse the web".
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as cheerio from 'cheerio';

async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
        signal: controller.signal,
        headers: {
            'User-Agent': 'BrieflyAIAgent/1.0',
        }
    });
    clearTimeout(id);
    return response;
}

export const scrapeWebPage = ai.defineTool(
  {
    name: 'scrapeWebPage',
    description: 'Fetches the content of a given URL and returns the textual content. Use this to access the internet, visit links, and understand the content of websites.',
    inputSchema: z.object({
      url: z.string().url().describe('The valid URL of the webpage to scrape.'),
    }),
    outputSchema: z.string().describe('The cleaned, textual content of the webpage, or an error message if scraping failed.'),
  },
  async ({ url }) => {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        return `Error: Failed to fetch the page. Status code: ${response.status}`;
      }
      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove script, style, and other non-visible elements
      $('script, style, noscript, iframe, footer, header, nav').remove();

      // Get text from the body, which is more likely to be the main content
      let text = $('body').text();

      // Clean up the text: remove extra whitespace and newlines
      text = text.replace(/\s\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();

      if (!text) {
        return "The page was scraped, but no meaningful content was found.";
      }

      // Return a manageable chunk of text to avoid overloading the context
      return text.substring(0, 8000);

    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      if (error instanceof Error) {
        return `Error: Could not scrape the webpage. ${error.message}`;
      }
      return 'An unknown error occurred while scraping the webpage.';
    }
  }
);
