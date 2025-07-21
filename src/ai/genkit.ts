
import { configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ai } from '@genkit-ai/ai';

// Configure Genkit with the Google AI plugin.
// The apiKey is automatically read from the GOOGLE_AI_API_KEY environment variable.
configureGenkit({
    plugins: [
        googleAI(),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
});

// Export the configured AI instance for use in other files.
export { ai };
