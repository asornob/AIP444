import * as z from 'zod';

export const FlashcardSchema = z.object({
  application: z
    .string()
    .describe(
      'A 1-2 sentence real-world workplace task where this concept is needed.'
    ),

  challenge: z
    .string()
    .describe(
      'A specific problem to solve in the scenario. All acronyms must be expanded.'
    ),

  answer: z
    .string()
    .describe('The correct solution with a brief explanation.'),

  evidence: z
    .string()
    .describe('A direct quote from the source notes supporting this card.'),

  misconception: z
    .string()
    .describe(
      'A quote of what a junior developer or student might incorrectly believe.'
    ),

  correction: z
    .string()
    .describe('Why the misconception is wrong, citing the notes.'),
});

export const FlashcardResponseSchema = z.object({
  flashcards: z
    .array(FlashcardSchema)
    .describe('A list of structured flashcards generated from the notes.'),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;
export type FlashcardResponse = z.infer<typeof FlashcardResponseSchema>;