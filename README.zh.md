# 重试次数调节器

在聊天框里直接调整 LLM 提供方的重试次数。

[English](README.md) | 中文

一个斜杠命令，让你随时调整提供方的重试次数。不用重启、不用翻配置文件，输入 `/retry-count` 就行了。

![示例：重试计数显示 1/20](retry-count-example.png)

*上图中，重试消息显示为「已重试模型请求(1/20)」——第 1 次重试，共 20 次，而不是默认的 2 次。你可以看到当前重试次数和下一次重试的剩余时间。*

## 为什么需要它

- 老是看到「已重试模型请求（2/2）」？想让它多试几次。
- 担心 token 消耗太快？想减少不必要的重试。
- 测试提供方的稳定性？想拉到最大重试次数。
- 发现问题想快速失败？设成 0，一次定生死。

## 用法

在 DSH Web GUI 的聊天输入框里输入，和普通斜杠命令一样：

```
/retry-count <provider-name> <数字>
```

### 示例

| 命令 | 效果 |
|---|---|
| `/retry-count my-provider 5` | 最大重试次数设为 5 |
| `/retry-count my-provider 0` | 禁用重试 |
| `/retry-count my-provider 20` | 最大重试次数设为 20（上限） |
| `/retry-count` | 显示用法帮助（无参数时） |

### 执行后的反馈

**成功：**
```
Provider "my-provider" retry count updated to 5 (max 20). Changes take effect immediately.
```

**已经是这个值，无需修改：**
```
Provider "my-provider" already has maxRetries=5.
```

**提供方不存在：**
```
Provider "whoami" is not registered. Available: my-provider, another-provider
```

**数字无效：**
```
maxRetries must be an integer from 0 to 20
```

### 设置后的效果

下次你的提供方请求失败时，就会按新的次数重试。比如设成 5 后，你会看到：

```
已重试模型请求(1/5) · 1s
已重试模型请求(2/5) · 2s
...
```

设置会保存到 `settings.yaml` 中，重启 DSH 后依然有效。

## 原理

1. 你输入 `/retry-count my-provider 5`。
2. 插件检查提供方是否存在，数字是否在 0-20 之间。
3. 把新设置写入 `settings.yaml`。
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
- **仅 normal 模式** — 始终设置标准重试策略。需要 `always` 模式或自定义错误码的话，目前还不支持。
- **需要命令适配器** — 没有 `ctx.commands` 的界面用不了。Web GUI 自带一个。

## 许可证

MIT