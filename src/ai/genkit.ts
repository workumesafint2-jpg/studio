import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization for (ወርቁ) Pro.
 * Hardcoded API Key for immediate activation.
 */
const API_KEY = 'AIzaSyAyqydj701Lp82I9YYIkIA1zFOg348gWBU';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
