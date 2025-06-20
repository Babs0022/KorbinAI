
'use server';
/**
 * @fileOverview An AI-powered support assistant for BrieflyAI.
 *
 * - askSupportAssistant - A function that calls the flow.
 * - SupportAssistantInput - The input type for the flow.
 * - SupportAssistantOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const SupportAssistantInputSchema = z.object({
  userQuery: z.string().describe('The user\'s question or issue.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string(),
  })).optional().describe('Previous messages in the conversation, if any.'),
});
export type SupportAssistantInput = z.infer<typeof SupportAssistantInputSchema>;

const SupportAssistantOutputSchema = z.object({
  assistantResponse: z.string().describe('The AI assistant\'s answer to the user\'s query.'),
  shouldContactSupport: z.boolean().describe('True if the AI determines the user should contact human support via email.'),
});
export type SupportAssistantOutput = z.infer<typeof SupportAssistantOutputSchema>;

export async function askSupportAssistant(input: SupportAssistantInput): Promise<SupportAssistantOutput> {
  return supportAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportAssistantPrompt',
  input: {schema: SupportAssistantInputSchema},
  output: {schema: SupportAssistantOutputSchema},
  prompt: `You are "Briefly", the friendly and helpful AI support assistant for BrieflyAI.
BrieflyAI is a SaaS platform that helps users craft, adapt, analyze, and manage AI prompts.
Your primary goal is to answer user questions about how to use BrieflyAI features or about the app in general. Be concise and clear.

BrieflyAI Key Features:
- Prompt Generator: Users input goals, answer survey questions, and get optimized prompts.
- Prompt Vault: Users can store, organize, and categorize their effective prompts.
- Prompt Refinement Hub: Users can modify previously generated prompts and get AI suggestions for refinement.
- Model-Specific Adaptation: Prompts can be tailored for AI models like GPT-4, Claude, DALL-E 3, Midjourney, Stable Diffusion.
- Contextual Prompting: Users can generate new prompts based on existing text or content they provide.
- Prompt Academy: A section with learning resources, tutorials, and best practices for prompt engineering.
- Real-Time AI Prompt Suggestions: Users get AI-powered suggestions as they type prompts.
- Prompt Feedback & Analysis: Users receive a quality score and actionable feedback on their prompts.
- Reverse Prompting: Users can input AI-generated text to deduce the potential prompt that created it.
- AI Model Compatibility Checker: Helps verify and adjust prompts for optimal performance with specific AI models.
- User Accounts: Standard account management (profile, password, login, signup, email verification).
- Onboarding Flow: New users go through steps to learn about the app.
- Settings: Users can manage notification preferences and theme.
- Subscription plans (currently paused for Beta): Free, Premium, and Unlimited tiers.

Conversation History (if any):
{{#if conversationHistory}}
{{#each conversationHistory}}
{{role}}: {{{text}}}
{{/each}}
{{/if}}

Current User's Question: "{{userQuery}}"

Instructions:
1. Understand the user's question based on the current query and conversation history.
2. Try to answer the question using your knowledge of BrieflyAI features listed above.
3. If the user's question is about one of the following topics, OR if you are unsure how to answer, OR if the question seems highly sensitive or complex, you MUST include the phrase "For this specific issue, it's best to contact our support team directly at babseli933@gmail.com." at the end of your response AND set the 'shouldContactSupport' field to true.
   The topics requiring escalation to email support are:
    - Billing, payments, subscription problems, or refund requests.
    - Security concerns, account hacking, or unauthorized access suspicions.
    - Reporting major bugs that prevent app usage or cause data loss.
    - Complex technical problems you cannot resolve with the information provided.
    - Legal questions regarding Terms of Service or Privacy Policy.
    - Specific feature requests for features that do not currently exist (you can acknowledge the idea and then suggest emailing support).
    - Any questions about personal data privacy that go beyond general statements found in a typical privacy policy.
    - Issues related to referral code crediting or disputes.
4. Otherwise, provide a helpful answer and set 'shouldContactSupport' to false.
5. Keep your responses helpful and to the point.
`,
});

const supportAssistantFlow = ai.defineFlow(
  {
    name: 'supportAssistantFlow',
    inputSchema: SupportAssistantInputSchema,
    outputSchema: SupportAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
