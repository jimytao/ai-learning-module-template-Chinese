# Phase 0：科目引导与空白填充 (p0_bootstrap.md)

> **触发**：用户说「我要学…」「初始化」「设定科目」，或 profile/calendar 仍为空白。
> **入口在根目录 `SETUP.md`** —— 首次运行请从那里开始（Step 0 环境准备是本文件没有的）。
> 本文件是 Phase 0 的**细则层**：写入字段、domain_map / calendar 初始化要求。
> **必须先加载**：`protocols/intake_checklist.md` + `knowledge/modality_presets.md`
> **目标**：采集 → **用户确认** → 写入 → **按 `SETUP.md` Step 5 改造 AGENT.md** → 才允许 Phase 1。

---

## Step 1：按 intake 清单采集

完整槽位与勾选表见 **`protocols/intake_checklist.md`**（A–G）。

最低限度必须拿到：

1. 科目 + 可检验目标  
2. 水平 + 已知 + 弱项  
3. 兴趣（可少）+ 时间约束  
4. **主要解释语言 / 最熟悉的语言**，与学习内容语言分开确认
5. **学习模态预设 T / M / H / C**（见 `modality_presets.md`）
6. （建议）阅读器排序 / Notes 范围偏好
7. **内容形态偏好**：配图密度 / 图示档位 / 便利贴 / 题型取舍（见 `intake_checklist.md` §H）

规则：

- 缺什么问什么；不编造。  
- TBD 允许暂时保留，但须在确认卡列出。  
- **未输出确认卡并获得用户「确认」前：禁止写入正式画像、禁止改 AGENT、禁止生成正文。**

---

## Step 2：输出确认卡并等待

使用 `intake_checklist.md` 中的「确认卡模板」。

- 用户修改 → 更新确认卡，再次等待。  
- 用户确认 → 进入 Step 3。

---

## Step 3：写入知识库与状态

| 写入目标 | 内容来源 |
| :--- | :--- |
| `knowledge/profile.md` | 科目、目标、水平、已知、约束、**解释语言 + 内容语言**、模态预设、阅读器偏好、**内容形态偏好（§H：配图 / 图示 / 便利贴 / 题型）** |
| `knowledge/desire.md` | 兴趣与想覆盖主题（`[ ]`） |
| `state/gaps.md` | 弱项初始 Kanban |
| `knowledge/domain_map.md` | 学科树草稿；已知节点标 Covered |
| `knowledge/calendar.md` | 指针 + Wave 前瞻（按模态：T 偏 Unit，M 偏 Mag，H 混合） |
| `state/warehouse.md` | 按学科改名的小模块池 |
| `state/log.md` | 空 Dashboard + 说明尚未开始 |
| `notes.json` | 保持 `[]` 或清空 |

### domain_map 要求（同前）

- 3–8 个一级主题；Core / Elective；深度 M/U；依赖边。

### calendar 按模态初始化

| 预设 | Wave A 建议 |
| :--- | :--- |
| T | 多为 Unit 草案 |
| M | 多为 Magazine 草案 |
| H | Mag/Unit 交错 |
| C | 按自定义规则 |

---

## Step 3.5：校验阅读器（浏览器/服务器文件的唯一归属）

> **本分支自带可用的阅读器**（`index.html`、`app.js`、`reader-core.js`、`server.js`、`styles.css`），
> 因此本步骤是**校验**而非构建。

1. 需要时先安装依赖（`npm install`），然后用 `start.bat` 启动并打开页面。Phase 2 之前目录为空
   是正常的 —— 这一步的验收标准是「能正常加载」，不是「能显示课文」。
2. **运行 `npm test`。** 测试覆盖交互式 Markdown 的往返写回、服务器路径安全、Smart Merge，
   以及注释锚定规则（`ReaderCore.annotationMatches`）。
3. **运行 `node scripts/verify_reader.js`，必须无 FAIL。** 它检查那些会静默腐化的契约：主题载体与
   FOUC 守卫、锁定的存储键与路由、`data-primary` 锚定规则、被排除的功能（无 Git UI），以及
   `notes.json` 的一致性。出现 FAIL 时按 `frontend_spec.md` 修实现，而不是改检查项。
4. `templates/reader_skeleton.html` 在本分支作为**参考外壳**保留，不需要复制过来 —— 自带阅读器
   已经实现了它所演示的内容。扩展 UI 时可以参考它。

---

## Step 4：改造 AGENT.md（关键）

确认卡通过后**必须**执行，完整清单见根目录 **`SETUP.md` Step 5**。要点：

1. 标题改为含科目名
2. 状态区写入 Subject + 模态 + `Phase 1 就绪`
3. 去掉空白模板套话；写入本科目一句话目标
4. **收窄 Phase 0 路由**为「仅补全 / 更新画像」，并保留重入护栏（`AGENT.md` 黄金规则 18）
5. 按模态注明默认提案倾向

第 4 项最容易漏 —— 漏了就没有任何环节会补上它。

**改造完成后，本项目即为该科目的学习项目，Phase 1 / Phase 2 解锁。**

接着按 `SETUP.md` Step 6 向 `state/log.md` 写入 `Initialized …` 行。那一行是本项目已初始化
的持久证据，也是阻止后续会话重跑 Phase 0 的幂等标记。

---

## Step 5：Bootstrap 摘要（改造完成后发一次）

| 栏目 | 内容 |
| :--- | :--- |
| 科目与目标 | … |
| 模态预设 | T/M/H/C + 含义一句话 |
| 知识地图 | 一级主题 |
| 前 5 期待排 | 已按模态标注 Mag/Unit |
| 初始弱项 | 3–5 条 |
| AGENT | 已改为科目项目态 ✅ |
| 阅读器 | 自带阅读器已校验（start.bat · npm test · verify_reader） |
| 待确认 TBD | … |

下一步提示：说「今天学什么」或「排期」→ Phase 1。

---

## Step 6：状态标记示例

```
**当前状态**: `Phase 0 完成 — Phase 1 就绪` | Subject: [科目] | 模态: H-Hybrid | YYYY-MM-DD
> 下一步: 「排期」→ Phase 1
```
