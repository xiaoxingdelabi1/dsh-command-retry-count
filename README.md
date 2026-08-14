# 🎮 dsh-command-retry-count

English | [中文](README.zh.md)

> **"Hey, stop retrying so much!"** — said no one ever. But now you can decide exactly how many times your LLM provider should pick itself up and try again. 🚀

## 🧐 What's this?

A nifty slash command that lets you **tweak the retry count** of your LLM provider on the fly — no restarts, no config file hunting, no drama.

Just type `/retry-count` in your DSH Web GUI, and watch the magic happen.

## 🎯 Why do I need it?

- 😤 **Tired of seeing "重试模型请求（2/2）"** after every blip? Crank it up!
- 💸 **Watching your token bill climb** because retries keep piling up? Dial it down!
- 🧪 **Testing your provider's resilience**? Set it to 20 and let it rip!
- 🛑 **Want to fail fast** when something's broken? Set it to 0 and embrace the chaos!

## 🕹️ How to use

```bash
/retry-count my-provider 5      # "You get 5 tries. No more, no less."
/retry-count my-provider 0      # "Zero retries. Sink or swim, baby!"
/retry-count my-provider 20     # "MAXIMUM OVERDRIVE! Go go go!"
```

### What happens?

| You type | You get |
|---|---|
| `/retry-count my-provider 5` | ✅ Retry count → 5 |
| `/retry-count my-provider 0` | ✅ Retries disabled (fail fast!) |
| `/retry-count my-provider 20` | ✅ Max retries (20) |
| `/retry-count whoami 5` | ❌ `"Provider 'whoami' is not registered. Available: my-provider, ..."` |
| `/retry-count my-provider 99` | ❌ `"maxRetries must be an integer from 0 to 20"` |
| `/retry-count` | ❌ `"Usage: /retry-count <provider> <maxRetries>"` |

## ⚡ How does it work?

1. You type `/retry-count my-provider 5`
2. The plugin checks that `my-provider` is a real provider (no typos allowed!)
3. It validates your number (0-20, we're not animals)
4. It writes the new setting to `settings.yaml` 📝
5. The pi-ai adapter **instantly detects the change** 🔥
6. It re-registers the provider route with the new retry policy
7. **Boom. Done.** No restart. No reload. No "please wait". 🎉

## 🏗️ Installation

```yaml
# In your cordis.patch.yml
- insert:
    - id: retry-count
      name: '@deepseek-ai/dsh-command-retry-count'
```

That's it. The base layer already has everything else it needs.

## 🤔 What the model thinks

| Question | Answer |
|---|---|
| **Does the model see this command?** | Nope. It's between you and the settings file. 🤫 |
| **Does it cost tokens?** | Zero. Zilch. Nada. |
| **Does it mess with the conversation cache?** | Not at all. The model's context stays untouched. |

## 🚧 Known quirks

- **pi-ai only** — works with `dsh-llm-pi-ai` providers. If you're using the native DeepSeek adapter, this isn't the droid you're looking for.
- **Normal mode only** — always sets a standard retry policy. Want `always` mode or custom error codes? That's a feature for another day.
- **Needs a command adapter** — surfaces without `ctx.commands` can't use it. But hey, the Web GUI has one!

## 📜 License

MIT — do whatever you want, just don't blame us if your provider goes rogue. 😉

---

**Made with ❤️ for the DeepSeek Harness community**