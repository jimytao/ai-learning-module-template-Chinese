# 阅读器 / 前端规范 (frontend_spec.md)

> 从 English Learning 预览器与 Culture Magazine 阅读器提炼的**必须保留的产品细节**。  
> 本仓库当前以 Markdown + 协议为主；迁入或重做前端时，**按本文件验收**，不得丢行为。

---

## 1. 内容来源与隔离（防搞混）

| 规则 | 说明 |
| :--- | :--- |
| 只列出学习内容 | 侧边栏「目录」只显示 `content/magazines/*.md` 与 `content/units/*.md` |
| 禁止露出内部文件 | 不得把 `protocols/` `knowledge/` `state/` `scripts/` `DESIGN.md` `AGENT.md` 放进阅读目录 |
| 分组清晰 | 建议两组：`Magazines` / `Units`（或按编号）；打开一份时高亮当前项 |
| 注释按文件隔离 | `notes.json` 每条必须有 `file`（或兼容字段 `issue`）指向**那一篇** md |
| 默认只看当前篇注释 | Notes 侧栏默认 `showAll = false`，只渲染 `file === 当前打开路径` 的条目 |
| 可切换「全部注释」 | 提供开关查看跨文档注释，但默认关闭，避免杂志多期搞混 |
| 批改也按文件过滤 | Phase 3 / 前端展示 AI 批注时，同样按当前 `file` 过滤 |

路径一经生成不要随便改名；若必须重命名，同步改 `notes.json` 里所有对应 `file`。

---

## 2. 目录排序（旧到新 / 新到旧）

| 规则 | 说明 |
| :--- | :--- |
| 可切换 | 侧栏提供排序按钮：`旧 → 新` / `新 → 旧`，带可见文字标签与箭头图标 |
| 默认 | **旧 → 新**（`asc`） |
| 持久化 | `localStorage` 键 `ltm_sort_order`，取值 `asc` \| `desc` |
| 排序键 | 优先按文件名中的编号 `magazineNN` / `unitNN`；否则按 mtime |
| 作用范围 | 只作用于 Contents 标签页；在无意义的标签页（Notes、Concepts）隐藏该控件 |

> **默认 `asc` 是刻意的。** 两个源阅读器实际默认都是旧到新（`sortOrder = 'asc'`、
> `currentSortOrder = 'old-to-new'`），因为课程和杂志期刊都是顺着往下读的，首次打开落在第 01 期
> 才是正确体验。不要把它「修正」成新到旧。

### 2.1 偏好持久化（适用于全部已存偏好）

默认值是给**新**用户的。用户一旦做出选择，他的选择就永远优先 —— 每次重新打开都算数，直到他自己再改。
每次打开都被塞回默认值是 bug，不是重置。

| 规则 | 要求 |
| :--- | :--- |
| 改动即写入 | 每个开关都在改变状态的同一个 handler 里写 `localStorage` —— 不做「退出时保存」，不做批量延迟写入 |
| 首次渲染前恢复 | 启动时读取全部四个键并应用，**先于**第一次列表/正文渲染，避免画面绘制后再跳变 |
| 仅在缺失时用默认 | 只有 `getItem` 返回 `null` 时才套用默认值。已存的值即使恰好等于默认值，也仍然是用户的选择 |
| 控件反映实际状态 | 恢复之后，排序按钮的文字/图标、主题图标、侧边栏折叠状态、Notes 范围按钮都必须显示恢复后的值，而不是默认值 |
| 禁止静默重置 | 不得因为报错、版本变化或某个文档加载失败而清空这些键 |

适用于 `ltm_sort_order`、`ltm_theme`、`ltm_sidebar_collapsed`、`ltm_notes_show_all`（§7.3）。

---

## 2.5 主题契约 —— 亮色 / 暗色（必需）

两个源阅读器都带亮色与暗色主题。这**不是**可选的锦上添花；只做暗色的阅读器验收不通过。

### 2.5.1 锁定的实现方式

| 规则 | 要求 |
| :--- | :--- |
| 载体 | **根元素**上的 `<html data-theme="dark">` / `data-theme="light"` |
| **禁止**使用 | `body.light-theme` 类。magazine 阅读器就是这么做的，而它无法在 `<body>` 存在之前应用 —— 这正是白屏闪烁的成因 |
| 颜色 | 所有颜色一律走 `:root` 上的 CSS 自定义属性；`[data-theme="light"]` 覆盖同名变量。变量块之外不得出现硬编码色值 |
| 默认 | 无存储值时为 `dark` |
| 持久化 | `localStorage` 键 `ltm_theme`，取值 `light` \| `dark` |
| 切换控件 | 顶栏一个控件；图标表示**将要切换到**的状态 |

### 2.5.2 FOUC 守卫（强制，位置固定）

主题必须在**首次绘制之前**应用 —— 放在 `<head>` 内的内联脚本，位于所有样式表之上，不能放进
`DOMContentLoaded`：

