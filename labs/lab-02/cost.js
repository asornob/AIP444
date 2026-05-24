async function getModelPricing(modelId) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");

    if (!response.ok) {
      throw new Error("Failed to fetch models");
    }

    const data = await response.json();
    const model = data.data.find((m) => m.id === modelId);

    if (!model || !model.pricing) {
      console.warn(`No pricing found for ${modelId}`);
      return { prompt: 0, completion: 0 };
    }

    return {
      prompt: parseFloat(model.pricing.prompt) || 0,
      completion: parseFloat(model.pricing.completion) || 0,
    };
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return { prompt: 0, completion: 0 };
  }
}

async function calculateCost(completion) {
  const modelId = completion.model;
  const usage = completion.usage;

  if (!modelId) {
    throw new Error("Completion response missing model field");
  }

  if (!usage) {
    throw new Error("Completion response missing usage field");
  }

  const pricing = await getModelPricing(modelId);

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || 0;

  const inputCost = promptTokens * pricing.prompt;
  const outputCost = completionTokens * pricing.completion;
  const totalCost = inputCost + outputCost;

  return {
    input: inputCost,
    output: outputCost,
    total: totalCost,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens,
    },
    model: modelId,
  };
}

module.exports = { calculateCost };