import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization for (ወርቁ) Pro.
 * Uses standard environment variables for the Google AI plugin.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-1.5-flash',
});