```html
<script>
  (function () {
    var t = localStorage.getItem('ltm_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  })();
</script>
```

### 2.5.3 第三方主题必须跟随

任何自带深色样式的第三方资源都要在切换时一并换掉，不能留在原地：

- **highlight.js** —— 把样式表放在 `<link id="hljs-theme-link">` 中，在切换处理函数里改写 `href`
  （`github.min.css` ⇄ `github-dark.min.css`）。
- **Mermaid** —— 初始化时选定唯一全局主题（`visual_arsenal` 契约）。若图表主题无法跟随切换，
  就选一个在两种背景下都清晰的中性主题，而不是每次切换都重新渲染全部图表。

### 2.5.4 两种主题下都必须验证的部位

注释下划线与高亮填充、tooltip / 浮层背景、填空框与 textarea 背景、表格斑马纹、`viz-*` 块边框、
图表文字。这些正是源项目当初不得不单独写亮色覆盖的地方 —— 只改了页面背景色的主题是不完整的。

---

## 3. 侧边栏结构

| Tab | 内容 | 行为 |
| :--- | :--- | :--- |
| **Contents** | Magazines + Units 列表 | 点击打开对应 md；当前项 active |
| **Concepts** | 当前篇的术语 / 词汇库，或 `log.md` 的 Concept Ledger | 点击跳到文内对应标题 / 锚点 |
| **Notes** | 当前文件（或全部）的高亮与注释 | 点击跳转到正文中的标注处并打开编辑浮层 |

- 做了新注释 → **立即出现在 Notes Tab**（保存 `notes.json` 后刷新列表）。

### 3.1 侧边栏搜索（必需）

两个源阅读器侧栏顶部都有搜索框，而且用得非常频繁。输入时过滤**当前标签页**的列表：Contents 过滤
文档标题，Concepts 过滤术语，Notes 同时匹配 `word` 和注释文本。普通的大小写不敏感子串匹配即可，
不需要模糊搜索。

### 3.2 折叠

侧边栏可折叠以让正文占满宽度；状态持久化到 `localStorage` 键 `ltm_sidebar_collapsed`。  
- Concepts / Notes 的跳转必须稳定：依赖文内标题格式与标注 span，生成内容时遵守 `tech_spec.md`。

---

## 4. 注释：创建上下文定位（强制）

> 仅存 `word` 不够：一词多处出现时无法精确定位，批改也失去语境。

创建时前端必须静默写入：

| 字段 | 含义 |
| :--- | :--- |
| `word` | 用户选中的连续文本（单块内，无换行） |
| `context` | **所在完整句子或当前块级段落**（推荐：整句；至少是所在 `<p>`/`<li>` 文本） |
| `contextOffset` | `word` 在 `context` 内的起始字符偏移 |
| `file` | 当前文档相对路径 |
| `isHighlight` | `true` = 纯高亮（无注释文字）· `false` = 带注释的下划线标注 |
| `userNoteRaw` / `note` | 用户注释（AI 不覆盖 raw） |
| `aiReview` | 只由 Phase 3 写入；前端绝不能把它丢掉（Smart Merge，§7.2） |

### 4.1 两种注释形态（都必须有）

阅读器有**两种**标注手势，视觉上必须可区分：

| 形态 | `isHighlight` | 类名 | 含义 |
| :--- | :--- | :--- | :--- |
| 下划线注释 | `false` | `.annotated-word` | 用户写了注释 / 疑问；悬停显示，Phase 3 会批改 |
| 纯高亮 | `true` | `.annotated-word.custom-highlight` | 「这里重要 / 我不确定」但还没写文字；同样是可批改的信号 |

纯高亮必须能就地升级为注释（打开浮层、输入、保存），且不丢失 `id`、`context`、`contextOffset`。

### 4.2 划词捕获 —— 顺序至关重要

1. 先确认选区可用：非空、**不含换行**、且**短于 150 字符**（源阅读器允许选整个短语，不限单词）。
2. **先把 range 吸附到单词边界**（`snapRangeToWordBoundaries`），再把它写回 selection，让用户看到
   实际将被保存的范围。
3. **然后才**从吸附后的 range 取 `word`、`context`、`contextOffset`。先算偏移再吸附，会得到一个
   与所存 `word` 不再对应的偏移 —— 后续就是静默定位错误。
4. `context` = 最近的祖先块级元素的 `textContent`（`P LI TD TH H1–H6 BLOCKQUOTE DT DD`，
   加上 `.viz-block-body`——见 §4.3 下方说明，到正文容器为止）。`contextOffset` = 从该块起点到
   选区起点的 range 长度。
5. 找不到祖先块时，存 `context = ''` 和 `contextOffset = 0`，不要猜。

### 4.3 渲染：全部出现都标记，但只有一处是 primary

