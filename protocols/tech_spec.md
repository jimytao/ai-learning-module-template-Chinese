# 技术规范 (tech_spec.md)

> Phase 2 / Phase 3 写文件前必须加载。  
> 本文件约束「什么格式能被预览器 / 解析器 / notes.json 正确处理」，不写教学内容。  
> **图示（流程/树/框图/SVG 等）**另见并必须遵守：`protocols/visual_arsenal.md`（本文件不重复定义，避免两套标准）。

---

## 1. 填空题（Inline Blanks）

| 用途 | 写法 | 结果 |
| :--- | :--- | :--- |
| 空白待填 | `___`（≥3 个下划线） | 输入框 |
| 已填展示 | `__答案文字__` | 已填框 |
| 任务勾选 | `[ ]` / `[x]` | checkbox |

**禁止**：

- 用 `__` 表示空填（会被当成空已填值）  
- 在代码块 / sticky-note 内放 `___`  
- 用长纯下划线当装饰答题线  
- **同一道题同时放行内填空（`___` / `__已填__`）与 `**[Your Answer]**`**（见 §1.1）

对话填空写在正文（不要包在 ` ``` ` 里）：

```markdown
Mentor: What is the first step?
You: ___ (✏️ 用今天的概念回答)
```

### 1.1 填空 vs 开放问答：互斥（硬性，防双重输入框）

> 源项目真实故障：句内已有 `__into__` 填空，又在题下加了空的 `* **[Your Answer]**:` → UI 出现**两个输入框**；批改只读到空白 textarea，误判「未作答」。

| 题型意图 | 只用 | 禁止再加 |
| :--- | :--- | :--- |
| 句内 / 对话短填空（词、介词、术语） | `___` 或写回后的 `__答案__` | `**[Your Answer]**` |
| 多句开放产出、解释、案例分析 | `**[Your Answer]**` | 同一题干下再放 `___` 当「主答题框」 |

**错误（禁止）**：

```markdown
#### Exercise 1 — Prepositions
She walked __into__ the room and looked __over__ the notes.
*   **[Your Answer]**:
```

**正确（填空）**：

```markdown
#### Exercise 1 — Prepositions
She walked ___ the room and looked ___ the notes.
```

**正确（开放题，另起一题）**：

```markdown
#### Exercise 2 — Explain
Why does the preposition change the meaning here?
*   **[Your Answer]**:
```

不同 Part / 不同题号可以分别用填空或开放题；**禁止在同一题块内叠两种控件**。

---

## 2. 开放问答（`[Your Answer]`）

```markdown
*   **[Your Answer]**:

*   **[Your Answer]** (✏️ 提示文字):
```

缩进 4 空格的后续行会进入 textarea 初始值。禁止手写 `<textarea>`。  
**不要**给已经含 `___` / `__已填__` 的填空题再追加本标记。
---

## 3. 单项选择题（MCQ）— 本模板新增标准

### 3.1 写法

```markdown
#### MCQ-1
Stem：在下列关于 X 的描述中，哪一项正确？
- [ ] A. 干扰项
- [ ] B. 正确答案
- [ ] C. 干扰项
- [ ] D. 干扰项
<!-- answer: B | rationale: 一句话依据，指向正文概念 Y -->
```

规则：

- 必须恰好一个正确项（单选）。  
- 用户作答时把选中的项改成 `- [x]`，其余保持 `[ ]`。  
- `<!-- answer: ... -->` **仅供 AI 批改**，预览中可隐藏；禁止把答案明文写在题干旁。  
- 干扰项必须「听起来合理」，考辨析而非文字游戏。

### 3.2 批量

Unit：≥3 题。Magazine Quick Check：0–5 题。

---

## 4. 判断题（True / False）— 本模板新增标准

```markdown
#### TF-1
命题：……（完整陈述句）
- [ ] True
- [ ] False
<!-- answer: False | flaw: 错在把相关当成因果 / 范围过大 / … -->
```

规则：

- 命题必须可判定，避免「有时 / 可能」含糊句（除非题干考的就是限定词）。  
- False 题必须在 `flaw` 里写清错点，供 Phase 3 讲解。  
- 用户只勾选 True 或 False 之一为 `[x]`。

---

## 5. Markdown 表格规范

```markdown
| Name | What It Is | Notes |
| :--- | :--- | :--- |
| Term | … | … |
```

- 必须有表头与对齐分隔行；每行列数与表头一致  
- 单元格内禁止多段未闭合 HTML / 复杂列表  
- Key Ideas / Concept Ledger 一旦被前端解析，**列名与列序锁定**（改列 = 侧栏坏掉）

---

## 6. 图片（imageQuery）

每个需下载图片的位置必须**两行配对**：

```markdown
<!-- imageQuery: "person reading lab report at desk" | target: "lab_report.jpg" -->
<img src="images/lab_report.jpg" height="150" />
```

或 Magazine 封面可用：

```markdown
<!-- imageQuery: "…" | target: "magazine01_feature.jpg" -->
![Feature](images/magazine01_feature.jpg)
```

| 规则 | 说明 |
| :--- | :--- |
| 查询词 3–6 个英文词 | 太短/太抽象会失败 |
| 场景化：人 + 动作 + 物体 | 避免 `concept` / `idea` |
| target 小写+下划线 | 与 src 文件名完全一致 |
| 统一存 `images/` | 禁止散落到 content 子目录 |

下载失败：改 `imageQuery` 更具象后重试，最多 3 次。

---

## 7. Sticky Note（杂志便利贴）

```html
<div class="sticky-note">
  <h4>标题</h4>
  <p>短内容。可含数据或文献提示。</p>
