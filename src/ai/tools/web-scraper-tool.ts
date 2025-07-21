
'use server';
/**
 * @fileOverview An AI tool for fetching and summarizing the content of a webpage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as cheerio from 'cheerio';

export const scrapeWebPage = ai.defineTool(
  {
    name: 'scrapeWebPage',
    description: 'Fetches the content of a web page and returns a clean, readable text summary. Use this when a user provides a URL or asks to look something up on the internet.',
    inputSchema: z.object({
      url: z.string().url().describe('The full URL of the webpage to scrape.'),
    }),
    outputSchema: z.string().describe("A summary of the webpage's main content, formatted as clean text."),
  },
  async ({ url }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove script, style, and other non-content tags
      $('script, style, nav, footer, aside, .noprint, .noshow').remove();

      // Prioritize main content containers if they exist
      const mainContent = $('main, article, .main, #main, #content').first().text();
      
      let bodyText;
      if (mainContent.trim().length > 100) {
        bodyText = mainContent;
      } else {
        bodyText = $('body').text();
      }

      // Basic text cleanup
      const cleanedText = bodyText
        .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
        .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with a single one
        .trim();

      if (!cleanedText) {
        return "The page appears to have no readable content.";
      }

      // Return a truncated version to avoid overly long responses
      return cleanedText.substring(0, 5000);

    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      if (error instanceof Error) {
        return `Failed to fetch or process the webpage. Error: ${error.message}`;
      }
      return 'An unknown error occurred while trying to access the webpage.';
    }
  }
);
