import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization for (ወርቁ) Pro.
 * 
 * TO MANUALLY ADD YOUR API KEY:
 * 1. Get your key from https://aistudio.google.com/
 * 2. Replace 'YOUR_GEMINI_API_KEY_HERE' below with your actual key.
 */
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
