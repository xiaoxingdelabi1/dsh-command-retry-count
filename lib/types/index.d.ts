/**
 * Slash command to adjust LLM-provider retry count (maxRetries).
 * @module @deepseek-ai/dsh-command-retry-count
 */
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "command-retry-count";
export declare const inject: string[];
/**
 * Register `/retry-count` for every composed command adapter.
 * @param ctx - context carrying the command registry, settings, and LLM services.
 */
export declare function apply(ctx: Context): void;