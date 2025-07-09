
'use server';
/**
 * @fileOverview A flow for generating a content outline from a detailed idea or a Notion page.
 *
 * - generateContentOutline - Generates a structured outline.
 * - GenerateContentOutlineInput - The input type for the function.
 * - GenerateContentOutlineOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {Client} from '@notionhq/client';

// --- NOTION READER TOOL ---
const ReadNotionPageInputSchema = z.object({
  notionPageUrl: z.string().url().describe("The URL of the Notion page to read."),
});

const ReadNotionPageOutputSchema = z.object({
  pageContent: z.string().describe("The extracted text content from the Notion page."),
});

// Helper to extract the page ID from a Notion URL.
function extractPageIdFromUrl(url: string): string {
    // Notion page URLs often look like: https://www.notion.so/Page-Title-32characterID
    // We want to grab that final 32-character ID.
    const parts = url.split('?')[0].split('-');
    const potentialId = parts[parts.length - 1];
    
    if (potentialId && potentialId.length >= 32) {
        // A full 32-character ID with no hyphens is a valid v4 UUID.
        // We'll take the last 32 characters to be safe.
        return potentialId.slice(-32);
    }
    throw new Error('Invalid Notion URL. Could not extract a valid page ID.');
}

// Helper to convert an array of Notion blocks to a plain text string.
function blocksToPlainText(blocks: any[]): string {
  let text = '';
  for (const block of blocks) {
    if (block.type === 'paragraph' && block.paragraph.rich_text) {
        text += block.paragraph.rich_text.map((t: any) => t.plain_text).join('') + '\n\n';
    } else if (block.type === 'heading_1' && block.heading_1.rich_text) {
        text += '# ' + block.heading_1.rich_text.map((t: any) => t.plain_text).join('') + '\n\n';
    } else if (block.type === 'heading_2' && block.heading_2.rich_text) {
        text += '## ' + block.heading_2.rich_text.map((t: any) => t.plain_text).join('') + '\n\n';
    } else if (block.type === 'heading_3' && block.heading_3.rich_text) {
        text += '### ' + block.heading_3.rich_text.map((t: any) => t.plain_text).join('') + '\n\n';
    } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item.rich_text) {
        text += '- ' + block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('') + '\n';
    }
    // Add more block types as needed (e.g., numbered lists, to-do, quotes)
  }
  return text.trim();
}

/**
 * A tool that uses the Notion SDK to fetch and parse the content of a Notion page.
 */
const readNotionPage = ai.defineTool(
  {
    name: 'readNotionPage',
    description: 'Reads the text content from a given Notion page URL.',
    inputSchema: ReadNotionPageInputSchema,
    outputSchema: ReadNotionPageOutputSchema,
  },
  async ({ notionPageUrl }) => {
    const notionAuthToken = process.env.NOTION_API_KEY;
    if (!notionAuthToken || notionAuthToken.includes('YOUR_NOTION_API_KEY_HERE') || !notionAuthToken.startsWith('secret_')) {
      console.error("Notion API Key is not configured correctly.");
      throw new Error("Notion integration is not configured on the server. Please ensure NOTION_API_KEY is a valid internal integration token.");
    }
    
    try {
        const pageId = extractPageIdFromUrl(notionPageUrl);
        const notion = new Client({ auth: notionAuthToken });
        
        const response = await notion.blocks.children.list({ block_id: pageId });
        const pageContent = blocksToPlainText(response.results as any[]);

        if (!pageContent.trim()) {
          return { pageContent: "The Notion page appears to be empty or could not be read." };
        }

        return { pageContent };
    } catch (error: any) {
        console.error("Notion API Error while reading page:", error.body || error.message);
        throw new Error(`Failed to read from Notion. Please ensure the URL is correct and the integration has been shared with the page. Error: ${error.code || 'API Error'}`);
    }
  }
);


const GenerateContentOutlineInputSchema = z.object({
  contentType: z.string().describe("The type of content (e.g., 'Blog Post')."),
  mainTopic: z.string().optional().describe('The core topic of the content (used if no Notion page is provided).'),
  purpose: z.string().describe('The goal or objective of the content.'),
  targetAudience: z.string().describe('The intended audience.'),
  desiredTone: z.string().describe('The desired tone of voice.'),
  desiredLength: z.string().describe('The approximate desired length.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords to include.'),
  notionPageUrl: z.string().url().optional().describe('An optional URL to a Notion page to use as the primary source of content.'),
});
export type GenerateContentOutlineInput = z.infer<typeof GenerateContentOutlineInputSchema>;

const GenerateContentOutlineOutputSchema = z.object({
  outline: z.array(z.string()).describe("An array of logical section titles for the content outline."),
});
export type GenerateContentOutlineOutput = z.infer<typeof GenerateContentOutlineOutputSchema>;

export async function generateContentOutline(input: GenerateContentOutlineInput): Promise<GenerateContentOutlineOutput> {
  return generateContentOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentOutlinePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {
    schema: z.object({
      contentType: z.string(),
      purpose: z.string(),
      targetAudience: z.string(),
      desiredTone: z.string(),
      desiredLength: z.string(),
      keywords: z.array(z.string()).optional(),
      sourceContent: z.string().describe('The primary source text, either from the Notion page or the user-provided main topic.'),
    })
  },
  output: {schema: GenerateContentOutlineOutputSchema},
  prompt: `You are an expert content strategist and copywriter. Your task is to create a detailed, logical content outline based on the user's specifications and provided source content. The outline should be a list of section titles that will form the structure of the final piece of content.

Return ONLY a JSON object that matches the schema, with an "outline" key containing an array of strings.

**Primary Source Content:**
---
{{sourceContent}}
---

**Content Details:**
- Type: "{{contentType}}"
- Purpose: "{{purpose}}"
- Target Audience: "{{targetAudience}}"
- Tone: "{{desiredTone}}"
- Desired Length: "{{desiredLength}}"
{{#if keywords}}
- Keywords to include: {{#each keywords}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

Based on ALL of this information, generate a comprehensive and logical outline. The outline should have a clear beginning, middle, and end.
`,
});

const generateContentOutlineFlow = ai.defineFlow(
  {
    name: 'generateContentOutlineFlow',
    inputSchema: GenerateContentOutlineInputSchema,
    outputSchema: GenerateContentOutlineOutputSchema,
    // Make the tool available to this flow
    tools: [readNotionPage],
  },
  async (input) => {
    let sourceContent = input.mainTopic || '';

    // If a Notion URL is provided, use the tool to read its content
    if (input.notionPageUrl) {
      try {
        const notionResult = await readNotionPage({ notionPageUrl: input.notionPageUrl });
        sourceContent = notionResult.pageContent;
      } catch (error) {
        console.error("Failed to read Notion page:", error);
        // Fallback to mainTopic or throw an error
        if (!sourceContent) {
          throw new Error("Failed to read from the provided Notion URL and no fallback topic was given.");
        }
      }
    }

    if (!sourceContent) {
        throw new Error("A main topic or a Notion Page URL is required to generate an outline.");
    }

    const promptInput = {
      contentType: input.contentType,
      purpose: input.purpose,
      targetAudience: input.targetAudience,
      desiredTone: input.desiredTone,
      desiredLength: input.desiredLength,
      keywords: input.keywords,
      sourceContent: sourceContent,
    };
    
    const response = await prompt(promptInput);
    return response.output ?? { outline: [] };
  }
);
