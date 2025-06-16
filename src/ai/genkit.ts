
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let aiInstance: any;

try {
  console.log("Attempting to initialize Genkit AI instance...");
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.error("********************************************************************************");
    console.error("CRITICAL: NEITHER GEMINI_API_KEY NOR GOOGLE_API_KEY IS SET IN ENVIRONMENT VARIABLES.");
    console.error("Genkit GoogleAI plugin will likely fail to initialize.");
    console.error("Please ensure one of these is set in your .env file (for local development)");
    console.error("or in your deployment environment variables.");
    console.error("********************************************************************************");
  } else {
    if (process.env.GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY found in environment variables.");
    }
    if (process.env.GOOGLE_API_KEY) {
      console.log("GOOGLE_API_KEY found in environment variables.");
    }
  }

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
  
  if (aiInstance) {
    console.log("Genkit AI instance initialized successfully.");
  } else {
     console.error("CRITICAL: Genkit AI instance is UNDEFINED after genkit() call, even without an explicit error. This is unexpected and AI functionality will be unavailable.");
  }

} catch (error) {
  console.error("CRITICAL: Failed to initialize Genkit AI instance during genkit() call. AI functionality will be UNAVAILABLE.");
  console.error("Error details:", error);
  // Fallback or dummy instance to prevent crashes if absolutely necessary,
  // though ideally, the app should handle this failure gracefully.
  // For now, we'll let it be undefined and subsequent calls will fail,
  // which should be caught by error boundaries or become apparent in logs.
  // Or, rethrow the error to make it clear that AI functionality is unavailable:
  // throw new Error("Critical AI Initialization Failed: " + (error as Error).message);
}

export const ai = aiInstance;
