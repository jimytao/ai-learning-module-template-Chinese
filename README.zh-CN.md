# AI Learning Module Template

[English](README.md)

## 语言版本

| 分支 | 语言 | 适用对象 |
| :--- | :--- | :--- |
| **`Chinese`**（本分支） | 中文为主的模板 + Windows 阅读器 | 中文为主的 Windows 用户 |
| **`English`** | 全英文模板 + Windows 阅读器 | 英文为主的 Windows 用户 |
| **`macos-chinese`** | 中文为主的模板 + macOS 阅读器 | 中文为主的 macOS 用户 |
| **`macos-english`** | 全英文模板 + macOS 阅读器 | 英文为主的 macOS 用户 |

```bash
# 本分支
git clone -b Chinese https://github.com/jimytao/ai-learning-module-template.git
```

克隆后也可：`git checkout <分支名>`。

---

学科无关的 **AI 教练式学习空白模板**（Magazine 长文 + Unit 短课双模态）。  
从已验证的课本引擎与杂志引擎提炼：路由、排期、生成、批改、标注复现、图示武器库。

> **入口给 AI**：先读 [`AGENT.md`](AGENT.md)  
> **设计说明**：[`DESIGN.md`](DESIGN.md)

---

## 这是什么，以及它不是什么

这是一个基于文件夹的 AI 学习系统。AI 编程代理先读 `AGENT.md`，了解你的目标和偏好，提出学习顺序，把新课程写成 Markdown；之后再批改答案、解释 Notes，并用弱项安排复习。画像、内容、进度和注释都以可读文件保存在项目里。

它**不是**预先写好的课程，也不附送大模型或 API 订阅。你需要选择一个能读取和修改整个项目文件夹的 AI 代理。四个分支都带同一个本地网页阅读器，区别只在文档语言和随包的一键启动脚本。

学习闭环分四个阶段：

1. **Phase 0** — 采集科目 / 水平 / 弱项 / 兴趣 / 时间 / 学习模态（确认卡通过后才写入）  
2. **Phase 1** — 按日历 + 意愿 + 弱项提案（Magazine / Unit / 混合）  
3. **Phase 2** — 按硬规范生成内容与图示（流程/树/框图等）  
4. **Phase 3** — 批改与注释讲解；**订正后再出题必须先问你**

适合：Digital Health、乐理、专业课等任意科目。相近课可在同一项目用 **Track（轨道）**；不相近课可复制本仓库另开项目。

---

## 第一次使用

### 1. 准备一个 AI 编程代理

