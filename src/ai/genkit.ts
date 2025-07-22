
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Configure Genkit with the Google AI plugin.
// The apiKey is automatically read from the GOOGLE_AI_API_KEY environment variable.
export const ai = genkit({
    plugins: [
        googleAI(),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
});
