import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-prompt.ts';
import '@/ai/flows/generate-survey-questions-flow.ts';
// import '@/ai/flows/adapt-prompt-model-flow.ts'; // This flow is now deprecated
import '@/ai/flows/contextual-prompt-flow.ts';
import '@/ai/flows/analyze-prompt-flow.ts';
import '@/ai/flows/reverse-prompt-flow.ts';
import '@/ai/flows/refine-prompt-suggestions-flow.ts';
import '@/ai/flows/generate-prompt-metadata-flow.ts';
import '@/ai/flows/support-assistant-flow.ts';
// import '@/ai/flows/validate-referral-code-flow.ts'; // Referral system removed
import '@/ai/flows/contextual-refinement-suggestions-flow.ts';