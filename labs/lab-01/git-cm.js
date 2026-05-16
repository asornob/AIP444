require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const OpenAI = require('openai');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const isCreative = process.argv.includes('--creative');

console.log("git-cm: Developed by Al Sad Ornob - 130207236");

const now = new Date();
console.log("Run Date:", now.toLocaleString());
console.log("--------------------------------------------------------------");

if (!OPENROUTER_API_KEY) {
  console.log("❌ Error: OPENROUTER_API_KEY not found");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

async function getGitDiff() {
  try {
    const { stdout } = await execAsync('git diff --staged');
    const diff = stdout.trim();

    if (!diff) {
      console.log("❌ No staged changes found");
      process.exit(1);
    }

    console.log(`✅ Diff found: ${diff.length} characters`);
    return diff;

  } catch (error) {
    console.log("❌ Not a git repo");
    process.exit(1);
  }
}

async function generateCommitMessage(diff) {

  const systemPrompt = isCreative
    ? "You are a pirate programmer. Write a funny git commit message using gitmoji and pirate slang. Output ONLY the commit message."
    : "You are an AI assistant that writes Conventional Commit messages. Output ONLY the commit message with no explanation or markdown.";

  const temperature = isCreative ? 1.2 : 0.1;

  try {

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: diff
        }
      ],
      temperature: temperature
    });

    console.log("\nGenerated Commit Message:\n");
    console.log(completion.choices[0].message.content);

  } catch (error) {

    console.log("❌ Error generating commit message");
    console.log(error.message);

  }
}

async function main() {
  const diff = await getGitDiff();
  await generateCommitMessage(diff);
}

main();