# 学习模态预设 (modality_presets.md)

> Phase 0 必选；Phase 1/2 提案与生成时必须遵守当前预设。  
> 用户可随时改预设（改 `profile.md` + 在 `AGENT.md` 状态区注明），无需重做整套 Bootstrap。

---

## 三种标准预设 + 自定义

### T — Textbook-first（课本优先）

| 维度 | 设定 |
| :--- | :--- |
| 主产物 | `content/units/` |
| 节奏 | 快：短篇、多互动、高频反馈 |
| 单次体量 | Unit **800–1500 字** + 练习；Magazine **少用或不用** |
| 题型 | 填空 / 问答 / MCQ / T-F **密度高** |
| 适合 | 乐理基础操练、公式、术语速通、考前查漏 |
| Phase 1 默认 | 提案以 Unit 为主；仅当用户点名「想读长文」才插 Magazine |

### M — Magazine-first（杂志优先）

| 维度 | 设定 |
| :--- | :--- |
| 主产物 | `content/magazines/` |
| 节奏 | 慢：像科普 / 科研长文，沉浸阅读 |
| 单次体量 | Magazine **2000–3500 字**（3 篇）；Unit **仅用于暴露的 gaps** |
| 题型 | 正文少题；文末可选 ≤5 道 Quick Check；大练习放偶尔的 Unit |
| 适合 | 学科导论、行业现状、机制叙事、文献感输入 |
| Phase 1 默认 | 提案以 Magazine 为主；gaps 积到阈值再开 Unit |

### H — Hybrid（混合，**空白模板默认推荐**）

| 维度 | 设定 |
| :--- | :--- |
| 主产物 | 大主题 → Magazine；巩固 / 易混 / 备考 → Unit |
| 节奏 | 中等：先读后练，或同周 Mag+Unit |
| 配比建议 | 约 **2 Magazine : 1 Unit**（可按 gaps 压力上调 Unit） |
| 适合 | 大多数专业化学习（含乐理进阶、专业课） |
| Phase 1 默认 | 每轮明确写「本期模态」；混合时拆成两次生成或一次说明顺序 |

### C — Custom

用户写下规则，例如：

- 「只 Magazine，永远不出客观题」  
- 「Weekday Unit，Weekend Magazine」  
- 「前 4 期全 T，之后切 H」  

写入 `profile.md` §学习模态 → Custom 规则原文。AI 不得擅自改规则，只能建议。

---

## 预设对照速查

| | T Textbook | M Magazine | H Hybrid |
| :--- | :--- | :--- | :--- |
| 文章长度 | 短 | 长 | 视当期 |
| 练习密度 | 高 | 低 | 中 |
| 钩子叙事 | 可选 | **必须** | Mag 必须 / Unit 可选 |
| 文献/数据便利贴 | 少 | **鼓励** | Mag 鼓励 |
| 冷启动复现 | **每 Unit 必须** | 可选 | Unit 必须 |
| 默认排序偏好建议 | 旧到新 | 旧到新 | 旧到新 |

---

## Phase 1 / 2 如何读预设

```
read profile.modality
if T: propose Unit unless user asks for Mag
if M: propose Mag unless gaps_pressure == high → offer Unit (ask user)
if H: choose by topic depth + gaps; state mode in proposal
if C: follow custom rules literally
```

`gaps_pressure == high` 建议阈值：到期 gaps ≥ 3，或用户明确说「要刷题」。即使压力高，**改模态仍建议先问一句**（与「再出题先问」同理：不替用户做节奏决定）。

---

## 切换话术（给用户）

- 「改成 textbook 节奏」→ 设为 **T**  
- 「改成杂志/科普长文」→ 设为 **M**  
- 「恢复混合」→ 设为 **H**  
- 「自定义：…」→ 设为 **C** 并原文记录