</div>
```

文献/数据类可用 `class="sticky-note science-note"`。  
内部只允许基础标签；**禁止**放 `___`、MCQ、`[Your Answer]`。

---

## 8. 批改 HTML 白名单

```html
<details class="feedback-panel fp-pass|fp-warn|fp-fail" open>
<summary>…</summary>
<div class="feedback-body">…</div>
</details>

<span class="err" title="原因">…</span>
<span class="fix">…</span>
<span class="warn" title="可升级说明">…</span>
<div class="grading-section">…</div>
<div class="correction-line">…</div>
```

禁止：`<script>`、`<style>`、原生 `<textarea>`、在 `title` 里写 `__`。

---

## 9. notes.json Schema

```json
{
  "id": "note_<timestamp>_<rand>",
  "file": "content/magazines/magazine01_xxx.md",
  "word": "被标注的连续文字（单块内，无换行）",
  "note": "用户侧可见合成内容（若前端管理则 AI 勿覆盖）",
  "userNoteRaw": "用户原始注释（AI 禁止覆盖）",
  "isHighlight": true,
  "time": "ISO-8601",
  "context": "所在完整句子或块级段落（前端强制写入，用于精确定位与批改语境）",
  "contextOffset": 0,
  "aiReview": {
    "grade": "A|B|C|N",
    "isCorrect": true,
    "correctedMeaning": "更精确的释义",
    "explanation": "结合 context 的说明",
    "memoryAid": "助记",
    "misconception": "若有误解，写清；否则空字符串"
  }
}
```

硬性规则：

- AI **只写 / 更新 `aiReview`**（及协议明确允许的汇总节点）。  
- **禁止**覆盖 `userNoteRaw`；若项目约定 `note` 由前端管理，则 AI 也不写 `note`。  
- **禁止**删除或清空前端写入的 `context` / `contextOffset`。  
- `word` 禁止跨段落、禁止含 `\n`。  
- 字符串内禁止未转义换行破坏 JSON。  
- 批改必须绑定 `context`。  
- 注释以 `+` 开头 = Explicit Lookup Flag，复现权重最高。  
- 期总结节点：

```json
{
  "id": "summary-<ts>",
  "file": "content/…",
  "type": "content_summary",
  "summary": "掌握度与复盘文字",
  "time": "ISO-8601"
}
```

### 9.1 Smart Merge（服务端保存 notes 时）

- 保留已有 `aiReview`，不被前端整表覆盖冲掉  
- 保留 `type: content_summary`（若本次 payload 未带）  
- 按 `id` 合并，禁止盲目整文件覆盖  

---

## 10. 文件命名

| 类型 | 路径 |
| :--- | :--- |
| 杂志 | `content/magazines/magazine[NN]_[slug].md` |
| 单元 | `content/units/unit[NN]_[slug].md` |
| 补丁练习 | `content/units/unit[NN]_remediation.md` 或文末章节 |

标题层级不要跳级（H2 后不要直接 H4），以免 TOC 出错。

---

## 11. Phase 2 收尾清单

```
[ ] imageQuery 全部下载或标注失败项
[ ] 图示均有 <!-- visual: … --> 且 Type 在 visual_arsenal 内
[ ] MCQ/T-F 均含 <!-- answer: … --> 供批改
[ ] 无非法 ___ ；无「同一题 ___ + [Your Answer]」双重输入框（validate 会报 dual input）
[ ] node scripts/validate_content.js 通过
[ ] calendar.md / log.md / AGENT.md 已更新
[ ] warehouse 已标记（若使用）
```
