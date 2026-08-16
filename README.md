# Retry Count Controller

Adjust your LLM provider's retry limit from the chat box.

English | [中文](README.zh.md)

A slash command that lets you change how many times your provider retries a failed request — or switch to unlimited retries. No restart, no config file hunting — just type `/retry-count` and you're done.

![Example: retry count showing 1/20](retry-count-example.png)

*In the screenshot above, the retry message now reads "已重试模型请求(1/20)" — retry 1 of 20, instead of the default 2. You can see the current retry count and the remaining time before the next attempt.*

## Why you might want this

- You keep seeing "retry model request (2/2)" and want more attempts before giving up.
- You're watching your token usage and want to reduce unnecessary retries.
- You're testing provider behavior and want to crank retries up to the max.
- A flaky provider keeps dropping your request — set it to `inf` and it will keep retrying until it succeeds (or you interrupt it).
- You want to fail fast when something is broken — set it to 0 and move on.

## Usage

Type the command in your DSH Web GUI chat input, just like any other slash command:

```
/retry-count <provider-name> <number|inf>
```

### Examples

| Command | What it does |
|---|---|
| `/retry-count my-provider 5` | Set max retries to 5 |
| `/retry-count my-provider 0` | Disable retries entirely |
| `/retry-count my-provider 20` | Set max retries to 20 (maximum allowed) |
| `/retry-count my-provider inf` | Unlimited retries (always mode) — keep retrying until success or interruption (`-1`, `infinite`, `infinity` and `∞` work too) |
| `/retry-count` | Show usage help (no arguments) |

### After you run it

The plugin will respond with one of these messages:

**Success (limited):**
```
Provider "my-provider" retry policy updated to maxRetries=5. Changes take effect immediately.
```

**Success (unlimited):**
```
Provider "my-provider" retry policy updated to unlimited (always mode — retries until success or interruption). Changes take effect immediately.
```

**No change needed (same value already set):**
```
Provider "my-provider" already has maxRetries=5.
Provider "my-provider" already has unlimited (always mode — retries until success or interruption).
```

**Provider not found:**
```
Provider "whoami" is not registered. Available: my-provider, another-provider
```

**Invalid number:**
```
maxRetries must be an integer from 0 to 20, or "inf" for unlimited retries
```

### What happens next

The next time your provider fails a model request, the retry count will use your new setting. If you set it to 5, you'll see:

```
已重试模型请求(1/5) · 1s
已重试模型请求(2/5) · 2s
...
```

With `inf`, retries never give up on their own — the counter keeps climbing (1/∞, 2/∞, ...) until the request succeeds or you stop it. The change is saved to `settings.yaml` and persists across DSH restarts.

![Example: unlimited retry showing 1/∞](retry-count-infinite-example.png)

*With unlimited retries enabled, the retry counter shows "1/无限" — attempt 1 of infinity. The counter keeps climbing and each retry waits with exponential backoff (capped at 60s) until the request succeeds or you manually stop it.*

> ⚠️ **Unlimited retries can hammer a provider that is down.** Every retry waits with exponential backoff (capped), and stopping the request cancels any in-flight retry — but a persistently failing provider will keep being retried indefinitely. Use `inf` deliberately and switch back to a finite number when you're done.

## How it works

1. You type `/retry-count my-provider 5` (or `inf`).
2. The plugin checks that the provider exists and the value is valid (0-20, or `inf`).
3. It writes the new setting to `settings.yaml` — `inf` stores an `always`-mode retry policy.
4. The pi-ai adapter picks up the change instantly and re-registers the provider route with the new retry policy.
5. Done. No restart, no reload.

## Installation

```yaml
# In your cordis.patch.yml
- insert:
    - id: retry-count
      name: '@deepseek-ai/dsh-command-retry-count'
```

The base layer already has everything else this plugin needs.

## A note for the model

- The model never sees this command. It's between you and the settings file.
- It costs zero tokens.
- It doesn't affect the conversation cache or history.

## Known limitations

- **pi-ai only** — this command works with providers configured through `dsh-llm-pi-ai`. If you're using the native DeepSeek adapter (`dsh-llm-deepseek`), the plugin won't work for you yet.
- **Count or unlimited only** — you can set a retry count (0-20) or unlimited (`inf`). Custom retryable error-code lists and fine-grained backoff tuning aren't exposed by this command.
- **Needs a command adapter** — surfaces without `ctx.commands` can't use it. The Web GUI has one built in.

## License

MIT
