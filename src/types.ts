/** Options for {@link extractJson} and {@link tryExtractJson}. */
export interface ExtractOptions {
  /**
   * Apply conservative, string-aware repairs before parsing — currently the
   * removal of trailing commas, which models emit often. Never rewrites string
   * contents. Default `true`.
   */
  repair?: boolean;
  /**
   * Restrict which top-level JSON value to accept: an `'object'`, an `'array'`,
   * or `'any'` (the default).
   */
  expect?: 'object' | 'array' | 'any';
}

/** The result of {@link tryExtractJson}. */
export type ExtractResult<T> =
  | { found: true; value: T }
  | { found: false; value?: undefined };

/** Thrown by {@link extractJson} when no JSON value can be recovered. */
export class JsonExtractionError extends Error {
  constructor(
    message: string,
    /** The original text that no JSON could be extracted from. */
    public readonly text: string,
  ) {
    super(message);
    this.name = 'JsonExtractionError';
  }
}