这就是让常见词可定位的机制。不要为了省事把它简化掉。

```
对每个块级元素（P LI TD TH H1–H6 BLOCKQUOTE DT DD，以及对话行和 `.viz-block-body`）：
    按文档顺序收集 text node，跳过被排除的子树
    combined = 拼接全部 text node 的值        # 让被 <em>/<strong> 劈开的短语仍能匹配
    用一条大小写不敏感的正则，把所有注释词在 combined 上全部匹配出来
        - 模式按长度降序排列（防止 "note" 吃掉 "banknotes"）
        - 只在以词字符开头/结尾的那一侧加 \b
        - 只保留互不重叠的匹配
    对每个匹配：
        word = 匹配到的文本，转小写
        candidates = 所有 word 与之相等的注释
        sameBlock = candidates 中 context（去空白后）等于 combined 的那些
        ann = 若 sameBlock.length > 1，取偏移最接近 matchIndex 的那条
            : 否则取 sameBlock[0] || candidates[0]      # 见下方消歧规则
        isPrimary = ann.context && combined.trim() === ann.context.trim()
                    && abs(matchIndex - ann.contextOffset) < 3
    把匹配映射回各自的 text node，**逆序**重建这些节点
    每个命中片段包进 <span class="annotated-word[ custom-highlight]"
          data-id data-word data-note [data-primary="true"]>
```

| 规则 | 原因 |
| :--- | :--- |
| **全部**出现都包起来 | 学习者能看到这个词出现的每一处 —— 这正是标记词汇的意义 |
| **只有命中那一处**拿 `data-primary="true"` | 它才是这条注释真正针对的位置，也是唯一正确的跳转目标 |
| **选 `ann` 前先按 context 消歧** | 两条独立的注释可能共用同一个词——"coffee" 在第 1 段和第 5 段各自写了不同备注。取「数组里第一个同词注释」会把第 5 段的出现错误关联到第 1 段的注释：悬浮提示错、点击编辑目标错，保存时还可能覆盖那条不相关的注释。优先选自身 `context` 就是当前块的候选；同一块内同一个词被标注多次时，优先选偏移最接近的那条；只有没有任何候选属于当前块时，才退回「任意一条同词注释」——对应最常见的情形：只有一条真实备注，这个词在别处只是重复出现的回声 |
| 偏移容差 `< 3` 字符 | 吸收捕获与渲染之间的空白归一化差异。不要收紧成 `=== 0`，也不要放宽 |
| 逆序重建 text node | 正序重建会让同一块内后续节点的偏移全部失效 |
| 排除的子树 | `PRE CODE TEXTAREA INPUT BUTTON SCRIPT STYLE`、已经是 `.annotated-word` 的元素、以及说话人标签。在输入框内加标注会毁掉作答内容 |
| 标题内允许标注 | 两个源阅读器都在标题里做过标注；只有代码和表单控件是禁区 |
| **`.viz-block-body` 算块级元素，其它 `viz-*` 外层 `div` 不算** | 按 `visual_arsenal.md`，`.viz-caption` 是 `<p>`（上面已覆盖），但 `.viz-block-body` 是 `<div>`，而 `div` 在这里刻意**不**被当作通用块级元素——见下一行。只把 `.viz-block-body` 按类名单独识别为块级（而不是把所有 `div` 都算块级），既能让流程图/方框图里的文字可以被划选和高亮，又不破坏下一行说的规则 |
| `div` 整体上不算块级元素 | 因此遍历会**穿过** `.viz-blocks` / `.viz-blocks-row` / `.viz-block` / `.sticky-note` 这些外层 `div` 容器，往下钻到它们实际包着的内容（自己的 `<p>`，或者 `.viz-block-body`），而不是把整张图的文字混成一整块去匹配。把 `.viz-block-body` 算作块级是对这条规则的一个明确、窄范围的例外，不是"所有 div 都算块级"这种笼统规则 |

> **不要照搬 magazine 参考实现（`index.html` 的 `applyAnnotations` 函数附近）里的
> `sortedAnnotations.find(a => a.word === word)`** —— 它就是上面这个串号 bug 的源头。
> `templates/reader_skeleton.html` 和本分支的 `reader-core.js` 里都已经修好了，请对照那两个版本，
> 而不是原始参考实现。

### 4.4 定位优先级（Notes 侧栏 → 正文）

1. `data-id === note.id` **且** `data-primary === "true"` —— 正确命中  
2. `data-id === note.id`（任意一处）—— 注释还在，但内容编辑后语境漂移了  
3. 第一个文本等于 `word` 的 span（大小写不敏感）—— 无 `context` 的老数据  
4. 都没找到 → 告知用户锚点已失效；**绝不静默滚到随便某一处**

命中后：`scrollIntoView({ behavior: 'smooth', block: 'center' })`，用强调色闪烁约 2 秒后恢复。
Notes 列表排序：优先按正文物理顺序；否则按时间。

