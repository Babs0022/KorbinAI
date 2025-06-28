
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let aiInstance: any;

try {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  const effectiveApiKey = geminiApiKey || googleApiKey;

  // Stricter check for missing or placeholder key
  const isInvalidKey = (key: string | undefined): boolean => {
    if (!key || key.includes('YOUR_KEY_HERE')) return true;
    return false;
  };

  if (isInvalidKey(effectiveApiKey)) {
    const errorMsg = "CRITICAL: A valid GEMINI_API_KEY or GOOGLE_API_KEY is not configured correctly. AI features will be unavailable. Please set it in your environment variables (.env for local, apphosting.yaml for production).";
    console.error("********************************************************************************");
    console.error(errorMsg);
    console.error("********************************************************************************");
    // In a production environment, throw an error to fail the deployment, preventing a broken app from going live.
    if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMsg);
    }
  }

  aiInstance = genkit({
    plugins: [
      googleAI({
        // The Google AI plugin automatically looks for GEMINI_API_KEY or GOOGLE_API_KEY.
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
