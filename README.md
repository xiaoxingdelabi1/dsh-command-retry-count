# Retry Count Controller

Adjust your LLM provider's retry limit from the chat box.

English | [中文](README.zh.md)

A slash command that lets you change how many times your provider retries a failed request. No restart, no config file hunting — just type `/retry-count` and you're done.

![Example: retry count showing 1/20](retry-count-example.png)

*In the screenshot above, the retry message now reads "已重试模型请求(1/20)" — retry 1 of 20, instead of the default 2. You can see the current retry count and the remaining time before the next attempt.*

## Why you might want this

- You keep seeing "retry model request (2/2)" and want more attempts before giving up.
- You're watching your token usage and want to reduce unnecessary retries.
- You're testing provider behavior and want to crank retries up to the max.
- You want to fail fast when something is broken — set it to 0 and move on.

## Usage

Type the command in your DSH Web GUI chat input, just like any other slash command:

```
/retry-count <provider-name> <number>
```

### Examples

| Command | What it does |
|---|---|
| `/retry-count my-provider 5` | Set max retries to 5 |
| `/retry-count my-provider 0` | Disable retries entirely |
| `/retry-count my-provider 20` | Set max retries to 20 (maximum allowed) |
| `/retry-count` | Show usage help (no arguments) |

### After you run it

The plugin will respond with one of these messages:

**Success:**
```
Provider "my-provider" retry count updated to 5 (max 20). Changes take effect immediately.
```

**No change needed (same value already set):**
```
Provider "my-provider" already has maxRetries=5.
```

**Provider not found:**
```
Provider "whoami" is not registered. Available: my-provider, another-provider
```

**Invalid number:**
```
maxRetries must be an integer from 0 to 20
```

### What happens next

The next time your provider fails a model request, the retry count will use your new setting. If you set it to 5, you'll see:

```
已重试模型请求(1/5) · 1s
已重试模型请求(2/5) · 2s
...
```

The change is saved to `settings.yaml` and persists across DSH restarts.

## How it works

1. You type `/retry-count my-provider 5`.
2. The plugin checks that the provider exists and the number is valid (0-20).
3. It writes the new setting to `settings.yaml`.
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
- **Normal mode only** — it always sets a standard retry policy. If you need `always` mode or custom error codes, that's not currently supported.
- **Needs a command adapter** — surfaces without `ctx.commands` can't use it. The Web GUI has one built in.

## License

MIT