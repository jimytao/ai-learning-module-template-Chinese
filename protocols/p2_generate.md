# Phase 2：内容生成 (p2_generate.md)

> **触发**：用户确认提案，或「生成杂志」「写长文」「生成单元」「写课本」。  
> **必须加载**：本文件 + `protocols/tech_spec.md` + `protocols/visual_arsenal.md` + `knowledge/calendar.md` + `knowledge/modality_presets.md`  
> **按需**：`knowledge/profile.md` / `knowledge/coach_reference.md` / `state/warehouse.md` / `knowledge/domain_map.md` / `templates/*`

---

## 设计哲学（双模态 + 预设）

| 模态 | 角色 | 体量 | 做题 |
| :--- | :--- | :--- | :--- |
| **Magazine** | 富输入：现状、机制、数据、文献摘引、叙事洞察（科普/科研阅读感） | 合计 **2000–3500 字**，固定 **3 篇**（每篇约 600–1000） | 默认少题；文末可选 ≤5 道 Quick Check |
| **Unit** | 快节奏课本：定义、对比、例题、互动、查漏补缺 | **800–2000 字**（T 预设可压到 800–1500）+ 练习区 | **必须**含填空、问答、MCQ、T-F 中至少三类 |

> Magazine 让人「因为想读而学」；Unit 让人「因为要练而会」。图示一律走 `visual_arsenal.md`（流程/树/框图/公式等），**禁止**只用照片+表格硬撑所有概念。

---

## 0. 可视化武器（强制意识）

生成前问自己：本篇是否至少有一处「关系/过程/结构」需要图示？

- 有 → 按 `visual_arsenal.md` §3 决策树选 Type，写声明头 + 规定语法。  
- 对比 → `table`；分支过程 → `flow`；层级 → `tree`；模块接口 → `blocks`；几何示意 → `svg-lite`；实景 → `photo`。  
- **禁止**自创未登记的 HTML/SVG/图方言。  
- 收尾自检见 `visual_arsenal.md` §7。
---

## 0.5 按用户内容形态偏好生成（强制 —— 优先于本文件的默认值）

生成前**必须**读 `knowledge/profile.md` §内容形态偏好（Phase 0 §H 采集）。
该节的值覆盖本文件与 `visual_arsenal.md` 里的默认密度；某字段仍是 `TBD` 时才用括号里的模板默认值。

| profile 字段 | 生成时怎么做 |
| :--- | :--- |
| 配图密度 `none` | 不写任何 `imageQuery` / `<img>`；改用 `table` / `blocks` / `formula` 承担说明 |
| 配图密度 `light`（默认） | 每篇 1–2 张 |
| 配图密度 `medium` | 每个大节 1 张 |
| 配图密度 `rich` | 概念词条尽量都配图 |
| 图示档位 `minimal` | 只用 `table` + `steps`，不画 Mermaid / `blocks` / `svg-lite` |
| 图示档位 `standard`（默认） | 每篇至少 1 处 `flow` / `tree` / `blocks` |
| 图示档位 `heavy` | 关系性内容尽量图示化，但仍受 `visual_arsenal.md` §5 密度纪律约束 |
| 偏好 / 避开的图示 Type | 优先用勾选的 Type；被避开的 Type 一律不用，改选功能最接近的替代（对比→`table`、过程→`steps`） |
| 便利贴 `off` | 不写 `div.sticky-note` |
| 便利贴 `light`（默认）/ `rich` | 每篇 1–2 张 / 每大节 1 张；内容只取 profile 勾选的那几类 |
| 常用 / 避开题型 | 覆盖下方「题型要求」的最低数量：被避开的题型最低数量归零；常用题型按 profile 的「每 Unit 题量」分配 |
| 版面口味 | 紧凑速查 → 多表少段；舒展叙事 → 多段少表；图文并茂 → 图示与正文交替 |
| 速览 + 三句话总结 | 为「是」时，正文首尾各加一块（速览用 `steps` 或短列表，总结用三个短句） |

**两条不可被偏好覆盖的底线：**

1. **题型不得少于两类** —— 只剩单一再认题型时无法区分「认得出」和「会应用」（黄金规则 6）。
   若用户的勾选导致只剩一类，向用户说明并请其再选一类，别自己偷偷加回来。
2. **偏好只调密度和取舍，不改写法** —— `tech_spec.md` 的互斥规则与 `visual_arsenal.md` 的登记语法始终生效。

§内容形态偏好整节仍为 `TBD` 时：按模板默认值生成，并在收尾摘要里用一句话提示
「想多点图 / 换题型的话，说『改配图偏好』或『改题型偏好』即可」。

---

## A. Magazine 生成规范

### 文件

```
content/magazines/magazine[NN]_[topic_slug].md
示例: content/magazines/magazine01_health_systems_overview.md
```

### 结构（必须）

```
# [Subject] Learning Magazine
## Magazine.NN: [期刊标题]
### Block 1: Articles
#### Article A / B / C
##### 有信息量的 H5 副标题 × 3–4
（文后）📚 Key Ideas from This Article
（可选 sticky-note：数据 / 文献摘引 / 误区）
### Block 2: How Do I Apply This?（情景 / 句库 / 操作卡，2–3 张）
### Block 3: Module from warehouse（可选小专题）
### （可选）Block 4: Quick Check — MCQ / T-F（≤5 题）
```

