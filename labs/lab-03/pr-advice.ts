import "dotenv/config";

interface ParsedPrUrl {
  owner: string;
  repo: string;
  prNumber: number;
  originalUrl: string;
}

interface Comment {
  username: string;
  body: string;
  date: string;
}

const MAX_DIFF_LENGTH = 95000;

function parseGitHubPrUrl(inputUrl: string): ParsedPrUrl {
  const url = new URL(inputUrl);

  if (url.origin !== "https://github.com") {
    throw new Error("Error: URL must start with https://github.com");
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length !== 4 || parts[2] !== "pull") {
    throw new Error("Error: Please provide a valid GitHub Pull Request URL.");
  }

  const [owner, repo, , prNumberText] = parts;
  const prNumber = Number(prNumberText);

  if (!owner || !repo || !Number.isInteger(prNumber)) {
    throw new Error("Error: Invalid GitHub Pull Request URL.");
  }

  return {
    owner,
    repo,
    prNumber,
    originalUrl: inputUrl,
  };
}

async function fetchDiff(prUrl: string): Promise<string> {
  const diffUrl = `${prUrl}.diff`;
  const response = await fetch(diffUrl);

  if (!response.ok) {
    throw new Error(`GitHub Diff Error: ${response.status}`);
  }

  let diff = await response.text();

  if (diff.length > MAX_DIFF_LENGTH) {
    console.warn("Warning: Diff was too long and has been truncated.");
    diff = diff.slice(0, MAX_DIFF_LENGTH) + "\n...[Diff Truncated]...";
  }

  return diff;
}

async function fetchComments(
  owner: string,
  repo: string,
  issueNum: number
): Promise<Comment[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNum}/comments`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "AIP444-Lab-03",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status}`);
  }

  const data = await response.json();

  return data.map((item: any) => ({
    username: item.user.login,
    body: item.body,
    date: item.updated_at,
  }));
}

function buildCommentsXml(comments: Comment[]): string {
  if (comments.length === 0) {
    return "<thread>\nNo comments found for this PR.\n</thread>";
  }

  const commentBlocks = comments
    .map((comment) => {
      return `<comment username="${comment.username}" date="${comment.date}">
${comment.body}
</comment>`;
    })
    .join("\n\n");

  return `<thread>
${commentBlocks}
</thread>`;
}

function buildSystemPrompt(): string {
  return `You are a Senior Software Engineer helping a junior developer understand a GitHub Pull Request.

Your tone must be educational, clear, and rigorous. You value code safety, maintainability, readability, and practical engineering decisions over cleverness.

You will receive two types of context:
1. A GitHub diff inside a fenced diff code block.
2. Pull Request discussion comments inside XML tags.

Reasoning process:
1. First, analyze the diff carefully to understand the technical reality of the code changes.
2. Next, analyze the <thread> comments to understand the human context, concerns, decisions, and disagreements.
3. Next, reflect on assumptions, risks, constraints, implementation details, and the larger project context.
4. Finally, synthesize everything into a clear final report.

Do not invent facts. If something is unclear, say so.

Output a Markdown report with exactly these sections:

## tl;dr
A single-sentence summary of the PR's purpose. Maximum 30 words.

## Stakeholders
A bulleted list of every person who participated, with a one-line description of their stance or contribution.

## Changes
A file-by-file breakdown of what changed and why, written for a junior developer.

## Risks
Identify potential bugs, unhandled edge cases, or hidden assumptions. Rate each risk as Low, Medium, or High severity.

## Learning
Generate 3 questions that would test the user's understanding of the changes, like a senior developer teaching a junior developer.`;
}

function buildUserPrompt(pr: ParsedPrUrl, diff: string, commentsXml: string): string {
  return `Analyze this GitHub Pull Request.

PR URL: ${pr.originalUrl}
Owner: ${pr.owner}
Repo: ${pr.repo}
Pull Request Number: ${pr.prNumber}

Here is the code diff:

\`\`\`diff
${diff}
\`\`\`

Here is the PR conversation:

${commentsXml}`;
}

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY in .env file.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemma-4-31b-it:free",
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter Error: ${response.status}\n${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  const prUrl = process.argv[2];

  if (!prUrl) {
    console.error("Usage: npx tsx pr-advice.ts <GitHub PR URL>");
    process.exit(1);
  }

  try {
    const parsedPr = parseGitHubPrUrl(prUrl);

    console.log("Fetching PR diff...");
    const diff = await fetchDiff(parsedPr.originalUrl);

    console.log("Fetching PR comments...");
    const comments = await fetchComments(
      parsedPr.owner,
      parsedPr.repo,
      parsedPr.prNumber
    );

    const commentsXml = buildCommentsXml(comments);
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(parsedPr, diff, commentsXml);

    console.log("Sending to OpenRouter...");
    const report = await callOpenRouter(systemPrompt, userPrompt);

    console.log("\n================ PR ADVICE REPORT ================\n");
    console.log(report);
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
}

main();