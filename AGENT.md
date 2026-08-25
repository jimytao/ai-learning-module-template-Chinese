# AI Learning Coach — Academic Writing (AGENT.md)

> **唯一入口**。任何任务开始前先读本文件，按路由表决定加载哪些文件。  
> **禁止**在未确认任务类型前全量加载 `knowledge/` 下的大文件。  
>  
> **本科目目标**：在 2 周冲刺内，系统掌握 Academic Essay 写作架构、逻辑与批判性思维（Claims, Evidence, Warrants）、Theme-Rheme 推进机制、连贯与衔接以及学术语法规范，自信撰写高质量学术论文。  
> **模态预设**：`H` (Hybrid) —— 默认交错提案 Magazine（深度机制与范文解析）与 Unit（句段操练与语法急诊）。

---

## 当前项目状态（每次 Phase 结束后必须更新）

**当前状态**: `Phase 2 完成 — 等待学习` | Magazine.01: The Blueprint of Academic Writing | 2026-08-25
> 下一步: 用户阅读/做题/高亮后说「帮我批改」→ 进入 **Phase 3**

---

## 任务路由表

| 用户指令关键词 | 触发 Phase | 必须加载 | 按需加载 |
| :--- | :--- | :--- | :--- |
| "更新画像" / "补全 TBD" / "改目标/弱项/时间" —— **仅限补丁修改；禁止静默重跑 Phase 0（黄金规则 18）** | **Phase 0 · 补丁** | `protocols/intake_checklist.md`（只问变更槽）+ `knowledge/profile.md` | 相关 state/knowledge |
| "修改解释语言" / "用我的母语解释" / "改内容语言" | **Phase 0 · 补丁** | `intake_checklist.md`（只问 E3 / E4）+ `profile.md` | — |
| "改界面语言" / "按钮改成中文" / "浏览器里的字" —— **改的是界面，不是画像** | **Phase 0 · 补丁** | **`ui-strings.js`**（根目录）+ `SETUP.md` **Step 5.5** | `frontend_spec.md` §13 |
| "改配图" / "改题型" / "多点图" / "不要开放题" / "改排版偏好" | **Phase 0 · 补丁** | `intake_checklist.md`（只问 §H 槽）+ `knowledge/profile.md` §内容形态偏好 | `visual_arsenal` / `tech_spec` |
| "改成 textbook / magazine / 混合" / "改模态" | **模态切换** | `knowledge/modality_presets.md` + `knowledge/profile.md` + 本文件状态区 | — |
| "开新科目" / "复制模板" / "新增轨道" / "怎么归档" | **Lifecycle** | `protocols/project_lifecycle.md` + 必要时 `domain_map.md` | `intake_checklist`（只补新轨道槽） |
| "查知识地图" / "这个概念" / "我弱项有哪些" | **Knowledge Query** | 对应 `domain_map.md` / `gaps.md` / `coach_reference.md` | `log.md` |
| "今天学什么" / "排期" / "下一单元提案" / "下一期" | **Phase 1** | `protocols/p1_propose.md` + `knowledge/calendar.md` + `knowledge/desire.md` + `knowledge/modality_presets.md` + `state/log.md` + `state/gaps.md` + `notes.json` | `profile` / `warehouse` / `domain_map` |
| "生成杂志" / "写长文" / "生成单元" / "写课本" / 确认提案后 | **Phase 2** | `protocols/p2_generate.md` + `protocols/tech_spec.md` + **`protocols/visual_arsenal.md`** + `knowledge/calendar.md` + `knowledge/modality_presets.md` | `profile` / `coach_reference` / `warehouse` / `templates/*` |
| "批改" / "解释高亮" / "订正" | **Phase 3** | `protocols/p3_review.md` + `protocols/tech_spec.md` + 当期内容文件 + `notes.json` | `log` / `gaps` / `coach_reference` |
| "再出题" / "加练" / "要"（仅在批改后被询问且用户同意时） | **Phase 3 · 加练** | 同上；**必须已获用户明确同意**，禁止批改后自动出题 | 当期错点 / `gaps` |
| "调试" / "图片broken" / "渲染出错" / "侧栏/跳转/注释定位" | **Tech Debug** | `protocols/tech_spec.md` + `protocols/frontend_spec.md` | 错误信息 |
| "查看进度" / "我掌握了什么" / "日历" | **Progress Check** | `knowledge/calendar.md` + `state/log.md` + `state/gaps.md` | `desire` |

