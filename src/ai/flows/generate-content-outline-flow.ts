
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
import {Client} from '@notionhq/client'; // Import for demonstration

// --- MOCK NOTION READER TOOL ---
const ReadNotionPageInputSchema = z.object({
  notionPageUrl: z.string().url().describe("The URL of the Notion page to read."),
});

const ReadNotionPageOutputSchema = z.object({
  pageContent: z.string().describe("The extracted text content from the Notion page."),
});

/**
 * MOCK TOOL: In a real application, this would use the Notion SDK to fetch
 * and parse the content of a public Notion page. For this prototype, it
 * simulates reading a page and returns mock content.
 */
const readNotionPage = ai.defineTool(
  {
    name: 'readNotionPage',
    description: 'Reads the text content from a given Notion page URL.',
    inputSchema: ReadNotionPageInputSchema,
    outputSchema: ReadNotionPageOutputSchema,
  },
  async ({ notionPageUrl }) => {
    console.log(`[MOCK] Reading Notion page: ${notionPageUrl}`);
    // --- REAL IMPLEMENTATION (EXAMPLE) ---
    // const pageId = extractPageIdFromUrl(notionPageUrl);
    // const notion = new Client({ auth: process.env.NOTION_API_KEY });
    // const blocks = await notion.blocks.children.list({ block_id: pageId });
    // const pageContent = blocks.results.map(block => block.paragraph?.rich_text[0]?.plain_text || '').join('\n');
    // return { pageContent };
    // --- END REAL IMPLEMENTATION ---

    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return mock content for the prototype
    return {
      pageContent: `This is mock content read from the Notion page. The page discusses a new marketing strategy for a sustainable coffee brand. Key points include targeting Gen Z on social media, partnering with eco-friendly influencers, and launching a loyalty program based on reusable cups. The overall tone should be youthful, energetic, and environmentally conscious.`
    };
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