**老数据容忍**：`context` 是源项目中途才加的，因此约有一半旧注释没有它。新注释必须始终写入；
旧注释仍要能通过第 3 条规则打开。

**生成内容时的规避**（与源项目一致）：

- 不要让关键术语只出现在代码块 / 跨 sticky-note 边界（会导致无法高亮）  
- `word` 禁止跨段落  

Phase 3 批改：**必须结合 `context` 做语境讲解**，禁止只甩词典。

---

## 5. 点击跳转体验体验

| 场景 | 期望 |
| :--- | :--- |
| Notes 列表点一条 | 滚动到正文标注 → 短暂高亮闪烁 → 打开编辑浮层（若有） |
| Concepts 点一条 | 滚动到概念标题（Unit 的 `### N. 名称` 或 Mag 的 Key Ideas 锚点） |
| 目录点一篇 | 加载该 md；Notes/Concepts 切换为该文件数据；不清空其它文件的 `notes.json` |
| 跳转目标不在当前打开的文档 | 先加载该文档并 **await** 渲染完成，再定位 —— 不要和 DOM 抢时序 |

---

## 6. 交互组件与自动保存机制 (Interactive Elements & Autosave)

前端必须能够解析 Markdown 正文中的交互元素，在浏览器中渲染为 HTML 交互控件，且在用户操作（输入/勾选）时实时、自动地将答案写回源 Markdown 文件中。

### 6.1 交互元素解析与渲染规则

| 元素类型 | Markdown 语法 | HTML 渲染形式 | 解析与写回逻辑 |
| :--- | :--- | :--- | :--- |
| **空格填空** | `___` (3个及以上下划线) | `<input type="text" class="interactive-blank" data-index="N" />` | **解析**：将连续下划线替换为输入框。<br>**写回**：当输入框发生变化，前端将内存中 Markdown 的第 N 个 `___` 替换为 `__用户答案__`（注意是双下划线包裹答案）。 |
| **已填填空** | `__已填内容__` (双下划线包裹) | `<input type="text" class="interactive-blank" data-index="N" value="已填内容" />` | **解析**：解析双下划线包裹的文本，渲染为带默认值的输入框。<br>**写回**：当用户修改输入，更新双下划线内的内容为 `__新内容__`。若用户清空，则退化回三个下划线 `___`。 |
| **主观问答** | `**[Your Answer]**` 或 `**[Your Answer]**: (答案)` | `<textarea class="interactive-textarea" data-index="N">答案</textarea>` | **解析**：匹配行首或列表项中的 `**[Your Answer]**` 标记。若冒号后或括号内有答案，则作为 textarea 初始值。<br>**写回**：用户输入时，在 Markdown 对应行的 `**[Your Answer]**:` 后面更新为 `(用户答案)` 或紧跟 `用户答案`，保持 Markdown 语法结构。 |
| **单选/多选/判断** | `- [ ]` 或 `- [x]` | `<input type="checkbox" class="interactive-checkbox" data-index="N" />` | **解析**：标准的 Markdown 任务列表语法，渲染为可勾选的 checkbox。<br>**写回**：用户勾选/取消勾选时，将内存中 Markdown 对应位置的 `[ ]` 切换为 `[x]`，反之亦然。 |

### 6.1.1 双重输入框容错（强烈建议）

协议层已禁止同一题叠用填空 + `[Your Answer]`（见 `tech_spec.md` §1.1）。迁入阅读器时仍建议做 UI 容错，避免历史坏内容再次误导用户：

1. 按标题（`##` / `###` / `####`）或题块切分 DOM。  
2. 若某题块内**已有** `.interactive-blank`（来自 `___` / `__已填__`），且紧随其后的 `[Your Answer]` 渲染出的 textarea **为空** → **不渲染**该冗余 textarea（或折叠并标「redundant — ignored」）。  
3. 不要把空 textarea 当成「用户未作答」的唯一证据；批改侧仍以行内填空为准（`p3_review.md` §1.1）。

### 6.2 自动保存信息流 (Autosave Flow)

1. **内存副本维护**：前端加载 Markdown 后，在内存中保留一份 raw Markdown 字符串副本。
2. **事件监听与防抖**：监听所有交互控件的 `input` 或 `change` 事件。当用户输入时，利用 **防抖函数 (Debounce，建议 500ms - 1000ms)**，避免频繁向后台发送请求。
3. **全量写回**：防抖触发后，前端运行替换算法更新内存中的 Markdown 字符串，然后发起 `POST /api/save` 接口。
4. **接口契约**：
   * **请求路径**：`/api/save`
   * **Payload**：`{ path: "content/units/unit01.md", content: "更新后的全量Markdown文本..." }`
   * **后端行为**：后端接收到请求后，校验 `path` 安全性，直接覆盖写入对应的源文件。