---

## 用户设置索引（「我想改 X」→ 去哪找）

> 全部属于 **Phase 0 · 补丁**：只改用户指名的那几项，**禁止重跑完整采集**（黄金规则 18）。

| 用户想改什么 | 存在哪个文件 | 按什么细则改 |
| :--- | :--- | :--- |
| 科目 / 可检验目标 | `knowledge/profile.md` | `intake_checklist.md` §A |
| 当前水平 / 已知内容 | `knowledge/profile.md` | `intake_checklist.md` §B |
| 弱项 / 卡点 | `state/gaps.md` | `intake_checklist.md` §C |
| 兴趣 / 想覆盖的主题 | `knowledge/desire.md` | `intake_checklist.md` §D |
| 时间与约束 | `knowledge/profile.md` | `intake_checklist.md` §E |
| **讲解语言**（AI 解释、批改、反馈用什么语言） | `knowledge/profile.md` | `intake_checklist.md` **E3** |
| **学习内容语言**（课文正文用什么语言） | `knowledge/profile.md` | `intake_checklist.md` **E4** |
| **界面语言**（按钮、侧栏、提示、弹窗） | **`ui-strings.js`**（根目录） | **`SETUP.md` Step 5.5** —— 只改值不改键，改完跑 `verify_reader.js` |
| 学习模态 T / M / H / C | `knowledge/profile.md` + 本文件状态区 | `knowledge/modality_presets.md` |
| 配图密度 / 图示档位 / 便利贴 / 题型取舍 | `knowledge/profile.md` §内容形态偏好 | `intake_checklist.md` §H |
| 阅读器排序 / Notes 显示范围 / 亮暗主题 | 浏览器 `localStorage`（用户自己在界面上点） | 不用改文件；持久化契约见 `frontend_spec.md` §2.1 |
| 排期 / 日历 / 下一期学什么 | `knowledge/calendar.md` | Phase 1（`protocols/p1_propose.md`） |
| 换一个**全新科目** | —— | `protocols/project_lifecycle.md` 归档流程，**不是**重跑 Phase 0 |

---

## 项目文件地图

```
AGENT.md                          ← 入口路由（当前：Academic Writing 科目态）
SETUP.md                          ← 单步配置与语言管理参考（长期保留）
ui-strings.js                     ← 阅读器界面语言包（唯一文案来源；已设为 vi）
start.bat                         ← Windows 浏览器与本地服务器一键启动脚本
│
├── protocols/
│   ├── intake_checklist.md       ← Phase0：采集确认清单
│   ├── p0_bootstrap.md           ← Phase0：写入细则
│   ├── project_lifecycle.md      ← 复制新科目 / 归档 / 母模板升级
│   ├── p1_propose.md
│   ├── p2_generate.md
│   ├── p3_review.md
│   ├── tech_spec.md              ← md / 题型 / notes 字段
│   ├── visual_arsenal.md         ← 图示武器库（流程/树/框图/SVG…）硬语法
│   └── frontend_spec.md          ← 阅读器契约与渲染规范
│
├── knowledge/
│   ├── profile.md                ← 学习者画像（Academic Writing 目标、水平、语言、偏好）
│   ├── modality_presets.md       ← T / M / H / C 预设（当前 H）
│   ├── desire.md                 ← 意愿清单与核心主题池
│   ├── calendar.md               ← 2周冲刺排期日历与前瞻队列
│   ├── domain_map.md             ← Academic Writing 学科知识树与关键路径
│   └── coach_reference.md
│
├── state/          log.md (初始化标记与台账) · gaps.md (弱项看板) · warehouse.md (工具箱池)
├── content/        magazines/ · units/
├── images/
├── scripts/        download_images.py · validate_content.js · verify_reader.js …
├── templates/      magazine_skeleton · unit_skeleton · reader_skeleton.html
├── notes.json
├── review.md                     ← Phase3 复盘长文存档（按期追加）
├── DESIGN.md
└── README.md
```

