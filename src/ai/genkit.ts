import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let aiInstance: any;

try {
  aiInstance = genkit({
    plugins: [
      googleAI({
        // The Google AI plugin will automatically look for GEMINI_API_KEY or GOOGLE_API_KEY
        // in the environment variables if no apiKey is provided here.
      }),
    ],
    model: 'googleai/gemini-2.0-flash', // Default model for text generation
    // You can configure other settings like telemetry, logging, etc. here if needed
    // Example: enableDevUi: true, (though this is usually for local genkit dev server)
  });
  console.log("Genkit AI instance initialized successfully.");
} catch (error) {
  console.error("Failed to initialize Genkit AI instance:", error);
  // Fallback or dummy instance to prevent crashes if absolutely necessary,
  // though ideally, the app should handle this failure gracefully.
  // For now, we'll let it be undefined and subsequent calls will fail,
  // which should be caught by error boundaries or become apparent in logs.
  // Or, rethrow the error to make it clear that AI functionality is unavailable:
  // throw new Error("Critical AI Initialization Failed: " + (error as Error).message);
}

export const ai = aiInstance;
