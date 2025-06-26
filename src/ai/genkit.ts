
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let aiInstance: any;

try {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (!geminiApiKey && !googleApiKey) {
    console.error("********************************************************************************");
    console.error("CRITICAL: NEITHER GEMINI_API_KEY NOR GOOGLE_API_KEY IS SET IN ENVIRONMENT VARIABLES.");
    console.error("Genkit GoogleAI plugin will likely fail to initialize.");
    console.error("Please ensure one of these is set in your .env file or deployment environment variables.");
    console.error("********************************************************************************");
  }

  aiInstance = genkit({
    plugins: [
      googleAI({
        // The Google AI plugin will automatically look for GEMINI_API_KEY or GOOGLE_API_KEY
        // in the environment variables if no apiKey is provided here.
      }),
    ],
    model: 'googleai/gemini-2.0-flash', // Default model for text generation
  });
  
  if (aiInstance) {
    console.log("Genkit AI instance initialized successfully.");
  } else {
     console.error("CRITICAL: Genkit AI instance is UNDEFINED after genkit() call, even without an explicit error. AI functionality will be unavailable.");
  }

} catch (error) {
  console.error("CRITICAL: Failed to initialize Genkit AI instance during genkit() call. AI functionality will be UNAVAILABLE.");
  console.error("Error details:", error);
}

export const ai = aiInstance;
