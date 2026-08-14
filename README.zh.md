# @deepseek-ai/dsh-command-retry-count

[English](README.md) | 中文

调整 LLM 提供方重试次数（maxRetries）的斜杠命令。通过 [`ctx.commands`](../../interaction/commands/README.md) 注册 `/retry-count`，因此每个组合的命令适配器都能发现并执行它，无需模型参与。

该命令从 `llm-pi-ai` 设置命名空间读取当前提供方配置，验证输入，然后通过设置 seam 持久化更新后的重试策略。pi-ai 适配器检测到变化后，通过其 `registration.replace()` 机制重新注册提供方路由，因此更新会立即生效。

## 命令约定

| 输入 | 结果 |
|---|---|
| `/retry-count sense 5` | 将 `sense` 提供方的 maxRetries 更新为 5（范围为 0-20）。 |
| `/retry-count sense 0` | 禁用 `sense` 提供方的重试。 |
| `/retry-count sense 20` | 将 maxRetries 设置为最大值 20。 |
| `/retry-count <unknown> 5` | `Provider "<unknown>" is not registered. Available: sense, ...` |
| `/retry-count sense 25` | `maxRetries must be an integer from 0 to 20` |
| `/retry-count`（无参数） | `Usage: /retry-count <provider> <maxRetries>` |

该命令验证提供方存在于当前 LLM 路由注册表中，并将重试次数限制在 [0, 20] 范围内。值为 0 将完全禁用重试。设置会持久化到 `settings.yaml` 文件中的 `llm-pi-ai.providers.<name>.retryPolicy` 路径下，并通过 pi-ai 适配器的热重载机制立即生效。

## 组合

生产者注入 `commands`、`settings` 和 `llm` 服务。挂载命令注册表和此插件：

```yaml
- id: commands
  name: '@deepseek-ai/dsh-commands'
- id: retry-count
  name: '@deepseek-ai/dsh-command-retry-count'
```

部署中还需要组合 `llm-pi-ai` 适配器和 `settings-file` 提供方（它们已存在于官方 `dsh` 基础层中）。

## 模型体验

### 人类 `/retry-count` 控制

#### 模型看到的内容

斜杠输入和直接结果永远不会进入模型请求。该命令写入持久的设置文档，pi-ai 适配器通过其 `installSettingsSection` 监视器拾取更改，并重新注册提供方路由。

#### Token 影响

命令生命周期不会增加模型 token。更改 maxRetries 会影响 `dsh-llm-retry` 插件在后续模型请求失败时进行的重试尝试次数。

#### KV Cache 影响

该命令不会更改任何模型请求前缀或历史记录。仅更新提供方路由上的重试策略；后续重试将使用新的次数。

## 已知限制与暂缓事项

- **仅 pi-ai 适配器** — 该命令写入 `llm-pi-ai` 设置命名空间。对于 `llm-deepseek` 适配器，需要单独的命令或命名空间补丁。
- **仅 normal 模式** — 该命令始终设置 `normal` 模式的重试策略。always 模式或自定义 retryableCodes 未通过命令接口暴露。
- **仅命令适配器** — 没有 `ctx.commands` 的表面无法调用它，需依赖设置文档中的默认重试策略。