### 文章硬性规范

1. **钩子开场**：第一段必须是反常识问题、现场场景或悬念——禁止平铺定义开头。  
2. **叙事弧**：现象 → 机制/证据 → 转折或洞见 → 可落地收尾。  
3. **文献 / 数据感**（专业化要求）：每期至少 1 处「可核验」的数据点、指南名、经典表述或研究结论；用 sticky-note 或正文标注来源类型（指南 / 综述 / 教材共识）。不确定则写「需核验」并在生成后用检索确认，禁止伪造文献。  
4. **Key Ideas 表**：每篇 4–6 个核心概念；含简明释义、记忆锚点、1 句语境例句。弱点复现词标 `🔁`。  
5. **自适应**：把 Phase 1 预告的弱点自然织入正文，不刻意加粗剧透。  
6. **图片 / 图示**：照片用 `imageQuery`；流程/树/框图/公式等必须按 `visual_arsenal.md`，不得只用照片凑数。

### Magazine 明确禁止

- 大型角色扮演长题、大段填空主线（那是 Unit 的活）  
- 超过约定板块的灌水结构  
- 无钩子的教科书目录体开场  

---

## B. Unit（课本单元）生成规范

### 文件

```
content/units/unit[NN]_[topic_slug].md
示例: content/units/unit01_acid_base_basics.md
```

### 推荐结构

```
# Unit.NN: [标题]
## Part 0: Cold Start Recall（无提示复现前序 2–3 点）
## Part 1: Core Concepts（5–12 个，可配图）
## Part 2: Guided Questions（[Your Answer]）
## Part 3: Worked Scenario / Case（可用 ___ 填空推进）
## Part 4: Objective Checks
   - Multiple Choice（≥3）
   - True / False（≥3）
## Part 5: Application Write-up（开放产出 1–2 题）
## Part 6: Submit & Next（提示说「帮我批改」）
```

### 题型要求

| 题型 | 标记 | 最低数量（Unit） |
| :--- | :--- | :--- |
| 填空 | `___` | ≥3 |
| 开放问答 | `**[Your Answer]**` | ≥2 |
| 单选题 MCQ | 见 tech_spec §3 | ≥3 |
| 多选题 MSQ | 见 tech_spec §3.5 | 0（用户勾选后 ≥2） |
| 判断题 T/F | 见 tech_spec §4 | ≥3 |

> 上表是**模板默认值**。`profile.md` §内容形态偏好一旦写了常用 / 避开题型，就以那里为准（见 §0.5）：
> 被避开的题型最低数量归零，常用题型按用户的每 Unit 题量分配；但任何情况下题型都不得少于两类。

> ⚠️ **硬性互斥（不得违反）**：填空题（句内 `___`）**禁止**在同一题下再写 `* **[Your Answer]**:`；开放题用 textarea，**不要**再叠行内填空当主答题框。叠用会产生双重输入框，批改会读错答案。详见 `tech_spec.md` §1.1。建议：Part 3 案例推进用 `___`；Part 0 / 2 / 5 用 `[Your Answer]`——分 Part 使用，不混在同一题块。

### 故事线（可选但推荐）

用一条案例 / 病人 / 项目 / 实验时间线串起 Part 1→5，避免碎块罗列。核心概念必须在 Scenario 与练习中复现。

### 概念词条格式

```markdown
### 1. 概念名
- 定义：…
- 为何重要：…
- 易混：… vs …
- Plain Option（可选）：用一句非行话也能说清的版本（降低术语焦虑；正式掌握仍以专业说法为准）
<!-- imageQuery: "concrete visual scene 3-6 words" | target: "concept_slug.jpg" -->
<img src="images/concept_slug.jpg" height="150" />
```

> **Plain Option**：源自英语项目的 Basic/Survival Option，学科化后用于「先能说清楚，再升级术语」。批改时：只用 Plain Option 且概念正确 → 可记为理解通过，但仍应展示专业说法供被动积累；不可把「会说大白话」直接标成「专业表达已掌握」。

---

## C. 生成完成后的收尾（不得跳过）

1. 运行图片下载脚本（若本期有 `imageQuery`）：检查 X/N，失败则改描述重试。  
2. 若有校验脚本：运行并通过。  
3. 运行 `node scripts/validate_content.js`（有内容文件时必须 ✅）。  
4. 更新 `state/log.md`：新增一行进度（Unread / Not studied）。  
5. 更新 `knowledge/calendar.md`：已发行表 + 当前指针。  
6. 若用了 warehouse 主题：标为 `[x] 已使用 · Magazine/Unit NN`。  
7. 将本期新概念摘要追加到 `log.md` 的 Concept Ledger（若表格存在）。  
8. 更新 `AGENT.md` 顶部：

```
**当前状态**: `Phase 2 完成 — 等待学习` | Magazine/Unit NN | YYYY-MM-DD
> 下一步: 用户阅读/做题/高亮后说「帮我批改」→ Phase 3
```
