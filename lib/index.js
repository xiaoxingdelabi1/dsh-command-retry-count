/**
 * Slash command to adjust LLM-provider retry count (maxRetries).
 *
 * Registers `/retry-count` through `ctx.commands` so every composed command
 * adapter discovers and executes it without a model turn. The handler reads
 * the current provider settings from the `llm-pi-ai` settings namespace,
 * validates the input, and persists the updated retry policy through the
 * settings seam. The pi-ai adapter detects the change and re-registers the
 * provider route with the new policy, so the update takes effect immediately.
 *
 * Passing `inf` (or `-1` / `infinite` / `∞`) switches the provider to the
 * unbounded `always` retry mode: every retryable failure is retried until it
 * succeeds or the request is interrupted.
 *
 * @module @deepseek-ai/dsh-command-retry-count
 */

import { resolveRetryPolicy } from '@deepseek-ai/dsh-llm';
import { deepEqualJson } from '@deepseek-ai/dsh-settings';

const name = 'command-retry-count';
const inject = ['commands', 'settings', 'llm'];
const USAGE = 'Usage: /retry-count <provider> <maxRetries|inf>  (e.g. /retry-count my-provider 5, /retry-count my-provider inf)';
const MIN_RETRIES = 0;
const MAX_RETRIES = 20;
const DEFAULT_BACKOFF = { initialDelayMs: 500, maxDelayMs: 10000, jitterRatio: 0.1 };
const INFINITE_TOKENS = new Set(['inf', 'infinite', 'infinity', '-1', '∞']);

/**
 * Parse the retry argument.
 * @returns a safe integer in [MIN_RETRIES, MAX_RETRIES], Infinity for
 *   unlimited (`always` mode), or undefined when invalid.
 */
function parseMaxRetries(value) {
	const normalized = String(value).trim().toLowerCase();
	if (INFINITE_TOKENS.has(normalized)) return Infinity;
	const n = Number(value);
	if (!Number.isSafeInteger(n) || n < MIN_RETRIES || n > MAX_RETRIES) return undefined;
	return n;
}

/**
 * Build a full resolved retry policy.
 * @param maxRetries - finite count for `normal` mode, or Infinity for `always`.
 * @param backoff - nested backoff config ({ initialDelayMs, maxDelayMs, jitterRatio }).
 */
function buildRetryPolicy(maxRetries, backoff, retryableCodes) {
	return resolveRetryPolicy(
		maxRetries === Infinity
			? { mode: 'always', backoff }
			: { mode: 'normal', maxRetries, retryableCodes, backoff },
		'retry-count: retryPolicy'
	);
}

/** Serialize a resolved (flat) policy back to the persisted nested settings shape. */
function policyToSettings(policy) {
	const backoff = {
		initialDelayMs: policy.initialDelayMs,
		maxDelayMs: policy.maxDelayMs,
		jitterRatio: policy.jitterRatio
	};
	if (policy.mode === 'always') return { mode: 'always', backoff };
	return {
		mode: 'normal',
		maxRetries: policy.maxRetries,
		retryableCodes: policy.retryableCodes,
		backoff
	};
}

/** Human-readable summary of a resolved policy. */
function describePolicy(policy) {
	return policy.mode === 'always'
		? 'unlimited (always mode — retries until success or interruption)'
		: `maxRetries=${policy.maxRetries}`;
}

/** Execute one retry-count command. */
async function executeRetryCount(ctx, invocation) {
	const raw = invocation.rawInput.trim();
	if (raw.length === 0) {
		return { kind: 'error', text: USAGE };
	}

	const parts = raw.split(/\s+/);
	if (parts.length !== 2) {
		return { kind: 'error', text: USAGE };
	}

	const provider = parts[0];
	if (provider.length === 0) {
		return { kind: 'error', text: USAGE };
	}

	const maxRetries = parseMaxRetries(parts[1]);
	if (maxRetries === undefined) {
		return {
			kind: 'error',
			text: `maxRetries must be an integer from ${MIN_RETRIES} to ${MAX_RETRIES}, or "inf" for unlimited retries`
		};
	}

	// Validate provider exists
	const providers = await ctx.llm.listProviders();
	if (!providers.some((p) => p.id === provider)) {
		return {
			kind: 'error',
			text: `Provider "${provider}" is not registered. Available: ${providers.map((p) => p.id).join(', ')}`
		};
	}

	// Read current settings to build the patch
	const current = ctx.settings.get('llm-pi-ai') ?? {};
	const currentProviders = current.providers ?? {};
	const existingPolicy = currentProviders[provider]?.retryPolicy;

	// Preserve the provider's tuned backoff and retryable codes when present;
	// fall back to defaults. `always` mode ignores retryableCodes by schema.
	const newPolicy = buildRetryPolicy(
		maxRetries,
		existingPolicy?.backoff ?? DEFAULT_BACKOFF,
		existingPolicy?.retryableCodes
	);
	const patchPolicy = policyToSettings(newPolicy);

	// Check if anything actually changed
	if (existingPolicy && deepEqualJson(existingPolicy, patchPolicy)) {
		return { kind: 'success', text: `Provider "${provider}" already has ${describePolicy(newPolicy)}.` };
	}

	// Update settings — the pi-ai adapter will detect the change and re-register.
	// settings.update() deep-merges, so switching to `always` mode would leave
	// the previous normal-mode keys (maxRetries/retryableCodes) behind, and the
	// always-mode schema rejects them. mutate() replaces the whole retryPolicy
	// node instead, so the stored policy is always exactly what we resolved.
	await ctx.settings.mutate('llm-pi-ai', [
		{ op: 'set', path: ['providers', provider, 'retryPolicy'], value: patchPolicy }
	]);

	const effectivePolicy = ctx.llm.providerRetryPolicy(provider);
	return {
		kind: 'success',
		text: `Provider "${provider}" retry policy updated to ${describePolicy(effectivePolicy)}. Changes take effect immediately.`
	};
}

/** Register `/retry-count` command. */
function apply(ctx) {
	const handler = (invocation) => executeRetryCount(ctx, invocation);
	ctx.commands.register({
		name: 'retry-count',
		description: 'Adjust LLM provider retry count (maxRetries 0-20, "inf" for unlimited)',
		input: { hint: '<provider> <maxRetries|inf>' },
		handler
	});
}

export { apply, inject, name };
