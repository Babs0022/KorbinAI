
'use server';
/**
 * @fileOverview A flow for exporting content to an external tool, like Notion.
 *
 * - exportToNotionFlow - A function that handles exporting content.
 * - ExportToNotionInput - The input type for the function.
 * - ExportToNotionOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {Client} from '@notionhq/client';

const ExportToNotionInputSchema = z.object({
  title: z.string().describe('The title for the Notion page.'),
  content: z.string().describe('The markdown content to be exported.'),
});
export type ExportToNotionInput = z.infer<typeof ExportToNotionInputSchema>;

const ExportToNotionOutputSchema = z.object({
  notionPageUrl: z.string().describe("The URL of the newly created Notion page."),
  message: z.string().describe("A success or status message."),
});
export type ExportToNotionOutput = z.infer<typeof ExportToNotionOutputSchema>;

/**
 * A tool that uses the Notion SDK to create a new page with the provided content.
 * It reads the API key and parent page ID from environment variables for security.
 */
const saveToNotion = ai.defineTool(
  {
    name: 'saveToNotion',
    description: 'Saves content to a new page in Notion.',
    inputSchema: ExportToNotionInputSchema,
    outputSchema: ExportToNotionOutputSchema,
  },
  async (input) => {
    const notionAuthToken = process.env.NOTION_API_KEY;
    const notionParentPageId = process.env.NOTION_PARENT_PAGE_ID;

    if (!notionAuthToken || !notionParentPageId || notionAuthToken === 'YOUR_NOTION_API_KEY_HERE') {
      console.error("Notion API Key or Parent Page ID is not configured.");
      throw new Error("Notion integration is not configured on the server. Please set NOTION_API_KEY and NOTION_PARENT_PAGE_ID.");
    }

    const notion = new Client({ auth: notionAuthToken });

    // A simple approach to convert markdown to Notion blocks.
    // We'll put the entire markdown content into a single code block
    // to preserve formatting. A more advanced version could parse markdown into
    // various Notion block types (headings, lists, etc.).
    const blocks = [
        {
            object: 'block' as const,
            type: 'code' as const,
            code: {
                rich_text: [{
                    type: 'text' as const,
                    text: {
                        content: input.content,
                    },
                }],
                language: 'markdown' as const,
            },
        },
    ];

    try {
        const response = await notion.pages.create({
            parent: { page_id: notionParentPageId },
            properties: {
                // The 'title' property is a special case for page titles.
                'title': [
                    {
                        type: 'text',
                        text: {
                            content: input.title,
                        },
                    },
                ],
            },
            // The Notion API client has complex types for blocks.
            // Casting to `any` simplifies this prototype.
            children: blocks as any,
        });

        // The response from notion.pages.create contains the URL of the new page.
        const pageUrl = (response as any).url;
        
        return {
            notionPageUrl: pageUrl,
            message: 'Content successfully exported to Notion.',
        };
    } catch (error: any) {
        console.error("Notion API Error:", error.body || error.message);
        // Provide a user-friendly error message
        throw new Error(`Failed to export to Notion. Please ensure the integration has permission to access the parent page. Error: ${error.code}`);
    }
  }
);


export const exportToNotionFlow = ai.defineFlow(
  {
    name: 'exportToNotionFlow',
    inputSchema: ExportToNotionInputSchema,
    outputSchema: ExportToNotionOutputSchema,
  },
  async (input) => {
    // This flow directly calls the tool.
    const result = await saveToNotion(input);
    return result;
  }
);
