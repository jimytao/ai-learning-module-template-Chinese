# 从两个源项目提炼的设计说明 (DESIGN.md)

> 本文说明：两个英语学习项目里**真正可复用**的核心逻辑是什么、如何抽成学科无关模板、以及本仓库各文件如何协作。  
> 已去除：英语专项内容、墨尔本生活场景、个人成绩/兴趣/博客等隐私画像。

---

## 1. 两个源项目分别在做什么

### A. English learning for Melbourne ≈ **Unit / Textbook 引擎**

| 层 | 作用 |
| :--- | :--- |
| `AGENT.md` | 唯一入口 + 任务路由，防止 AI 乱加载大文件 |
| `protocols/p1–p3 + tech_spec` | 提案 → 生成教案 → 批改 的可执行规则 |
| `state/`（calendar, log, desire, worries） | 每天读写的进度、痛点、愿望 |
| `knowledge/`（plan + 专项知识库） | 画像、大纲、可按需引用的深度参考 |
| `docs/WeekN/DayXX_*.md` | 生成物：情景串联 + 词汇 + 填空 + 开放问答 |
| `notes.json` + 预览前端 | 高亮/注释 → AI 回写讲解 |
| 图片脚本 + validate | 生成收尾自动化 |

**强项**：故事线串联、产出练习（`___` / `[Your Answer]`）、严谨批改（区分被动理解 vs 主动产出）、弱项 Kanban、冷启动复现、批改后状态回写。

**局限（对专业化学习）**：体量偏「每日碎片课」；长文献感 / 行业现状叙事不是它的主场。

### B. Melbourne culture magazine ≈ **Magazine / 富输入引擎**

| 层 | 作用 |
| :--- | :--- |
| 同样的 AGENT + 三阶段协议 | 与 A 同构，降低心智负担 |
| `desire` / `calendar` / `plan` 职责拆分 | 意愿 ≠ 进度 ≠ 过时灵感库 |
| `issues/magazineXX_*.md` | 2000–3500 字，3 篇文章，钩子开场 + 叙事弧 + sticky-note |
| 弱点从 `notes.json` 复现进下一期 | 阅读障碍自动进入队列；`+` 标记最高优先 |
| 杂志内刻意弱化大题 | 输入沉浸；做题交给另一个项目 |

**强项**：长文可读性规范、编辑日历权威、标注驱动的自适应复现、概念台账、跨文档职责清晰。

**局限**：几乎没有 MCQ / T-F / 填空主线；单独不够支撑「学会并被检验」。

### 二者已经验证的共同骨架

```
路由入口 AGENT
  → Phase1 提案（读进度+意愿+弱点）
  → Phase2 生成（格式死命令 + 图片 + 状态回写）
  → 用户学习/标注
  → Phase3 批改（inline + notes.aiReview + gaps/log 回写）
  → 下一轮 Phase1
```

这就是本模板要保留的「操作系统」。内容题材换成任意专业科目即可。

---

## 2. 抽出来的核心要素（去英语化之后）

### 2.1 操作系统层（必留）

1. **单一入口路由** — 所有任务先读 `AGENT.md`  
2. **四层目录** — `protocols` / `knowledge` / `state` / `content`  
3. **三阶段闭环** — 提案 → 生成 → 批改（本模板加 **Phase 0 Bootstrap**）  
4. **文档职责边界** — calendar 管进度，desire 管想要，gaps 管弱项，profile 管水平，domain_map 管学科树  
5. **按需加载** — 防上下文膨胀  
6. **tech_spec** — 交互格式与 JSON 字段的硬约束  
7. **状态回写纪律** — 每个 Phase 结束必须改指针，否则闭环断裂  

### 2.2 内容层（必留，改模态配比）

