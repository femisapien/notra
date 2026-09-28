export const PERPLEXITY_THINKING_MS = 1300;
export const PERPLEXITY_THINKING_GAP_MS = 100;
export const PERPLEXITY_SEARCH_HEADER_MS = 400;
export const PERPLEXITY_SEARCH_QUERY_MS = 450;
export const PERPLEXITY_SEARCH_SOURCES_MS = 160;
export const PERPLEXITY_SEARCH_STAGGER_MS = 65;

export function perplexitySearchDuration(
  queryCount: number,
  sourceCount: number,
  reducedMotion: boolean
) {
  if (reducedMotion) {
    return 0;
  }

  return (
    PERPLEXITY_SEARCH_HEADER_MS +
    queryCount * PERPLEXITY_SEARCH_QUERY_MS +
    sourceCount * PERPLEXITY_SEARCH_STAGGER_MS +
    PERPLEXITY_SEARCH_SOURCES_MS
  );
}
