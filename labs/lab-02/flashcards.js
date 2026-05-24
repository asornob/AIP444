require("dotenv").config();

const fs = require("fs");
const { parseArgs } = require("node:util");
const OpenAI = require("openai");
const { calculateCost } = require("./cost");

console.log("=================================");
console.log("Name: Al Sad Ornob");
console.log("Lab 2: ACE Flashcard Generator");
console.log("=================================\n");

function parseArguments() {
  const options = {
    cards: {
      type: "string",
      short: "c",
      default: "3",
    },
  };

  let values, positionals;

  try {
    ({ values, positionals } = parseArgs({
      options,
      allowPositionals: true,
    }));
  } catch (err) {
    console.error("Error parsing arguments:", err.message);
    process.exit(1);
  }

  if (positionals.length === 0) {
    console.error("Error: Please provide a notes file.");
    console.error("Usage: node flashcards.js test-notes.md --cards 3");
    process.exit(1);
  }

  const notesPath = positionals[0];
  const cards = parseInt(values.cards);

  if (isNaN(cards) || cards < 1 || cards > 5) {
    console.error("Error: --cards must be between 1 and 5.");
    process.exit(1);
  }

  return { notesPath, cards };
}

function readFile(path, description) {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (err) {
    console.error(`Error: ${description} not found: ${path}`);
    process.exit(1);
  }
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Error: OPENROUTER_API_KEY is missing in .env file.");
    process.exit(1);
  }

  const { notesPath, cards } = parseArguments();

  const systemPrompt = readFile(
    "SYSTEM_PROMPT.md",
    "System prompt file"
  );

  const notesContent = readFile(
    notesPath,
    "Notes file"
  );

  const userPrompt = `
Generate ${cards} ACE flashcard(s) from the notes below.

Use ONLY these notes.
Do NOT invent information.

<COURSE_NOTES>
${notesContent}
</COURSE_NOTES>

Important rules:
- Generate exactly ${cards} card(s) only if enough information exists
- Every EVIDENCE must be a direct quote from the notes
- Use exact ACE format
- Expand acronyms
- MISCONCEPTION must sound like a confused student quote
`;

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    const completion =
      await client.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct",

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

    const output =
      completion.choices[0].message.content;

    const cardRegex =
      /=== CARD \d+ ===[\s\S]*?===/g;

    const extractedCards =
      output.match(cardRegex);

    if (!extractedCards) {
      console.log(output);
      return;
    }

    console.log(
      `Generated ${extractedCards.length} flashcard(s):\n`
    );

    extractedCards.forEach((card) => {
      console.log(card);
      console.log();
    });

    const cost = await calculateCost(completion);

    console.log(
      `Total cost: $${cost.total.toFixed(6)}`
    );

    console.log(
      `Tokens used: ${cost.tokens.total}`
    );

  } catch (err) {
    console.error("\nError calling OpenRouter:");

    if (err.status === 429) {
      console.error(
        "Rate limit reached or free model unavailable."
      );
    } else {
      console.error(err.message);
    }
  }
}

main();