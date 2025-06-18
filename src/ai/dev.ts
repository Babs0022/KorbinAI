
import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-prompt.ts';
import '@/ai/flows/generate-survey-questions-flow.ts';
import '@/ai/flows/adapt-prompt-model-flow.ts';
import '@/ai/flows/contextual-prompt-flow.ts';
import '@/ai/flows/analyze-prompt-flow.ts';
import '@/ai/flows/reverse-prompt-flow.ts';
import '@/ai/flows/refine-prompt-suggestions-flow.ts';
import '@/ai/flows/generate-prompt-metadata-flow.ts';
import '@/ai/flows/support-assistant-flow.ts'; // Added new flow

