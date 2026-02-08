import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization for (ወርቁ) Pro.
 * The API key is hardcoded here to ensure stability in the Electron/Desktop environment.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE',
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