5. **批改面板渲染**：
   * 批改结果使用 `details.feedback-panel`（折叠反馈面板）包裹。
   * 文本错误标注使用 `<span class="err">错误词</span>` (红色中划线/背景) 与 `<span class="fix">修改词</span>` (绿色下划线/背景) 渲染，前端需要对这些特定的 HTML 标签予以保留和渲染。

---

### 6.3 保存状态指示器（必需）

自动保存最大的问题不是丢数据，而是**用户不知道有没有保存**。所以状态必须一直可见，
并且必须存在一个「我现在就要保存」的出口 —— 不放心自动保存的人一定会去找它。

| 要求 | 硬契约 |
| :--- | :--- |
| 位置 | 页头右上角（与主题、导出按钮同一组） |
| 载体 | **`<button class="save-status">`** —— 是按钮不是纯文字标签；必须可点击、可聚焦 |
| 结构 | 内含 `.save-icon`（一眼扫的图标）与 `.save-label`（文字说明） |
| 状态 | `idle` / `dirty` / `saving` / `saved` / `error`，同时写入 `data-state` 与 class |
| 图标 | 空心圆 / 实心圆 / 虚线圆（可动） / 对勾 / 警告，五个状态互相可分辨 |
| 手动保存 | **点击指示器**立即保存；**`⌘S` / `Ctrl+S`** 同效，且必须 `preventDefault()` 掉浏览器的「保存网页」 |
| 干净文档 | 手动保存时若无改动，也要给回应（状态置 `saved` + 一句 toast）—— 静默会被读成「没生效」 |
| 单一写入口 | 手动保存必须走与自动保存**同一个函数**；禁止再写一条 POST 路径 |
| 窄屏 | 可以只留图标隐藏文字，**不得整个隐藏** —— 它是手动保存的唯一入口 |
| 可访问性 | `aria-live="polite"` + `aria-label`；`title` 写明快捷键 |

状态语义（文案可按界面语言改，状态机不可改）：

```
idle    ○  就绪 —— 尚未打开文档或无改动
dirty   ●  待保存 —— 已改动，防抖计时中
saving  ◌  保存中 —— POST /api/save 进行中
saved   ✓  已保存 —— 服务器已确认写盘
error   ⚠  保存失败 —— 保留 dirty=true，下次输入会重试
```

---

## 7. 多文档项目的精细规则与通用阅读器融合

新项目初始化时，前端必须将**杂志模式 (Magazines)** 和**课本模式 (Units)** 融合进一个统一的单页阅读器（Universal Reader）中。

### 7.1 通用版面布局 (Layout)

```
+-----------------------------------------------------------------------+
|  LOGO  [通用阅读器]                [当前期/单元标题]          [保存/导出/主题] |
+------------------------------------+----------------------------------+
| Sidebar (左侧栏)                   | Main Viewport (主阅读区)         |
|                                    |                                  |
| +--------------------------------+ | +------------------------------+ |
| | Tab 1: Contents (目录树)        | | |                              | |
| | - Magazines (杂志列表，新->旧)  | | |   Markdown 渲染内容          | |
| | - Units (课本单元，按Week分组) | | |   (填空、选择、问答交互控件)    | |
| +--------------------------------+ | |                              | |
| | Tab 2: Concepts (词汇与概念)    | | |   Mermaid 图表 / SVG 可视化  | |
| +--------------------------------+ | |                              | |
| | Tab 3: Notes (高亮注释与批改)    | | +------------------------------+ |
| +--------------------------------+ |                                  |
+------------------------------------+----------------------------------+
```

### 7.2 核心融合交互契约

1. **侧栏多模态目录展示**：
   * 前端通过 `/api/files` (或 `/api/issues`) 接口获取所有可用文件。
   * 必须在 **Contents** 侧栏中清晰分组展示：`content/magazines/` 下的杂志列表与 `content/units/` 下的课本列表。
   * 支持通过按钮在 `localStorage` 中持久化记录排序规则（`desc` / `asc`）。
2. **注释隔离与 Smart Merge**：
   * `notes.json` 存储所有的用户高亮及 AI 批复。
   * 打开 A 文件时，正文仅应用 `file === 'content/magazines/A.md'` 的高亮，Notes Tab 默认也只展示当前文件的注释。
   * **Smart Merge (后端核心细节)**：当用户在前端添加或修改注释并保存 `notes.json` 时，后端在写入前必须读取已有的 `notes.json`，**合并**新旧数据，绝对不能覆盖或冲掉 AI 已经在 `aiReview` 字段中写入的批改和反馈信息。

---

## 7.3 锁定命名（不得改名 —— `verify_reader.js` 会断言这些）

两个源阅读器各自发明了一套命名，这正是它们之间无法共享任何东西的原因。模板统一选定一套。
以下全部是硬契约。

### localStorage 键

