
/**
 * @fileoverview Centralized type definitions and Zod schemas for all AI flows.
 * This file does not contain 'use server' and can be safely imported by client and server components.
 */

import { z } from 'zod';

// === Conversational Chat Flow ===
export const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationalChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The full conversation history, including the latest user message.'),
});
export type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;


// === General Content Idea ===
export const ContentIdeaFormDataSchema = z.object({
  contentType: z.string(),
  mainTopic: z.string(),
  purpose: z.string(),
  targetAudience: z.string(),
  otherAudience: z.string().optional(),
  desiredTone: z.string(),
  desiredLength: z.string(),
  keywords: z.array(z.string()),
});
export type ContentIdeaFormData = z.infer<typeof ContentIdeaFormDataSchema>;


// === analyze-prompt-flow ===
const ToolEnum = z.enum(['image-generator', 'written-content', 'structured-data', 'none']);
export const AnalyzePromptInputSchema = z.object({
  prompt: z.string().describe('The generated prompt to be analyzed.'),
});
export type AnalyzePromptInput = z.infer<typeof AnalyzePromptInputSchema>;
export const AnalyzePromptOutputSchema = z.object({
  tool: ToolEnum.describe("The most appropriate tool for the given prompt."),
  suggestion: z.string().describe("A user-friendly call to action, e.g., 'Let's bring this to life with the Image Generator'. If no tool is suitable, this should be an empty string."),
});
export type AnalyzePromptOutput = z.infer<typeof AnalyzePromptOutputSchema>;


// === expand-outline-section-flow ===
export const ExpandOutlineSectionInputSchema = z.object({
  currentOutlineSectionText: z.string().describe('The specific section title to be expanded.'),
  fullContentTopic: z.string().describe('The main topic of the entire piece of content.'),
  fullContentOutline: z.array(z.string()).describe('The complete list of all section titles in the outline.'),
});
export type ExpandOutlineSectionInput = z.infer<typeof ExpandOutlineSectionInputSchema>;
export const ExpandOutlineSectionOutputSchema = z.object({
  expandedContent: z.string().describe("A markdown-formatted string containing detailed sub-points or a brief paragraph for the given section."),
});
export type ExpandOutlineSectionOutput = z.infer<typeof ExpandOutlineSectionOutputSchema>;


// === generate-content-outline-flow ===
export const GenerateContentOutlineInputSchema = z.object({
  contentType: z.string().describe("The type of content (e.g., 'Blog Post', 'Email')."),
  mainTopic: z.string().describe('The core topic of the content.'),
  purpose: z.string().describe('The goal or objective of the content.'),
  targetAudience: z.string().describe('The intended audience.'),
  desiredTone: z.string().describe('The desired tone of voice.'),
  desiredLength: z.string().describe('The approximate desired length.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords to include.'),
});
export type GenerateContentOutlineInput = z.infer<typeof GenerateContentOutlineInputSchema>;

export const GenerateContentOutlineOutputSchema = z.object({
  outline: z.array(z.string()).describe("An array of logical section titles for the content outline."),
});
export type GenerateContentOutlineOutput = z.infer<typeof GenerateContentOutlineOutputSchema>;


// === generate-content-suggestions-flow ===
export const GenerateContentSuggestionsInputSchema = z.object({
  topic: z.string().describe('The main topic or message of the content.'),
});
export type GenerateContentSuggestionsInput = z.infer<typeof GenerateContentSuggestionsInputSchema>;
export const GenerateContentSuggestionsOutputSchema = z.object({
  suggestedAudience: z.string().describe("A suggested target audience for this topic (e.g., 'Software Developers', 'Small Business Owners')."),
  suggestedKeywords: z.array(z.string()).describe("An array of 3-5 suggested keywords relevant to the topic."),
});
export type GenerateContentSuggestionsOutput = z.infer<typeof GenerateContentSuggestionsOutputSchema>;


// === generate-data-refinement-suggestions-flow ===
export const GenerateDataRefinementSuggestionsInputSchema = z.object({
  data: z.string().describe('The structured data string (e.g., JSON, CSV) to be analyzed.'),
  format: z.string().describe("The format of the data (e.g., 'json', 'csv')."),
});
export type GenerateDataRefinementSuggestionsInput = z.infer<typeof GenerateDataRefinementSuggestionsInputSchema>;
const RefinementSuggestionSchema = z.object({
  label: z.string().describe("A short, user-friendly label for a button (e.g., 'Add 5 more items')."),
  instruction: z.string().describe("The detailed instruction for another AI to execute (e.g., 'Add 5 more records to the list, keeping the same structure.')."),
});
export type RefinementSuggestion = z.infer<typeof RefinementSuggestionSchema>;
export const GenerateDataRefinementSuggestionsOutputSchema = z.object({
  suggestions: z.array(RefinementSuggestionSchema).describe("An array of contextual refinement suggestions."),
});
export type GenerateDataRefinementSuggestionsOutput = z.infer<typeof GenerateDataRefinementSuggestionsOutputSchema>;


