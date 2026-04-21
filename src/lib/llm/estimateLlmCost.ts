/**
 * Optional USD estimate from token usage. Set both env vars to numbers in USD per 1M tokens
 * (same convention as many provider price sheets).
 */
export function estimateLlmCostUsd(
  inputTokens?: number,
  outputTokens?: number
): number | undefined {
  const inRaw = process.env.LLM_PRICE_INPUT_PER_1M;
  const outRaw = process.env.LLM_PRICE_OUTPUT_PER_1M;
  if (
    inRaw === undefined ||
    outRaw === undefined ||
    inputTokens === undefined ||
    outputTokens === undefined
  ) {
    return undefined;
  }
  const inputPerM = Number(inRaw);
  const outputPerM = Number(outRaw);
  if (!Number.isFinite(inputPerM) || !Number.isFinite(outputPerM)) {
    return undefined;
  }
  return +(inputTokens * (inputPerM / 1_000_000) + outputTokens * (outputPerM / 1_000_000)).toFixed(
    6
  );
}