| 键 | 取值 | 默认 |
| :--- | :--- | :--- |
| `ltm_theme` | `light` \| `dark` | `dark` |
| `ltm_sort_order` | `asc` \| `desc` | `asc` |
| `ltm_sidebar_collapsed` | `true` \| `false` | `false` |
| `ltm_notes_show_all` | `true` \| `false` | `false`（仅当前文档） |

### HTTP 路由

| 路由 | 方法 | 用途 |
| :--- | :--- | :--- |
| `/api/files` | GET | 只列出 `content/magazines/` + `content/units/` 下的可读文档 |
| `/api/file?path=…` | GET | 某篇文档的原始 Markdown；路径必须解析在 `content/` 之内 |
| `/api/save` | POST | `{ path, content }` —— 整篇回写 |
| `/api/notes` | GET / POST | 读取 / Smart Merge 写入 `notes.json` |

### DOM 契约

| 名称 | 作用 |
| :--- | :--- |
| `html[data-theme]` | 主题载体（§2.5） |
| `.annotated-word` | 任何被标记的 span |
| `.custom-highlight` | `isHighlight === true` 时追加 |
| `[data-id]` `[data-word]` `[data-note]` | span 上的注释身份 |
| `[data-primary="true"]` | 唯一的语境命中处（§4.3） |
| `.interactive-blank` `.interactive-textarea` `.interactive-checkbox` | 自动保存的控件（§6.1） |
| `.save-status` `.save-icon` `.save-label` | 保存状态指示器兼手动保存按钮（§6.3） |
| `.viz-*` `.sticky-note` | 可视化武器库（§11.3） |

---

## 7.4 明确不做的部分（即便参考实现里有）

源阅读器积累了一些附加功能，**不得**带进新项目的阅读器：

| 排除项 | 原因 |
| :--- | :--- |
| **Git UI 与全部 `/api/git/*` 路由** | `Melbourne culture magazine/server.js` 实现了 `/api/git/status`、`/api/git/history`、`/api/git/commit`、`/api/git/show` 和一个「Git」侧栏标签页。**一行都不要移植。** 版本管理是阅读器之外的事，很多使用本模板的人根本没装 Git，而在学习应用里放一个提交按钮是自找麻烦 |
| 音频 / TTS 控件 | 只对语言类科目有意义；日后按科目单独加，绝不进基线 |
| 学科专属标签页（俚语库、卡包） | 已泛化进 Concepts 标签页（§3） |
| `content/` 与 `notes.json` 之外的任何写入路由 | 阅读器不得有能力修改 `protocols/`、`knowledge/`、`state/` |

用户日后要其中某项时再做 —— 但它永远不属于 Step 3.5 的验收范围。

---

## 8. 迁入与开发参考建议

**从 `templates/reader_skeleton.html` 开始。** 它是本模板的参考 UI 外壳：两套主题的设计变量、
FOUC 守卫、偏好持久化、侧边栏标签/搜索/排序/折叠，以及 §4.2 捕获、§4.3 `data-primary` 渲染、
§4.4 跳转的可用实现。把它复制到根目录改名 `index.html` 再扩展；它刻意不含 Git UI 和任何学科专属功能。

其余模块按下列方式整合。**移植的是行为，不是文件** —— 移植时同步套用 §7.3 命名与 §7.4 排除项：

1. **服务器与路由基础**：参考 `Melbourne culture magazine/server.js`，保留其静态文件托管、`/api/save` 全量保存以及 `notes.json` 的 Smart Merge 逻辑。**读到 `/api/git/*` 处理函数就停。**
2. **多期目录与注释跳转**：参考 `Melbourne culture magazine/index.html` 中的 Notes 高亮创建、Floating Panel 浮层编辑、基于 `context` + `contextOffset` 的精确定位逻辑（值得研读的是 `applyAnnotations` / `jumpToWord` 两个函数，**但词到注释的查找逻辑除外**——见上方 §4.3 的警告）。它的主题用的是 `body.light-theme`，**请改用 `html[data-theme]`**（§2.5）。
3. **课本交互控件与作答渲染**：参考 `English learning for Melbourne/scripts/preview.html` 中将 `___`、`- [ ]`、`**[Your Answer]**` 动态转换为交互 DOM 并在发生变化时触发自动保存的 Javascript 逻辑，并照搬其 `<head>` 中 FOUC 守卫的做法。
4. **可视化模块**：引入 `scripts/viz.css` 以保证工程框图、SVG 和 Mermaid 样式全局统一，且不被 Markdown 渲染引擎破坏。

> 只克隆了本模板的用户手上并没有这两个参考项目。从零重建所需的一切都写在 §1–§7 中，并由
> `scripts/verify_reader.js` 检查；参考实现是加速器，不是依赖。


---

## 9. 验收清单（前端 Ready 的定义）

> 本清单中可机检的部分请运行 `node scripts/verify_reader.js`。它必须通过，
> `SETUP.md` Step 4 / `p0_bootstrap.md` Step 3.5 的阅读器验收才算完成。

