# 项目生命周期 (project_lifecycle.md)

## 一句话说明

空白模板可以被用成三种形态。**选哪种都可以**，按科目是否相近、你是否想共用同一套画像来决定。

| 形态 | 什么时候用 | 做法 |
| :--- | :--- | :--- |
| **① 单项目 · 单科** | 暂时只学一门 | 本仓库直接 Phase 0 |
| **② 单项目 · 多轨道（相近课）** | 如 Digital Health 下好几门相关课，画像会越学越清晰、想共用 gaps/日历 | **同一项目内**用 Track（轨道），不必复制文件夹 |
| **③ 多项目 · 一科一文件夹** | 科目差很远（乐理 vs 临床医学），或笔记必须物理隔离 | 复制模板成新文件夹再 Phase 0 |

你最初「一门课定制一份」和后来「相近课放一起」**都对**——② 和 ③ 都是正式支持的余量。

---

## 形态 ②：同一项目多轨道（推荐给 Digital Health 这类）

### 怎么组织

1. Phase 0 时科目可写成**领域总称**（如 Digital Health），并声明初始轨道列表。  
2. `domain_map.md` 按 **Track** 分一级（见该文件「多轨道」节）。  
3. `calendar.md` / `log.md` / `gaps.md` / `desire.md` 相关行带 **Track** 列或标签。  
4. 生成文件名建议带轨道缩写：  
   `magazine03_dh_interop_fhir.md` / `unit02_him_coding.md`  
5. `AGENT.md` 状态区写：`Subject: Digital Health | Tracks: A,B,… | Active: A`

### 以后加一门相近课

说「新增轨道：……」→ AI 更新 domain_map / desire / calendar Wave，**不必**重跑完整 Phase 0，只补 intake 里与新轨道相关的槽位并确认。

### 排期时

Phase 1 提案必须写明**本期服务哪条 Track**（可写「跨轨道综述」但要标清楚）。  
弱点复现优先留在同一 Track；跨 Track 迁移须在提案里说明理由。

### 何时该拆成形态 ③

- 两门课几乎没有共享概念，硬放一起只会让日历/gaps 噪音变大  
- 你希望完全不同的模态（一门纯 T、一门纯 M）且经常打架  
- 笔记量爆炸，侧栏难以浏览  

---

## 形态 ③：复制出新科目项目

```
learningTextbookModule/     ← 母模板（保持空白可升级）
learning-digital-health/    ← 领域项目（内可多 Track）
learning-music-theory/      ← 不相近的另一门，单独一份
```

1. 复制文件夹并改名  
2. 打开后「按 AGENT.md 做 Phase 0」  
3. 母模板里不要直接写某科目正文（除非你决定母模板=唯一项目）

### 母模板升级

协议改进后：拷 `protocols/` 等到各科目项目，或只升母模板并在科目 `AGENT.md` 注明协议基线日期。

---

## 形态：同一仓库「换掉」旧科目（少用）

不相近科目要占用**同一**文件夹时，先归档再 Phase 0：

1. `content/` `notes.json` `images/` → `archive/[旧名]/`  
2. 重置 profile / desire / gaps / calendar / domain_map / log / warehouse  
3. AGENT 恢复模板态或从母模板重拷  
4. 再 Phase 0  

未归档就开新科 = 注释串期、日历混乱。

---

## Bootstrap 后

见 `AGENT.md`「Bootstrap 后改造」。多轨道时标题可用领域名，状态区必须列出 Tracks。

```
协议基线: learningTextbookModule @ YYYY-MM-DD
Subject: … | Tracks: … | Active Track: …
```