先有一个能读写本地文件的 AI 代理 —— Cursor、Claude Code、Codex、Devin、Hermes Agent、
Antigravity 都可以（见下方[「选择 AI 编程代理」](#选择-ai-编程代理)）。
**不要**只把某个 Markdown 文件贴进普通聊天机器人，那样它改不了文件。

### 2. 把仓库拉到本地

```bash
git clone -b Chinese https://github.com/jimytao/ai-learning-module-template.git
```

或者直接把仓库链接给代理，让它自己 clone 下来。然后用代理打开**整个文件夹**。

### 3. 第一句话：让它读 SETUP.md

```text
先读 SETUP.md，从 Step 0 开始执行。在我确认采集卡之前不要生成课程正文。
```

[`SETUP.md`](SETUP.md) 是首次运行的唯一入口，AI 会顺着它做完三件事：

| Step | AI 会做什么 |
| :--- | :--- |
| **Step 0** | **装环境**：检查并安装 Node.js 20+、跑 `npm install`、确认本平台的启动脚本（本分支是 `start.bat`）、冒烟测试阅读器能打开 |
| **Step 1–4** | **采集**：问你科目、可检验目标、当前水平、已知内容、弱项、兴趣、时间、**主要解释语言**、学习内容语言、学习模态预设（T/M/H/C），以及 **§内容形态偏好**（配图密度、图示档位、便利贴旁注类型，以及单选/多选/填空/问答/判断等题型取舍）。输出确认卡等你回复「确认」，然后写入 `knowledge/` 与 `state/`，并跑 `npm test` + `verify_reader.js` |
| **Step 5.5** | **界面本地化**：把阅读器界面文案（`ui-strings.js`）翻成你的主要解释语言 —— 之后每次打开浏览器都是你的母语 |
| **Step 5–6** | **改造**：把 `AGENT.md` 从通用模板改成你这个科目的项目，向 `state/log.md` 写入 `Initialized …` 标记 |

> 即使你学的是英语，**主要解释语言**仍是 AI 讲解难点、纠错和反馈时用的语言，和学习内容
> 语言分开确认。这些偏好保存在 `knowledge/profile.md`，Phase 2 每次生成都会读。

`SETUP.md` **用完留在原地**，不会自我删除。以后要补槽位、改语言、改偏好都还能翻回去看。
防止重复初始化靠的是 `state/log.md` 里的 `Initialized …` 行，不是靠删文件。

### 4. 之后每次开新会话

Step 6 跑完，入口就从 `SETUP.md` 换成 `AGENT.md`。以后每次开新会话，第一句话都是：

```text
先读 AGENT.md，然后 <你想做的事>
```

比如「先读 AGENT.md，然后告诉我今天学什么」「先读 AGENT.md，我想把下个月的复习排一下」
「先读 AGENT.md，我想学 XXX，帮我插进计划里」。AI 会自己判断该进哪个 Phase、加载哪些文件，
先给你大纲，你点头之后再生成。

启动阅读器：双击 `start.bat`（首次运行会自动装依赖并打开浏览器），或 `npm start` 后自行打开
<http://127.0.0.1:4173>。

> 本分支面向 **Windows**。如果你在 macOS 上，请改用带 `start.command` 的对应分支。


---

## 🎨 浏览器 JS 渲染与双向自动保存机制

项目采用 **AI Markdown 写作 + 本地 JS 动态渲染 + 交互双向写回** 的无缝学习体验：

```text
  [AI 生成 Markdown 课件] ──> 保存至 content/magazines/ 或 content/units/
                                             │
                                             ▼
  [运行 start.command / start.bat] ──> 启动 Node 本地 Server (127.0.0.1:4173)
                                             │
                                             ▼
  [浏览器 JS 渲染引擎 (app.js + reader-core.js)]
   ├── 1. Markdown 语法转 HTML (支持 Marked.js + DOMPurify 安全过滤)
   ├── 2. 交互式题型转换: 填空 ___ 变输入框 / 开放题变文本域 / 选择题变复选框
   ├── 3. 视觉武器库渲染: 流程图/树状图/Mermaid 自动渲染成矢量图表
   └── 4. 实时双向写回 (Auto-Save): 
          做题回答/勾选/编辑实时触发防抖写回，通过 /api/save 直接更新底层 .md 文件！
```

### 右上角保存状态图标与手动保存 (`saveStatus`)

阅读器右上角设有专门的保存指示按钮：
* **图标状态指示**：
  * `○ 就绪 (Ready)`：无未保存修改。
  * `● 待保存 (Saving soon)`：正在输入或答题，变更已准备写回。
  * `◌ 保存中… (Saving…)`：后台正将做题结果同步回 Markdown 文件。
  * `✓ 已保存 (Saved)`：已成功写回磁盘，文件保持同步。
  * `⚠ 保存失败 (Error)`：保存出错（会弹出 Toast 说明原因）。
* **手动点击保存**：如果不放心自动保存，任何时候都可以**点击右上角的保存图标**或按下快捷键 `⌘S` / `Ctrl+S` 进行立即强制保存，系统会提示「已保存」或「没有改动，已经是最新的了」。

---

## 初始化后的每一次学习

1. **提案**：说「今天学什么」或「提议下一个 Unit」。AI 读取日历、兴趣与弱项后先给提案，不直接写正文。
2. **确认并生成**：需要时修改提案，然后说「确认提案并生成」。AI 创建新的 Magazine/Unit、运行校验并更新日历。
3. **学习**：打开阅读器，阅读、答题、做 Notes/高亮。
4. **批改**：说「批改我的答案并解释高亮」。AI 按语境批改并更新 gaps/progress；出加练前必须先征得同意。
5. **重复**：再次说「今天学什么」。下一次提案应把新内容与弱项复现结合起来。

常用维护指令还有：「更新画像」「修改解释语言」「切换模态」「查看进度」「调试阅读器」。

## 选择一个 AI 编程代理

套餐和限额会变化，订阅前请查看官方页面。一般只需要选择其中一个。

| 工具 | 是什么 | 怎么获得 / 是否需要 API |
| :--- | :--- | :--- |
| [Cursor](https://cursor.com/download) | AI 优先的代码编辑器，对熟悉 VS Code 的用户最直观 | [Hobby](https://cursor.com/pricing) 有有限的免费 Agent 用量。使用内置模型不需要自己的模型 API key；付费套餐提高限额。 |
| [Devin](https://app.devin.ai/) | 带 shell、编辑器和浏览器的云端自主软件工程代理 | 注册后连接仓库。官方目前提供有限用量的 [Free plan](https://docs.devin.ai/admin/billing/self-serve)，不是单独命名的「免费 Agent 模型」；付费套餐增加用量，MCP 可用性可能取决于套餐。 |
| [Hermes Agent](https://hermes-agent.nousresearch.com/docs/) | 带记忆、skills 和终端/桌面界面的开源个人代理 | 软件采用 MIT 许可，但推理仍需要 Nous Portal 订阅、模型供应商 API key/OAuth，或兼容的本地模型端点。 |
| [OpenAI Codex](https://learn.chatgpt.com/docs/quickstart) | OpenAI 的编程代理，可用于 ChatGPT 桌面、CLI、IDE 和云端 | 使用符合条件的 ChatGPT 套餐登录；[当前 Codex 套餐](https://learn.chatgpt.com/docs/pricing)包含有限的 Free 用量。CLI/IDE 也可改用按量计费的 OpenAI API key，但部分云功能可能不同。 |
| [Claude Code](https://code.claude.com/docs/en/setup) | Anthropic 的终端、IDE、桌面和网页编程代理 | 使用包含 Claude Code 的付费 Claude 套餐，或启用 API 计费的 Anthropic Console 账户；查看[当前价格](https://claude.com/pricing)。 |
| [Google Antigravity](https://antigravity.google/download) | Google 的 agent-first IDE/平台 | 用 Google 账户登录。[Individual](https://antigravity.google/pricing) 当前从 $0 起，有基础周限额；Google AI/Cloud 付费方案提高限额。 |

只授权所选代理访问本项目文件夹，大改动前先审阅计划，并用 Git 保留可检查、可恢复的历史。

## 可选：联网搜索和图片下载

有些代理自带 web search；没有时可按官方说明安装可信 MCP：

- [Tavily MCP](https://docs.tavily.com/documentation/mcp)：在 [app.tavily.com](https://app.tavily.com/) 获取 key；当前免费 Researcher 档有有限的月度 credits，且不要求信用卡。
- [Brave Search API](https://brave.com/search/api/)：在 [Brave dashboard](https://api-dashboard.search.brave.com/) 获取 token。当前有月度免费额度，但即使免费方案也需要信用卡作反滥用验证；Brave 提供[官方 MCP server](https://github.com/brave/brave-search-mcp-server)。

如果官方文档没有列出你的客户端，可以直接问 AI：「根据 Tavily/Brave 官方 MCP 文档，在这个软件中配置它，不要把 API key 提交到 Git。」Key 应放在软件的 secrets/environment 设置或被 Git 忽略的本地 `.env`，绝不能写进 Markdown、`AGENT.md`、会提交的 MCP 配置或截图。

联网搜索与下载图片不是一回事：MCP 通常只返回网页或图片 URL；本仓库的 `scripts/download_images.py` 才会实际搜索并下载到 `images/`，而且当前只支持 `BRAVE_API_KEY`，Tavily 不能直接替代。能下载也不代表有版权或复用许可，请检查图片来源与许可证。

### 学习模态预设

| 代号 | 名称 | 感觉 |
| :--- | :--- | :--- |
| **T** | Textbook-first | 短、快、练习密 |
| **M** | Magazine-first | 长、慢、科普/科研阅读感 |
| **H** | Hybrid（默认推荐） | 长文扛主题 + 短课巩固 |
| **C** | Custom | 自定规则 |

详见 [`knowledge/modality_presets.md`](knowledge/modality_presets.md)。

### 项目怎么组织

| 方式 | 何时 |
| :--- | :--- |
| 单项目单科 | 只学一门 |
| 单项目多轨道 | 相近课（如 Digital Health 下多门） |
| 复制文件夹 | 科目差很远，需要物理隔离 |

详见 [`protocols/project_lifecycle.md`](protocols/project_lifecycle.md)。

---

## 仓库结构

```
AGENT.md                 # AI 唯一入口路由（Step 5 会改写成你的科目项目）
SETUP.md                 # 首次运行：环境准备 + Phase 0 采集 + AGENT 改造
start.bat                # Windows 首次安装、启动服务器并打开浏览器
server.js                # 本地文件、答案自动保存与 Notes Smart Merge 后端
index.html / app.js      # Magazine + Unit 通用网页阅读器
reader-core.js           # 交互题解析与 Markdown 回写
DESIGN.md                # 设计逻辑
protocols/               # Phase0–3、tech_spec、visual_arsenal、frontend_spec…
knowledge/               # profile / desire / calendar / domain_map / 模态预设
state/                   # log / gaps / warehouse
content/magazines/       # 长文富输入
content/units/           # 短课 + 练习
templates/               # 生成骨架
scripts/                 # 下图、校验、viz.css
notes.json               # 标注（含整句 context）
review.md                # 批改复盘存档
```

| 路径 | 作用 |
| :--- | :--- |
| [`SETUP.md`](SETUP.md) | 首次运行入口：环境准备 + Phase 0 采集 + AGENT 改造（长期保留） |
| [`protocols/intake_checklist.md`](protocols/intake_checklist.md) | Phase 0 采集确认清单 |
| [`protocols/visual_arsenal.md`](protocols/visual_arsenal.md) | 流程/树/框图/SVG 等硬语法 |
| [`protocols/frontend_spec.md`](protocols/frontend_spec.md) | 通用阅读器验收规范（含填空/问答自动写回、Notes 跳转、图示渲染） |
| [`scripts/validate_content.js`](scripts/validate_content.js) | 交互 Markdown 校验 |
| [`scripts/download_images.py`](scripts/download_images.py) | Brave 图片下载（需 `BRAVE_API_KEY`） |

---

## 工具脚本

```bash
# 一键启动（也可双击 start.bat）
start.bat

# 只启动服务器，不自动打开浏览器
npm start

# 校验 content 下交互格式与图示声明头
node scripts/validate_content.js

# 下载 imageQuery 图片
export BRAVE_API_KEY=your_key
python3 scripts/download_images.py content/magazines/magazine01_xxx.md
```

---

## 内置网页阅读器

本分支已经实现 [`protocols/frontend_spec.md`](protocols/frontend_spec.md) 规定的 Universal Reader：Magazine/Unit 分组导航、持久排序、Markdown 与 Mermaid 渲染、填空/问答/选择自动保存、每篇文档独立 Notes、基于 `context + contextOffset` 的跳转，以及保留 AI review 的 Smart Merge。服务器只监听 `127.0.0.1`，浏览器写入范围限制为两个学习内容目录与 `notes.json`。

---

## License

[MIT](LICENSE) — 可自由使用、修改、分发。
