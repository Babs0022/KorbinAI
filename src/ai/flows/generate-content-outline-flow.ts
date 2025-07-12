
'use server';
/**
 * @fileOverview A flow for generating a content outline from a detailed idea.
 * This file contains the server-side logic and exports only the main async function.
 * Type definitions are in `src/types/ai.ts`.
 */
import {ai} from '@/ai/genkit';
import {
    GenerateContentOutlineInputSchema,
    GenerateContentOutlineOutputSchema,
    type GenerateContentOutlineInput,
    type GenerateContentOutlineOutput,
} from '@/types/ai';

export async function generateContentOutline(input: GenerateContentOutlineInput): Promise<GenerateContentOutlineOutput> {
  return generateContentOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentOutlinePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateContentOutlineInputSchema},
  output: {schema: GenerateContentOutlineOutputSchema},
  prompt: `You are an expert content strategist and copywriter. Your task is to create a detailed, logical content outline based on the user's specifications. The structure of the outline MUST be adapted to the requested "Content Type".

Return ONLY a JSON object that matches the schema, with an "outline" key containing an array of strings.

**Content Type Guidance:**
You MUST adapt the outline structure based on the requested "{{contentType}}".
- **Blog Post / Article:** Create a standard outline with an Introduction, several body sections with key points, and a Conclusion.
- **Email Series:** The outline sections should be the subject lines for a sequence of 3-5 emails (e.g., "Email 1: Welcome & Teaser", "Email 2: The Core Problem", "Email 3: Our Solution").
- **Report:** The outline should be formal, with sections like "Executive Summary", "Introduction", "Methodology", "Findings", "Analysis", and "Conclusion/Recommendations".
- **Social Media Campaign:** The outline sections should represent a sequence of 3-5 social media posts for different platforms (e.g., "Post 1 (Twitter): Announcement", "Post 2 (Instagram): Behind the Scenes", "Post 3 (LinkedIn): Professional Angle").
- **Website Page Copy:** The outline sections should represent the different sections of a webpage (e.g., "Hero Section", "Features/Benefits", "How It Works", "Testimonials", "Call to Action").

**Content Details:**
- Topic: "{{mainTopic}}"
- Type: "{{contentType}}"
- Purpose: "{{purpose}}"
- Target Audience: "{{targetAudience}}"
- Tone: "{{desiredTone}}"
- Desired Length: "{{desiredLength}}"
{{#if keywords}}
- Keywords to include: {{#each keywords}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

Based on ALL of this information, and paying close attention to the Content Type Guidance, generate a comprehensive and logical outline.
`,
});

const generateContentOutlineFlow = ai.defineFlow(
  {
    name: 'generateContentOutlineFlow',
    inputSchema: GenerateContentOutlineInputSchema,
    outputSchema: GenerateContentOutlineOutputSchema,
  },
  async (input) => {
    if (!input.mainTopic.trim()) {
        throw new Error("A main topic is required to generate an outline.");
    }
    
    const response = await prompt(input);
    return response.output ?? { outline: [] };
  }
);