| 源项目做法 | 模板中的普适形态 |
| :--- | :--- |
| 每日教案 Parts | **Unit**：短课本 + 高强度练习 |
| 杂志 3 文章 + 钩子 + 叙事弧 | **Magazine**：专业化长文（现状/机制/数据/文献感） |
| 词汇表 + 记忆意象 | **Key Ideas / Concept** 表 + 助记范式 |
| Sticky notes | 数据/指南/误区便利贴 |
| imageQuery 配图 | 同样保留 |
| 故事线串联场景 | 案例时间线（病案/项目/实验） |
| Cold start recall | Part 0 无提示复现 |
| 弱点 2–3 期复现 + 衰减 | 完全保留 |
| `+` 主动查询标记 | 完全保留 |
| 反吹捧 / 能力分层 | 完全保留，并扩展到 MCQ≠掌握 |

### 2.3 交互层（保留 + 增强）

| 已有 | 本模板新增 |
| :--- | :--- |
| `___` 填空 | **MCQ 单选**（`- [ ] A/B/C/D` + HTML 注释答案） |
| `[Your Answer]` 开放题 | **True/False**（+ `flaw` 错因） |
| 高亮注释 → AI 讲解 | **订正后再出题**（Remediation Drill） |
| feedback-panel 批改 | 明确「再认层 vs 产出层」分报 |

### 2.4 明确删除 / 不迁入模板的

- 任何雅思分数、个人兴趣清单、城市生存场景、语音节奏标记专责（`//` `↗↘`）  
- Aussie slang / 介词意象库等英语专项 knowledge  
- 跨项目硬编码路径  
- 「必须每天 4–6 小时」等个人计划数字  
- 把过时 `plan.md` 当天数日历的做法（改为 calendar 权威；本模板用 `domain_map` + `calendar`，不设 Day01–30 假进度）

---

## 3. 本模板相对源项目的关键升级

### 3.1 Phase 0 Bootstrap + 采集确认清单

源项目画像是写死的。模板改为：

1. AI 加载 `protocols/intake_checklist.md`，按 A–G 槽位采集（科目/水平/弱项/兴趣/时间/**模态预设**/阅读器偏好）。  
2. 输出确认卡，**用户说确认后**才写入。  
3. 写入后按 `AGENT.md`「Bootstrap 后改造」把本文件从空白模板改成**该科目学习项目**（改标题、状态、精简 Phase 0 路由等）。

### 3.2 学习模态预设（可切换）

`knowledge/modality_presets.md` 预置：

| 代号 | 含义 |
| :--- | :--- |
| **T** | Textbook-first：短、快、练习密 |
| **M** | Magazine-first：长、慢、科普/科研阅读感 |
| **H** | Hybrid：默认推荐，Mag 扛主题 + Unit 巩固 |
| **C** | Custom：用户自定规则 |

日后说「改成更偏 textbook/magazine」即可切换，不必重跑完整 Phase 0。

### 3.3 Magazine / Unit 双模态（受预设驱动）

| 需求 | 模态 |
| :--- | :--- |
| 行业现状、机制、数据、文献摘引、建立直觉 | Magazine |
| 定义夯实、易混对比、查漏补缺、考试型练习 | Unit |
| 大主题周 | 可先 Mag 后 Unit |

具体配比由当前 **T/M/H/C** 预设决定，而不是写死「永远 Mag 为主」。

### 3.4 客观题补齐

源 textbook 已有填空与问答；杂志曾有 T/F 后被移出。专业化学习需要快速检验「是否读懂」，故在 **Unit 强制 MCQ+T/F**，Magazine 仅可选 Quick Check，并在批改协议里锁死：客观题全对 ≠ 能应用。

### 3.5 批改闭环补强

保留 inline HTML 批改 + notes.aiReview，并标准化：

1. 订正讲解（错因，不只给答案）  
2. 写入 gaps  
3. **先询问**是否加练 → 仅用户明确同意后才生成「再出题」微型补丁（禁止批改后自动出题；禁止同一回复里边问边出题）

### 3.6 阅读器细节必须保留

见 `protocols/frontend_spec.md`：目录排序（默认**旧到新**，可切换、可记忆）、Notes 侧栏与点击跳转、多文档 `file` 隔离、标注强制带整句 `context` + `contextOffset`、内部协议文件不进阅读目录。

审计两个源阅读器后补充的部分：

