# 🎮 dsh-command-retry-count

[English](README.md) | 中文

> **"别重试了，再试就没了！"** —— 但有了这个插件，**你说了算**。🚀

## 🧐 这是啥？

一个超好用的斜杠命令，让你在 **Web 界面里随手调整 LLM 提供方的重试次数**——不用重启、不用翻配置文件、不费吹灰之力。

只需在输入框里敲 `/retry-count`，事情就成了。

## 🎯 为什么需要它？

- 😤 **看够了「已重试模型请求（2/2）」**？那就给它拉满！
- 💸 **眼瞅着 token 账单蹭蹭涨**？那就给它降下来！
- 🧪 **想测试一下提供方的稳定性**？设成 20，让它反复横跳！
- 🛑 **发现问题想快速失败**？设成 0，拥抱混乱！

## 🕹️ 怎么用

```bash
/retry-count sense 5      # "sense，给你 5 次机会，好好把握。"
/retry-count sense 0      # "零次重试，一次定生死！"
/retry-count sense 20     # "最大火力！给我冲！"
```

### 结果一览

| 你输入 | 你得到 |
|---|---|
| `/retry-count sense 5` | ✅ `sense` 重试次数 → 5 |
| `/retry-count sense 0` | ✅ 禁用重试（快速失败） |
| `/retry-count sense 20` | ✅ 最大重试次数（20 次） |
| `/retry-count whoami 5` | ❌ `"Provider 'whoami' is not registered. Available: sense"` |
| `/retry-count sense 99` | ❌ `"maxRetries must be an integer from 0 to 20"` |
| `/retry-count`（无参数） | ❌ `"Usage: /retry-count <provider> <maxRetries>"` |

## ⚡ 原理是？

1. 你输入 `/retry-count sense 5`
2. 插件检查 `sense` 是不是真的存在（不能乱写！）
3. 验证数字在 0-20 之间（我们是有底线的）
4. 把新设置写入 `settings.yaml` 📝
5. pi-ai 适配器**瞬间检测到变化** 🔥
6. 用新的重试策略重新注册提供方路由
7. **搞定。** 不用重启、不用刷新、不用"请稍候"。🎉

## 🏗️ 安装方法

```yaml
# 在 cordis.patch.yml 里加一行
- insert:
    - id: retry-count
      name: '@deepseek-ai/dsh-command-retry-count'
```

就这。基础层已经自带所有依赖了。

## 🤔 模型怎么看？

| 问题 | 回答 |
|---|---|
| **模型能看到这个命令吗？** | 看不到。这是你和配置文件之间的秘密。🤫 |
| **会消耗 token 吗？** | 零。一个子儿都不花。 |
| **会影响对话缓存吗？** | 完全不影响。模型的上下文纹丝不动。 |

## 🚧 已知的小毛病

- **仅支持 pi-ai**——适用于 `dsh-llm-pi-ai` 提供方。如果你用的是原生 DeepSeek 适配器，这个插件暂时帮不了你。
- **仅 normal 模式**——始终设置标准重试策略。想要 `always` 模式或自定义错误码？那是以后的事。
- **需要命令适配器**——没有 `ctx.commands` 的表面用不了。不过放心，Web GUI 自带一个！

## 📜 许可证

MIT —— 想怎么用就怎么用，但你的提供方要是抽风了可别怪我们。😉

---

**❤️ 为 DeepSeek Harness 社区打造**