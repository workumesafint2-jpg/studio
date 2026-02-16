import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization for (ወርቁ) Pro.
 * Hardcoded API Key for immediate activation.
 */
const API_KEY = 'AIzaSyC_9Hy5ki-M3P2NJWB7O3BiBPKV7U66w0o';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
