/**
 * Build-time feature flags.
 *
 * CUSTOM_INPUT_ENABLED — live custom-input tracing is DEFERRED (D12). The UI and
 * handlers stay in the codebase but are gated behind this flag so the dead UI is
 * tree-shakeable and obviously off. Flip to `true` (and ship the sandboxed runtime
 * per rules/Security.md) to re-enable it.
 */
export const CUSTOM_INPUT_ENABLED = false;
