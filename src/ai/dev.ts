
import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-prompt.ts';
import '@/ai/flows/generate-survey-questions-flow.ts';
import '@/ai/flows/adapt-prompt-model-flow.ts';
import '@/ai/flows/contextual-prompt-flow.ts';
