import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import * as z from 'zod';

import { generateFlashcards } from './flashcard-generator.js';

/*
  This file creates a small HTTP API server using the Hono framework.

  The server has one main route: POST /api/generate.
  A client sends course notes and the number of flashcards it wants.
  The server validates the request body using a Zod schema.
  If the request is valid, the server sends the notes to the flashcard generator.
  The generator calls the AI model and returns structured JSON flashcards.

  Middleware is also used:
  - logger() prints request information in the terminal.
  - timing() measures how long requests take.
  - cors() allows API requests from other apps, such as a frontend or test client.
*/

const app = new Hono();

// Add middleware that logs requests and measures response time.
app.use(logger(), timing());

// Enable CORS only for API routes.
app.use('/api/*', cors());

// This schema validates the JSON body sent by the client.
const generateSchema = z.object({
  notes: z.string().min(1, "Field 'notes' is required."),
  cards: z.number().optional().default(3),
});

// POST route used to generate flashcards from notes.
app.post('/api/generate', zValidator('json', generateSchema), async (c) => {
  try {
    // Get the already-validated JSON body.
    const { notes, cards } = await c.req.valid('json');

    // Call the AI flashcard generation function.
    const result = await generateFlashcards(notes, cards);

    // Return structured JSON response to the client.
    return c.json(result);
  } catch (error: any) {
    console.error('Server Error:', error);

    return c.json(
      {
        error: 'Failed to generate flashcards.',
        details: error.message,
      },
      500
    );
  }
});

const port = 3000;

console.log(`🚀 Server running on http://localhost:${port}`);

// Start the Hono server.
serve({
  fetch: app.fetch,
  port,
});