- [ ] `node scripts/verify_reader.js` 无 FAIL  
- [ ] 亮色与暗色都可用；切换可持久化；**暗色下重新加载不得白屏闪烁**  
- [ ] 注释下划线、高亮填充、浮层、填空框、表格、`viz-*` 在**两种**主题下都清晰可读  
- [ ] 高亮一个多处出现的词时，全部出现都被标记，且侧栏能跳到正确的那一处  
- [ ] 纯高亮可就地升级为注释而不丢锚点  
- [ ] 无 Git UI，无 `/api/git/*` 路由  
- [ ] 侧边栏搜索可过滤当前标签页  
- [ ] 目录可 **旧到新 / 新到旧** 切换且持久化（默认旧到新）  
- [ ] 内部 md 不出现在阅读目录  
- [ ] Magazines 与 Units 分组、多文件不串注释  
- [ ] 注释写入 `context` + `contextOffset`  
- [ ] Notes 点击可跳转并打开编辑  
- [ ] 新注释立即出现在侧栏  
- [ ] 保存 notes 不丢 `aiReview`（Smart Merge）  
- [ ] 填空 / 问答 / MCQ / T-F 可作答并回看  
- [ ] TOC：每次正文重渲染后重建；点击用 `getElementById` 动态寻址（防 orphan DOM）  
- [ ] 选词自动对齐到单词边界（避免漏选字母导致匹配失败）  
- [ ] 标题内可高亮；代码块/`pre` 内不可高亮（与源项目一致）

---

## 10. 渲染生命周期（迁自杂志 tech_spec）

1. 修改标注会重写正文 `innerHTML` → 旧 DOM 引用全部失效。  
2. 每次 `renderActiveFile()` 结束后必须立刻 `generateTOC()`。  
3. TOC 点击不得缓存旧标题节点，必须按 id 现查现滚。

---

## 11. 可视化武器渲染契约（Visual Arsenal）

> 权威语法见 `protocols/visual_arsenal.md`。此处只定**浏览器必须如何表现**，保证「怎么写就怎么显示、不崩、各期长得一样」。

### 11.1 依赖

| 能力 | 要求 |
| :--- | :--- |
| Mermaid | 固定 CDN/本地版本（建议 ≥10）；**全局统一 theme**（如 `neutral` 或项目 CSS 变量映射）；禁止文档内 `init` 覆盖主题 |
| marked | 代码块语言为 `mermaid` 时**不要**当普通 code 用 hljs 高亮；交给 Mermaid |
| 消毒 | 正文 HTML 白名单含：`div.viz-*`、`sticky-note` 变体、svg 子集（见 arsenal §4.7） |

### 11.2 渲染流程（每次打开/刷新文档）

```
markdown → marked HTML
  → 找到 .viz-blocks / .viz-svg / .viz-steps / .viz-formula / .sticky-note → 已是最终 DOM
  → 找到 pre code.language-mermaid（或约定容器）
       → 逐个 mermaid.render
       → try/catch：失败则显示「图示渲染失败」+ 可展开源码，**绝不中断全文**
  → 再 applyAnnotations / TOC
```

### 11.3 必须提供的 CSS class（名称锁定，禁止改名）

| class | 作用 |
| :--- | :--- |
| `.viz-blocks` `.viz-blocks-row` `.viz-block` `.viz-block-accent` `.viz-arrow` `.viz-caption` | 工程框图 |
| `.viz-block-title` `.viz-block-body` | 框图内文 |
| `.viz-svg` `.viz-svg-node` `.viz-svg-edge` `.viz-svg-label` `.viz-svg-muted` | SVG 着色 |
| `.viz-steps` | 步骤块 |
| `.viz-formula` `.viz-formula-main` `.viz-formula-note` | 公式块 |
| `.sticky-note.warn-note` `.sticky-note.formula-note` | 便利贴变体 |

参考样式可放 `scripts/viz.css`（迁入前端时引入）。小屏：`viz-blocks-row` 允许折行；mermaid 图 `max-width:100%`。

### 11.4 一致性验收（防「每次长得不一样」）

- [ ] 所有 flowchart 同一 Mermaid theme  
- [ ] 所有 `viz-block` 同一边框/圆角/字号  
- [ ] caption 字号与正文 secondary 文本一致  
- [ ] 失败图有统一错误 UI，不是空白或整页白屏  
- [ ] 图示容器内点击不触发「新建填空」等误交互  

### 11.5 与注释系统

- Mermaid 渲染后的 SVG 内文字：**默认不可高亮标注**（与 code 块同等排除），避免 DOM 被 Mermaid 重写后定位失败。  
- `viz-caption`、`viz-block-body` 内普通文本：**允许**标注（实现方式见 §4.3——`.viz-block-body`
  是 `<div>`，需要按类名单独识别为块级元素，不能只靠通用标签清单）。  
