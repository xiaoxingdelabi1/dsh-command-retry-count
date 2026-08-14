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
 * @module @deepseek-ai/dsh-command-retry-count
 */

import { resolveRetryPolicy } from '@deepseek-ai/dsh-llm';
import { deepEqualJson } from '@deepseek-ai/dsh-settings';

const name = 'command-retry-count';
const inject = ['commands', 'settings', 'llm'];
const USAGE = 'Usage: /retry-count <provider> <maxRetries>  (e.g. /retry-count sense 5)';
const MIN_RETRIES = 0;
const MAX_RETRIES = 20;

/** Validate a retry count, returning undefined if invalid. */
function parseMaxRetries(value) {
	const n = Number(value);
	if (!Number.isSafeInteger(n) || n < MIN_RETRIES || n > MAX_RETRIES) return undefined;
	return n;
}

/** Build a full resolved retry policy with the desired maxRetries. */
function buildRetryPolicy(maxRetries) {
	return resolveRetryPolicy(
		{
			mode: 'normal',
			maxRetries,
			backoff: { initialDelayMs: 500, maxDelayMs: 10000, jitterRatio: 0.1 }
		},
		'retry-count: retryPolicy'
	);
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
		return { kind: 'error', text: `maxRetries must be an integer from ${MIN_RETRIES} to ${MAX_RETRIES}` };
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

	// Build the new retry policy
	const newPolicy = buildRetryPolicy(maxRetries);

	// Build patch — only the provider we're updating
	const patch = {
		providers: {
			[provider]: {
				retryPolicy: {
					mode: newPolicy.mode,
					maxRetries: newPolicy.maxRetries,
					retryableCodes: newPolicy.retryableCodes,
					backoff: newPolicy.backoff
				}
			}
		}
	};

	// Check if anything actually changed
	const currentPolicy = currentProviders[provider]?.retryPolicy;
	if (currentPolicy && deepEqualJson(currentPolicy, {
		mode: newPolicy.mode,
		maxRetries: newPolicy.maxRetries,
		retryableCodes: newPolicy.retryableCodes,
		backoff: newPolicy.backoff
	})) {
		return { kind: 'success', text: `Provider "${provider}" already has maxRetries=${maxRetries}.` };
	}

	// Update settings — the pi-ai adapter will detect the change and re-register
	await ctx.settings.update('llm-pi-ai', patch);

	const effectivePolicy = ctx.llm.providerRetryPolicy(provider);
	return {
		kind: 'success',
		text: `Provider "${provider}" retry count updated to ${effectivePolicy.maxRetries} (max ${MAX_RETRIES}). Changes take effect immediately.`
	};
}

/** Register `/retry-count` command. */
function apply(ctx) {
	const handler = (invocation) => executeRetryCount(ctx, invocation);
	ctx.commands.register({
		name: 'retry-count',
		description: 'Adjust LLM provider retry count (maxRetries 0-20)',
		input: { hint: '<provider> <maxRetries>' },
		handler
	});
}

export { apply, inject, name };