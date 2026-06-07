import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

import { FlashcardResponseSchema, type FlashcardResponse } from './schemas.js';

/**
 * Generates flashcards from the provided notes using Structured Outputs.
 * @param notes - The raw text of the course notes
 * @param cards - The number of cards to generate
 * @returns A Promise resolving to the structured JSON data
 */
export async function generateFlashcards(
  notes: string,
  cards: number
): Promise<FlashcardResponse> {
  const systemPrompt = await readFile('SYSTEM_PROMPT.md', 'utf-8');

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.MODEL || 'openai/gpt-4o-mini';

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY in .env file.');
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': process.env.APP_TITLE || 'AIP444 Lab 04',
    },
  });

  const completion = await client.chat.completions.parse({
    model,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Generate exactly ${cards} flashcards from the following course notes.

Source notes:
${notes}`,
      },
    ],
    response_format: zodResponseFormat(FlashcardResponseSchema, 'flashcards'),
  });

  const parsed = completion.choices[0].message.parsed;

  if (!parsed) {
    throw new Error('The model did not return parsed structured flashcards.');
  }

  return parsed;
}