- `viz-svg` 内 `<text>`：建议排除标注。

---

## 12. UI/UX 视觉与排版设计规范 (UI/UX Design & Layout Standards)

为保证生成内容与前端呈现始终保持如 Magazine / Drill 教案般的高品质视觉体验，前端与 AI 生成正文时必须遵守以下 UI/UX 规范：

### 12.1 色彩与设计 Token
* **主色调 (Primary Accent)**：青绿 (`#2dd4a7` 暗色 / `#0d9b78` 亮色)，用于交互焦点、目录选中态与操作按钮。
* **辅助点缀色 (Secondary Accent)**：琥珀金 / 暖黄 (`#fbbf24` 暗色 / `#d97706` 亮色)，用于重点高亮、高质感 Logo 渐变与便利贴卡片边框。
* **背景与玻璃质感 (Glassmorphic Atmosphere)**：
  * 使用双色径向渐变（Radial Gradient）铺设渐进式背景层。
  * 顶栏与侧边栏采用 `backdrop-filter: blur(16px)` 毛玻璃半透明效果。
  * 内容卡片采用 `rgba(21, 29, 48, 0.75)`（暗色）/ `rgba(255, 255, 255, 0.88)`（亮色），带有 `1px` 细微高亮边框。

### 12.2 字形与版式 (Typography)
* **标题 / 品牌 / 卡片头**：采用 `Outfit` 与 `Noto Sans TC` 搭配，字体加粗（`font-weight: 700 / 800`），具备现代杂志出版物视效。
* **正文阅读**：采用 `Inter`，行高锁定为 `1.7`–`1.78`，字符间距舒展，保证长时间阅读舒适度。

### 12.3 容器与部件 (Components & Cards)
* **便利贴 / 旁注卡片 (`.sticky-note`)**：必须为圆角卡片，左侧带有金/蓝双色渐变指示条，内容结构清晰。
* **工程图示与步骤 (`.viz-block`, `.viz-steps`)**：卡片居中，微阴影浮起感，图表在亮/暗双色背景下均清晰可辨。
* **保存状态指示器 (`.save-status`)**：Button 形态，带有圆角胶囊边框、状态图标（`○` 就绪 / `●` 待保存 / `◌` 保存中 / `✓` 已保存 / `⚠` 失败）以及脉冲微动效，支持快捷操作。


---

## 13. 界面语言包（`ui-strings.js`）

阅读器界面必须能跟着用户的**主要解释语言**走。做法是把全部文案集中到一个文件里，
让 Phase 0 之后可以整体替换（流程见 `SETUP.md` Step 5.5）。

| 规则 | 硬契约 |
| :--- | :--- |
| 唯一来源 | 根目录 `ui-strings.js`，定义 `window.UI_STRINGS = { … }` |
| 加载顺序 | 在 `app.js` **之前**用普通 `<script>` 同步加载；不能是模块、不能异步 |
| 服务器路由 | `/ui-strings.js`（`server.js` 静态表里的显式条目） |
| 禁止硬编码 | `index.html` 与 `app.js` 里不得出现面向用户的字面文案 |
| 键名锁定 | 翻译只改值。键名是代码契约，`verify_reader.js` 会逐个核对 |
| 应用时机 | `applyStaticStrings()` 必须在首次渲染**之前**跑（`restorePreferences()` 之前） |
| 缺键行为 | `T(key)` 回退为键名本身 —— 故意做得显眼，好让漏翻当场暴露 |

### 标记方式

| 标记 | 作用 |
| :--- | :--- |
| `data-i18n="key"` | 设置 `textContent` |
| `data-i18n-html="key"` | 设置 `innerHTML`，**必须经 DOMPurify 消毒**；只用于需要行内 `<code>` 的键 |
| `data-i18n-title="key"` | 设置 `title` |
| `data-i18n-aria="key"` | 设置 `aria-label` |
| `data-i18n-placeholder="key"` | 设置 `placeholder` |
| `T('key')`（app.js 内） | 运行时生成的文案 |

`lang` 与 `pageTitle` 两个键由 `applyStaticStrings()` 直接读，分别写入
`<html lang>` 和 `document.title`。

### 不可翻译的部分

状态图标（`○ ● ◌ ✓ ⚠`）是 §6.3 状态机的一部分；导航图标（`☰ ☀ 🧭 ⬇ 🔍 📖 🗂 📝 ⟳`）
与排序箭头（`↑ ↓ →`）同理。它们保留在值里，但翻译时原样不动。

### 验收

`verify_reader.js` 的「界面语言包」小节会检查：`ui-strings.js` 存在、
`index.html` / `app.js` 引用的每个键都有定义（缺失 = FAIL）、有没有已定义但没被
引用的僵尸键（WARN），以及 `index.html` 里还有没有漏接语言包的硬编码文案（WARN）。