- **亮/暗主题属于契约**，载体是 `html[data-theme]`，配 `<head>` 内联 FOUC 守卫。magazine 阅读器的 `body.light-theme` 是反面教材 —— 它无法在 `<body>` 存在之前生效。
- **每个偏好都要记住**（`ltm_theme`、`ltm_sort_order`、`ltm_sidebar_collapsed`、`ltm_notes_show_all`），首次渲染前恢复，并反映到对应控件上。默认值只属于新用户。
- **锚定规则被写了下来**：一个词的全部出现都标记，但只有块文本等于 `context`、且位置与 `contextOffset` 相差 3 字符以内的那一处拿到 `data-primary="true"`。这正是常见词可精确定位的原因，而两个源项目都没把它写成文档 —— textbook 阅读器甚至从未实现（它 86 条注释里有 81 条只存了 `context` 而没有 `contextOffset`）。
- **Git 被明确排除。** magazine 阅读器后来长出了 `/api/git/*` 路由和 Git 侧栏标签页；模板不得继承。

按该文件验收 —— 同时按 `scripts/verify_reader.js` 验收，它机械地检查那些会静默腐化的部分。

---

## 4. 逻辑化工作流（给未来 AI / 你自己）

```
[用户] 我要学《科目》…
        ↓
Phase 0  intake 清单 → 确认卡 → 写入画像/模态
        ↓
   Step 0   环境准备（Node 20+ / npm install / 启动脚本适配）—— 见 SETUP.md
   Step 4   阅读器验收：npm test + verify_reader.js
   Step 5   改造 AGENT 为科目项目  →  学习在此解锁
        ↓
Phase 1  按 T/M/H/C 预设 + gaps/notes 提案
        ↓ 确认
Phase 2  按 skeleton 生成 → 下图 → 更新 calendar/log
        ↓
[用户] 阅读 / 做题 / 高亮（context 整句定位 → notes.json）
        ↓
Phase 3  批改 → 回写 → **询问是否加练** →（仅同意后）再出题
        ↓
回到 Phase 1
```

### Phase 1 决策伪代码

```
candidates = uncovered Core(domain_map)
           ∪ unchecked desire
           ∪ due gaps
           ∪ notes weakness queue

if needs_rich_context(candidate): mode = Magazine
elif needs_drill(candidate):       mode = Unit
else:                             mode = Magazine then Unit

proposal = pick(top by P0 gaps + Core dependency + user intent)
wait for confirm
```

---

## 5. 仓库落盘对照表

| 源项目概念 | 本模板路径 |
| :--- | :--- |
| AGENT 路由 | `AGENT.md`（Bootstrap 后改写为科目态） |
| （新）采集确认 | `protocols/intake_checklist.md` |
| p0–p3/tech_spec | `protocols/*` |
| （新）阅读器规范 | `protocols/frontend_spec.md` |
| （新）阅读器 UI 外壳 | `templates/reader_skeleton.html` |
| （新）阅读器验收 | `scripts/verify_reader.js` |
| （新）模态预设 | `knowledge/modality_presets.md` |
| plan 用户画像 | `knowledge/profile.md` |
| desire / calendar | `knowledge/desire.md` / `calendar.md` |
| 学科树 | `knowledge/domain_map.md` |
| worries | `state/gaps.md` |
| log / warehouse | `state/log.md` / `warehouse.md` |
| docs / issues | `content/units/` · `content/magazines/` |
| notes + context | `notes.json`（整句 context 定位） |

---

## 6. 你怎么用这个空白模板

1. 在 Cursor 打开本仓库，对 AI 说：「按 AGENT.md 做 Phase 0 / 初始化」。  
2. AI 会按 `intake_checklist.md` 问你科目、水平、弱项、兴趣、时间、**T/M/H/C 模态**等，并出具确认卡。  
3. 你说「确认」→ AI 写入画像并**改写 AGENT 为本科目项目**。  
4. 说「排期」→ 确认提案 → 「开始生成」。  
5. 用阅读器阅读。它在 Step 3.5 中从 `templates/reader_skeleton.html` 构建，并且必须通过 `node scripts/verify_reader.js`（主题、偏好记忆、排序、Notes 跳转、context 定位、多文档隔离、无 Git UI）。  
6. 「帮我批改」；加练须先被询问并同意。

