# 重试次数调节器

在聊天框里直接调整 LLM 提供方的重试次数。

[English](README.md) | 中文

一个斜杠命令，让你随时调整提供方的重试次数——也可以设为无限重试。不用重启、不用翻配置文件，输入 `/retry-count` 就行了。

![示例：重试计数显示 1/20](retry-count-example.png)

*上图中，重试消息显示为「已重试模型请求(1/20)」——第 1 次重试，共 20 次，而不是默认的 2 次。你可以看到当前重试次数和下一次重试的剩余时间。*

## 为什么需要它

- 老是看到「已重试模型请求（2/2）」？想让它多试几次。
- 担心 token 消耗太快？想减少不必要的重试。
- 测试提供方的稳定性？想拉到最大重试次数。
- 提供方时好时坏、请求总被丢掉？设成 `inf`，它会一直重试到成功（或你手动打断）。
- 发现问题想快速失败？设成 0，一次定生死。

## 用法

在 DSH Web GUI 的聊天输入框里输入，和普通斜杠命令一样：

```
/retry-count <provider-name> <数字|inf>
```

### 示例

| 命令 | 效果 |
|---|---|
| `/retry-count my-provider 5` | 最大重试次数设为 5 |
| `/retry-count my-provider 0` | 禁用重试 |
| `/retry-count my-provider 20` | 最大重试次数设为 20（上限） |
| `/retry-count my-provider inf` | 无限重试（always 模式）——一直重试到成功或被打断（`-1`、`infinite`、`infinity`、`∞` 也可以） |
| `/retry-count` | 显示用法帮助（无参数时） |

### 执行后的反馈

**成功（有限次）：**
```
Provider "my-provider" retry policy updated to maxRetries=5. Changes take effect immediately.
```

**成功（无限次）：**
```
Provider "my-provider" retry policy updated to unlimited (always mode — retries until success or interruption). Changes take effect immediately.
```

**已经是这个值，无需修改：**
```
Provider "my-provider" already has maxRetries=5.
Provider "my-provider" already has unlimited (always mode — retries until success or interruption).
```

**提供方不存在：**
```
Provider "whoami" is not registered. Available: my-provider, another-provider
```

**数字无效：**
```
maxRetries must be an integer from 0 to 20, or "inf" for unlimited retries
```

### 设置后的效果

下次你的提供方请求失败时，就会按新的次数重试。比如设成 5 后，你会看到：

```
已重试模型请求(1/5) · 1s
已重试模型请求(2/5) · 2s
...
```

设成 `inf` 后，重试永远不会自己放弃——计数会一直往上走（1/∞、2/∞……），直到请求成功或你停止它。设置会保存到 `settings.yaml` 中，重启 DSH 后依然有效。

![示例：无限重试显示 1/无限](retry-count-infinite-example.png)

*开启无限重试后，重试计数器显示「1/无限」——第 1 次重试，无上限。计数会持续递增，每次重试等待时间按指数退避（封顶 60 秒），直到请求成功或你手动停止。*

> ⚠️ **无限重试可能把挂掉的提供方打到冒烟。** 每次重试都有指数退避（封顶），请求被停止时进行中的重试也会被取消——但如果提供方持续失败，它会一直被重试。请在有意的场景下使用 `inf`，用完记得切回有限次数。

## 原理

1. 你输入 `/retry-count my-provider 5`（或 `inf`）。
2. 插件检查提供方是否存在，数值是否合法（0-20，或 `inf`）。
3. 把新设置写入 `settings.yaml`——`inf` 会存成 `always` 模式的重试策略。
4. pi-ai 适配器瞬间检测到变化，用新的重试策略重新注册提供方路由。
5. 搞定。不用重启，不用刷新。

## 安装

```yaml
# 在 cordis.patch.yml 里加一行
- insert:
    - id: retry-count
      name: '@deepseek-ai/dsh-command-retry-count'
```

基础层已经自带所有依赖了。

## 对模型的影响

- 模型看不到这个命令，它只在你和配置文件之间。
- 不消耗任何 token。
- 不影响对话缓存和历史。

## 已知限制

- **仅支持 pi-ai** — 适用于通过 `dsh-llm-pi-ai` 配置的提供方。如果你用的是原生 DeepSeek 适配器（`dsh-llm-deepseek`），这个插件暂时用不了。
- **只支持次数或无限** — 可以设重试次数（0-20）或无限（`inf`）。自定义可重试错误码列表和细粒度退避调参不在此命令范围内。
- **需要命令适配器** — 没有 `ctx.commands` 的界面用不了。Web GUI 自带一个。

## 许可证

MIT
