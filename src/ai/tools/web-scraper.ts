
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const fetchWebsiteContentTool = ai.defineTool(
  {
    name: 'fetchWebsiteContentTool',
    description: 'Fetches and returns the clean text content from a given public URL. It strips HTML tags, scripts, and styles to get the main textual content.',
    inputSchema: z.object({
      url: z.string().url().describe('The public URL of the website to scrape.'),
    }),
    outputSchema: z.string(),
  },
  async ({ url }) => {
    try {
      const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      
      // A more robust way to remove clutter
      $('script, style, head, nav, footer, iframe, img, header, aside, form').remove();
      const text = $('body').text().replace(/\s\s+/g, ' ').trim();

      // Limit context size to avoid overwhelming the prompt window
      return text.substring(0, 15000);
    } catch (error: any) {
      console.error(`Error fetching URL ${url}:`, error.message);
      return `Error: Could not fetch content from the URL. The website might be down or blocking requests. Error: ${error.message}`;
    }
  }
);