---

## 7. 设计取舍与已知延后

### 有意识不做 / 延后

| 项 | 原因 |
| :--- | :--- |
| 发布**成品**阅读器 | 仍未随仓库发布，但已不只是文字规范：`templates/reader_skeleton.html` 提供了 UI 外壳、主题、偏好持久化与注释锚定；Step 3.5 补齐四个扩展点，`verify_reader.js` 负责验收 |
| 音频 / TTS / 影子跟读 | 英语专项；其它科目按需再加可选模块 |
| 跨仓库硬编码联动 | 科目项目应自包含；多科目用文件夹复制（`project_lifecycle.md`） |
| 个人博客画像源 | 隐私与科目无关 |

### 本轮审计已补上的缺口

- `project_lifecycle.md`（复制新科目 / 归档）  
- `review.md` + Phase 3 追加  
- `validate_content.js`  
- 路由：更新画像 / Knowledge Query / 开新科目  
- 黄金规则：不猜测意图、来源可核验、log 列锁定、新科目复制  
- Mag 弱点 → Unit 巩固联动；warehouse 每期表态  
- Plain Option；Smart Merge；TOC 生命周期与选词对齐  
- 表格 GFM 规范  
- **`visual_arsenal.md` + `viz.css`**：流程/树/时序/状态/工程框图/SVG-lite/公式；前端渲染契约；校验脚本检测声明头  

### 「一门课一个文件夹」与多轨道

三种合法形态（见 `project_lifecycle.md`）：

1. 单项目单科  
2. **单项目多轨道**（相近课，如 Digital Health 下多门 — 画像越学越清晰时可继续加 Track）  
3. 不相近课才复制文件夹隔离  

最初「一门课一份定制」和「相近课放一起」都支持，按需选。

---

## 8. 最终检查清单（还有没有漏）

### 协议 / 学习闭环 — 已齐

- [x] AGENT 路由 + Phase 0–3 + 再出题先问  
- [x] intake 确认卡、模态 T/M/H/C、Bootstrap 改 AGENT  
- [x] calendar / desire / gaps / domain_map / log / warehouse  
- [x] Magazine + Unit 双模态与骨架  
- [x] MCQ / T-F / 填空 / 开放题 + tech_spec  
- [x] notes context 定位、review.md、validate_content  
- [x] visual_arsenal + viz.css + 前端渲染契约  
- [x] 单科 / 多轨道 / 复制文件夹 三种组织方式  

### 有意延后（已知，不是漏设计）

- [x] 阅读器 UI 外壳与验收脚本（`templates/reader_skeleton.html`、`scripts/verify_reader.js`）
- [ ] 阅读器剩余工作：Markdown 渲染、交互控件自动保存、Concepts 标签页、Mermaid 管线 —— 扩展点已在骨架中标注  
- [ ] 数学公式 KaTeX（武器库已留 `formula`；引擎可选）  
- [ ] 音频 / TTS（非默认）  
- [ ] 母模板与科目项目的自动协议同步脚本  

### 可选增强（真要用 Digital Health 再加也不迟）

- 轨道在侧栏分组过滤（前端）  
- 文献/指南引用小数据库  
- 导出一周学习报告  

**结论**：作为空白模板，协议与内容规范已可开用；下一步最大实物缺口仍是**阅读器实现**，不是再堆 MD 规则。

---

## 8. 一句话总结

> **保留「AGENT 路由 + 状态机闭环 + 标注驱动复现 + 严谨批改」这一操作系统；把内容引擎改成「Magazine 富输入为主、Unit 练习为辅」；用 Phase 0 把个人画像变成可填写的空白槽；并补上 MCQ/T-F；订正后若要再出题必须先询问、获明确同意后方可生成。**

这就是从两个英语项目里提炼、并落到 `learningTextbookModule` 的普适模板。