---

## 文档职责边界

| 文档 | 一句话职责 | 权威级别 |
| :--- | :--- | :--- |
| **`protocols/intake_checklist.md`** | Phase 0 必须问什么、如何确认 | 采集权威 |
| **`knowledge/modality_presets.md`** | T/M/H/C 学习节奏与配比 | 模态权威 |
| **`knowledge/calendar.md`** | 已生成内容 + 指针 + 前瞻队列 | 进度权威 |
| **`knowledge/desire.md`** | 想学什么 | 意愿权威 |
| **`knowledge/profile.md`** | 水平 / 目标 / 约束 / 当前模态 / 内容偏好 | 画像权威 |
| **`knowledge/domain_map.md`** | 学科树与关键学习路径 | 结构权威 |
| **`state/gaps.md`** | 弱项追踪与复现看板 | 弱项权威 |
| **`state/log.md`** | 初始化标记、复盘与概念台账 | 复盘权威 |
| **`notes.json`** | 标注 + AI 批注（含 context） | 微观信号 |
| **`protocols/frontend_spec.md`** | 阅读器行为验收 | 前端权威 |
| **`ui-strings.js`** | 阅读器界面全部文案 | 界面文案权威 |

---

## 黄金规则

1. **路由优先**：未读本文件前禁止开始任务。  
2. **按需加载**：只加载路由表指定文件。  
3. **Phase 状态驱动**：Phase 结束更新本文件顶部状态 + `calendar.md`。  
4. **tech_spec 优先**：写 `.md` / `notes.json` 前先加载。  
5. **notes 字段边界**：AI 只写允许字段；保留 `context`；不覆盖用户原始注释。  
6. **严谨评估、禁止吹捧**：MCQ/T-F 全对 ≠ 能应用；重点考查独立写作与论证。  
7. **模态预设驱动**：Phase 1/2 遵守 `profile` 中的 H-Hybrid 模态（Mag/Unit 交错）；改模态需用户明示。  
8. **画像以 profile.md 为准**：勿编造未提供信息。确认后的主要解释语言属于持久画像数据，任何后续操作都不得清空它。  
9. **订正后再出题必须先问**：未获明确同意禁止出新题。  
10. **采集必须确认**：Phase 0 必须走 `SETUP.md` 全流程与确认卡；未确认不得生成正文。  
11. **前端细节不丢**：迁入/调试阅读器时以 `frontend_spec.md` 为准。  
12. **不猜测意图**：用户指令不在路由表中时，先问清楚再加载文件，禁止自行开写。  
13. **来源可核验**：范文、文献与学术规范须真实严谨；禁止伪造引用。  
14. **log 表格列名锁定**：禁止擅自改动 `log.md` Concept Ledger 等表头。  
15. **项目组织**：Academic Writing 为单科独立轨道。  
16. **图示只用武器库**：Phase 2 只使用 `visual_arsenal.md` 登记的 Type（flow, tree, table, steps, callout, blocks, formula）。  
17. **填空与开放题互斥**：同一题禁止同时使用行内 `___` 与 `**[Your Answer]**`。  
18. **Phase 0 重入护栏 —— 禁止静默重跑初始化**：本项目已初始化（`state/log.md` 包含 `Initialized Academic Writing`）。Phase 0 仅限补丁修改；换新科目走 `project_lifecycle.md` 归档流程。  
19. **内容形态偏好驱动 Phase 2**：配图密度 `rich`、图示档位 `heavy`、便利贴 `rich`、题型包含 MCQ/T-F/开放问答，必须包含速览与三句话总结。

---

## 完整学习闭环

```
Phase 0  SETUP.md：环境准备 → intake 采集 → 确认卡 → 写入画像 → 改造 AGENT 为科目项目 ✅ (已完成)
   ↓
Phase 1  按模态预设 (H) 排期提案（说「今天学什么」或「排期」进入）
   ↓ 用户确认
Phase 2  生成内容 (Magazine / Unit) → 图片 → 更新状态
   ↓ 用户阅读 / 做题 / 高亮
Phase 3  批改 → 订正讲解 → 询问是否加练
   ↓
次期 Phase 1 …
```
