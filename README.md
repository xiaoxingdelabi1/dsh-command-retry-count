# @deepseek-ai/dsh-command-retry-count

English | [中文](README.zh.md)

Slash command to adjust LLM-provider retry count (maxRetries). Registers `/retry-count` through [`ctx.commands`](../../interaction/commands/README.md), so every composed command adapter discovers and executes it without a model turn.

The command reads the current provider settings from the `llm-pi-ai` settings namespace, validates the input, and persists the updated retry policy through the settings seam. The pi-ai adapter detects the change and re-registers the provider route with the new policy via its `registration.replace()` mechanism, so the update takes effect immediately.

## Command contract

| Input | Result |
|---|---|
| `/retry-count sense 5` | Updates `sense` provider's maxRetries to 5 (0-20 range). |
| `/retry-count sense 0` | Disables retries for the `sense` provider. |
| `/retry-count sense 20` | Sets maxRetries to the maximum of 20. |
| `/retry-count <unknown> 5` | `Provider "<unknown>" is not registered. Available: sense, ...` |
| `/retry-count sense 25` | `maxRetries must be an integer from 0 to 20` |
| `/retry-count` (no args) | `Usage: /retry-count <provider> <maxRetries>` |

The command validates the provider exists in the current LLM route registry and bounds the retry count to [0, 20]. A value of 0 disables retries entirely. Settings are persisted to `settings.yaml` under the `llm-pi-ai.providers.<name>.retryPolicy` path and take effect immediately through the pi-ai adapter's hot-reload mechanism.

## Composition

The producer injects `commands`, `settings`, and `llm`. Mount the command registry and this plugin:

```yaml
- id: commands
  name: '@deepseek-ai/dsh-commands'
- id: retry-count
  name: '@deepseek-ai/dsh-command-retry-count'
```

The `llm-pi-ai` adapter and `settings-file` provider must also be composed in the deployment (they are present in the shipped `dsh` base layer).

## Model Experience

### Human `/retry-count` control

#### What the model sees

The slash input and direct result never enter a model request. The command writes to the durable settings document, which the pi-ai adapter picks up through its `installSettingsSection` watcher and re-registers the provider route.

#### Token effect

The command lifecycle adds no model tokens. A change to maxRetries affects the number of retry attempts the `dsh-llm-retry` plugin makes on subsequent model-request failures.

#### KV Cache effect

The command does not change any model request prefix or history. Only the retry policy on the provider route is updated; subsequent retries use the new count.

## Known Limitations and Deferred Work

- **pi-ai adapter only** — the command writes to the `llm-pi-ai` settings namespace. For the `llm-deepseek` adapter, a separate command or namespace patch is needed.
- **Normal mode only** — the command always sets a `normal` mode retry policy. Always-mode or custom retryableCodes are not exposed through the command interface.
- **Command adapters only** — surfaces without `ctx.commands` cannot invoke it and rely on the default retry policy from the settings document.