// === generate-full-content-draft-flow ===
export const GenerateFullContentDraftInputSchema = z.object({
  finalOutline: z.array(z.string()).describe("The finalized list of section titles for the content outline."),
  contentType: z.string().describe("The type of content (e.g., 'Blog Post')."),
  mainTopic: z.string().describe('The core topic of the content.'),
  purpose: z.string().describe('The goal or objective of the content.'),
  targetAudience: z.string().describe('The intended audience.'),
  desiredTone: z.string().describe('The desired tone of voice.'),
  desiredLength: z.string().describe('The approximate desired length.'),
  keywords: z.array(z.string()).optional().describe('A list of keywords to include.'),
});
export type GenerateFullContentDraftInput = z.infer<typeof GenerateFullContentDraftInputSchema>;
export const GenerateFullContentDraftOutputSchema = z.object({
  generatedContent: z.string().describe("The full, final generated content as a single markdown string."),
});
export type GenerateFullContentDraftOutput = z.infer<typeof GenerateFullContentDraftOutputSchema>;


// === generate-image-flow ===
export const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A detailed text description of the image to generate, or instructions on how to modify the context images.'),
  imageDataUris: z.array(z.string()).optional().describe("An optional array of images to use as context for the generation, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  count: z.number().int().min(1).max(4).default(1).describe("The number of images to generate."),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;
export const GenerateImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('An array of data URIs for the generated images.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


// === generate-json-schema-suggestions-flow ===
export const GenerateJsonSchemaSuggestionsInputSchema = z.object({
  description: z.string().describe('A plain English description of the data to generate.'),
});
export type GenerateJsonSchemaSuggestionsInput = z.infer<typeof GenerateJsonSchemaSuggestionsInputSchema>;
export const GenerateJsonSchemaSuggestionsOutputSchema = z.object({
  suggestedSchema: z.string().describe("A suggested JSON schema or example structure based on the description."),
});
export type GenerateJsonSchemaSuggestionsOutput = z.infer<typeof GenerateJsonSchemaSuggestionsOutputSchema>;


// === generate-project-metadata-flow ===
const PROJECT_TYPES = ['written-content', 'prompt', 'structured-data', 'image-generator', 'chat'] as const;
export const GenerateProjectMetadataInputSchema = z.object({
  type: z.enum(PROJECT_TYPES).describe('The type of content in the project.'),
  content: z.string().describe('The generated content to be summarized.'),
});
export type GenerateProjectMetadataInput = z.infer<typeof GenerateProjectMetadataInputSchema>;
export const GenerateProjectMetadataOutputSchema = z.object({
  name: z.string().describe("A short, descriptive name for the project (3-5 words)."),
  summary: z.string().describe("A one-sentence summary of the project content."),
});
export type GenerateProjectMetadataOutput = z.infer<typeof GenerateProjectMetadataOutputSchema>;


// === generate-prompt-flow ===
export const GeneratePromptInputSchema = z.object({
  taskDescription: z.string().describe('A plain English description of the task the user wants to accomplish.'),
  imageDataUris: z.array(z.string()).optional().describe("An optional array of images provided as context, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  targetModel: z.string().optional().describe("The specific AI model this prompt is for (e.g., 'Gemini 1.5 Pro', 'Claude 3 Opus')."),
  outputFormat: z.string().optional().describe("The desired format for the AI's output (e.g., 'JSON', 'Markdown', 'a bulleted list')."),
});
export type GeneratePromptInput = z.infer<typeof GeneratePromptInputSchema>;
export const GeneratePromptOutputSchema = z.object({
  generatedPrompt: z.string().describe('The complete, optimized prompt ready to be used.'),
});
export type GeneratePromptOutput = z.infer<typeof GeneratePromptOutputSchema>;


// === generate-prompt-format-suggestions-flow ===
export const GeneratePromptFormatSuggestionsInputSchema = z.object({
  taskDescription: z.string().describe('A plain English description of the task the user wants to accomplish.'),
});
export type GeneratePromptFormatSuggestionsInput = z.infer<typeof GeneratePromptFormatSuggestionsInputSchema>;
export const GeneratePromptFormatSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe("An array of 3-4 suggested output formats (e.g., 'JSON', 'Markdown', 'Bulleted list')."),
});
export type GeneratePromptFormatSuggestionsOutput = z.infer<typeof GeneratePromptFormatSuggestionsOutputSchema>;


// === generate-section-draft-flow ===
export const GenerateSectionDraftInputSchema = z.object({
  sectionToDraft: z.string().describe('The specific outline section title to be drafted.'),
  fullOutline: z.array(z.string()).describe('The complete list of all section titles in the outline.'),
  mainTopic: z.string().describe('The main topic of the entire piece of content.'),
  priorContent: z.string().optional().describe('The content that was generated for the previous sections, to ensure a smooth transition.'),
  contentType: z.string().describe("The type of content (e.g., 'Blog Post')."),
  purpose: z.string().describe('The goal or objective of the content.'),
  targetAudience: z.string().describe('The intended audience.'),
  desiredTone: z.string().describe('The desired tone of voice.'),
});
export type GenerateSectionDraftInput = z.infer<typeof GenerateSectionDraftInputSchema>;
export const GenerateSectionDraftOutputSchema = z.object({
  generatedSectionContent: z.string().describe("The written content for the specified section, formatted as a markdown string."),
});
export type GenerateSectionDraftOutput = z.infer<typeof GenerateSectionDraftOutputSchema>;


// === generate-structured-data-flow ===
export const GenerateStructuredDataInputSchema = z.object({
  description: z.string().describe('A plain English description of the data to generate.'),
  format: z.string().describe("The desired output format (e.g., 'JSON', 'CSV', 'KML', 'XML')."),
  schemaDefinition: z.string().optional().describe('An optional schema or example of the desired structure (e.g., a JSON schema, an example XML/KML structure).'),
  imageDataUris: z.array(z.string()).optional().describe("An optional array of images provided as context, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  originalData: z.string().optional().describe('Existing data to be refined. If present, the flow will refine this data instead of generating new data from the topic.'),
  refinementInstruction: z.string().optional().describe("The instruction for refining the data (e.g., 'Add 10 more records', 'Add a unique ID field')."),
});
export type GenerateStructuredDataInput = z.infer<typeof GenerateStructuredDataInputSchema>;
export const GenerateStructuredDataOutputSchema = z.object({
  generatedData: z.string().describe('The complete, formatted structured data (e.g., a JSON object, a CSV string, or an XML/KML document).'),
});
export type GenerateStructuredDataOutput = z.infer<typeof GenerateStructuredDataOutputSchema>;


// === generate-written-content-flow ===
export const GenerateWrittenContentInputSchema = z.object({
  contentType: z.string().describe("The type of content to generate (e.g., 'Blog Post', 'Email')."),
  tone: z.string().describe("The desired tone of voice (e.g., 'Professional', 'Casual', 'Witty')."),
  topic: z.string().describe('The main topic or message of the content.'),
  audience: z.string().optional().describe('The target audience for the content.'),
  keywords: z.string().optional().describe('A comma-separated list of keywords to include.'),
  imageDataUris: z.array(z.string()).optional().describe("An optional array of images provided as context, as data URIs. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  outputFormat: z.string().optional().describe("The desired output format (e.g., 'JSON', 'Markdown', 'HTML'). Defaults to Markdown if not specified."),
  examples: z.array(z.object({
    input: z.string().describe("An example of a user's input."),
    output: z.string().describe("The corresponding desired output for the example input.")
  })).optional().describe("An array of few-shot examples to guide the model's response style and structure."),
  originalContent: z.string().optional().describe('Existing content to be refined. If present, the flow will refine this content instead of generating new content from the topic.'),
  refinementInstruction: z.string().optional().describe("The instruction for refining the content (e.g., 'Make it shorter', 'Change the tone to witty')."),
});
export type GenerateWrittenContentInput = z.infer<typeof GenerateWrittenContentInputSchema>;
export const GenerateWrittenContentOutputSchema = z.object({
  generatedContent: z.string().describe('The complete, formatted written content.'),
});
export type GenerateWrittenContentOutput = z.infer<typeof GenerateWrittenContentOutputSchema>;


// === optimize-content-flow ===
export const OptimizeContentInputSchema = z.object({
  content: z.string().describe('The current content string to be optimized.'),
  optimizations: z.object({
      seo: z.boolean().optional().describe("If true, optimize for SEO."),
      readability: z.boolean().optional().describe("If true, improve readability."),
      tone: z.boolean().optional().describe("If true, adjust the tone."),
      cta: z.boolean().optional().describe("If true, generate CTA suggestions."),
      headlines: z.boolean().optional().describe("If true, suggest headlines."),
  }),
  toneParameter: z.string().optional().describe("The new tone, required if optimizations.tone is true."),
});
export type OptimizeContentInput = z.infer<typeof OptimizeContentInputSchema>;
export const OptimizeContentOutputSchema = z.object({
  optimizedContent: z.string().describe("The optimized content or a list of suggestions, formatted as a markdown string."),
});
export type OptimizeContentOutput = z.infer<typeof OptimizeContentOutputSchema>;


// === generate-content-outline-flow (OLD) ===
export const GenerateStrategicBriefInputSchema = z.object({
  topic: z.string().describe("The user's topic for the content."),
  targetAudience: z.string().describe("The user's stated target audience."),
  purpose: z.string().describe("The user's stated purpose or desired tone."),
});
export type GenerateStrategicBriefInput = z.infer<typeof GenerateStrategicBriefInputSchema>;

export const GenerateStrategicBriefOutputSchema = z.object({
    audiencePersona: z.string(),
    bigIdea: z.string(),
    readerTransformation: z.string(),
    writingPersona: z.string(),
});
export type GenerateStrategicBriefOutput = z.infer<typeof GenerateStrategicBriefOutputSchema>;
