# Phase 1：排期提案 (p1_propose.md)

> **触发**：「今天学什么」「排期」「下一期」「下一单元」。  
> **必须加载**：本文件 + `knowledge/calendar.md` + `knowledge/desire.md` + `knowledge/modality_presets.md` + `state/log.md` + `state/gaps.md` + `notes.json`  
> **按需**：`knowledge/profile.md`（读模态） / `knowledge/domain_map.md` / `state/warehouse.md`

---

## Step 1：读取状态（按序）

0. `profile.md` §学习模态 + `modality_presets.md` → 当前 T/M/H/C（决定默认提案形态）  
1. `calendar.md` → 当前指针、已发行表、前瞻队列  
2. `log.md` → 最新 Retro + Hard Points Tracker  
3. `gaps.md` → Status 为 `⏳ 待编入` / `🔄 学习中` 且 Target 到期的条目  
4. `desire.md` → 未勾选 `[ ]` 项  
5. `notes.json` → 从已读内容提取标注弱点（见下方判定规则）  
6. `domain_map.md` → 尚未 Covered 的 Core 节点  
7. `warehouse.md` → 第一个 `[ ]` 待用小模块（若本期需要）

### 1.1 标注弱点判定

| 信号 | 含义 | 复现权重 |
| :--- | :--- | :--- |
| 仅高亮，无注释 | 生概念 / 不确定 | 中 |
| 有注释且 AI 判错 / 部分对 | 误解 | 高 |
| 注释以 `+` 开头 | 用户明确要求加强 | **最高** |
| 连续 2–3 次复现后未再标注 | 衰减，可移出队列 | — |
| 复现时再次标注 | 周期清零，继续复现 | 高 |

> 只分析 Status 为已读 / 已批改的内容对应标注。

### 1.2 选择内容模态（先看预设，再看内容）

1. 先读 `profile` 当前预设（T/M/H/C），按 `modality_presets.md` 的 Phase 1 规则定**默认倾向**。  
2. 再用内容类型微调：

| 情况 | 在预设允许范围内 |
| :--- | :--- |
| 现状 / 机制 / 数据 / 文献感 / 叙事 | 偏 **Magazine** |
| 定义 / 易混对比 / 刷题 / 查漏 | 偏 **Unit** |
| 大主题 + 需要巩固 | **混合**（H 下常见；T/M 下须在提案里说明为何破例） |

若因 gaps 压力想打破当前预设（例如 M 预设下强推 Unit），**先在提案里写明理由并征求确认**，不要静默改节奏。

### 1.3 Magazine 弱点 → Unit 巩固（显式联动）

若 notes/gaps 显示某 Magazine 主题「读过但仍弱」：

- 提案中优先安排 **Unit** 专练该点（同预设允许时）；或  
- Hybrid 下写明：「上期 Mag.0N 弱点 → 本期 Unit 查漏」  

禁止只开新 Mag 主题而让旧标注弱点无限积压。

### 1.4 warehouse

每期提案应考虑是否挂载一个 `warehouse.md` 待用小模块（尤其 Magazine Block 3）；若本期不用，写「本期不挂 warehouse」。

---

## Step 2：输出提案

提案必须包含：

| 栏目 | 要求 |
| :--- | :--- |
| 编号与标题 | 如 `Magazine.01: …` 或 `Unit.01: …` |
| Track | 本期服务的轨道（单科填科目名；跨轨道须说明） |
| 当前预设 | T / M / H / C（来自 profile） |
| 本期模态 | Magazine / Unit / 混合（若与预设默认倾向不同，写明原因） |
| 覆盖的 domain 节点 | 对齐 `domain_map` |
| 内容大纲 | Magazine：3 篇文章标题 + 钩子方向；Unit：各 Part 预览 |
| 弱点复现 | 2–4 个来自 gaps/notes 的点 |
| 进阶替换 | 2–3 个「基础说法 → 专业说法」预告（可选） |
| 题型预算 | Unit 必写：填空 / 问答 / MCQ / T-F 数量；Magazine 默认少题或无题 |
| warehouse 小模块 | 若使用，写明主题 |
| 预估体量 | Magazine 2000–3500 字；Unit 视深度 800–2000 字 |

---

## Step 3：等待确认

- 确认 → `calendar` / `AGENT.md` 标为 `Phase 2 — 生成中`，进入 Phase 2  
- 修改 → 同步改 desire / gaps Target / calendar 队列中被影响的项  
- **禁止**把 desire 勾选项不经确认直接当成最终标题  
- **禁止**把前瞻队列「建议顺位」当成已锁定交稿日
