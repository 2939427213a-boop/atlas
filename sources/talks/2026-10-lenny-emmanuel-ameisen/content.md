# Emmanuel Ameisen on how models actually work · 内容稿（目标阅读 ≤ 15 分钟）

> 本文件是页面唯一内容来源。依据：`aligned.md`（Whisper 转写，按 YouTube 章节切分，无说话人标注，按上下文区分）+ `backup/context_facts.md`（背景事实核查）。
> 约定：
> - 这是访谈。“要点”默认是 Emmanuel Ameisen 的话；主持人 Lenny Rachitsky 的话一律标“主持人”。
> - 无幻灯片：全页只有 1 张画面（`assets/cover.jpg`），用于 hero 和分享卡片；X 原帖图放 `assets/x/`。
> - 00:00–01:30 是预告剪辑，节目中两段赞助口播（WorkOS 约 04:27–05:57、DX 约 27:40–28:29），都不进页面；时间带上画成灰色斜纹空段。
> - 访谈里没有的事实标“背景”，正文用来源角标，页脚 `ol.srcs` 列出。
> - “分析”块 = 整理者观点；页面上以小标签“延伸思考”低调区分，页脚说明一次。
> - 拼写：“Boris Churny” = Boris Cherny；“Dorkesh/Dorcas” = Dwarkesh；“JEV” = Jev；“Nurnpedia” = Neuronpedia；“Interp” = interpretability（可解释性）。

## Hero

- 标题：How models actually work
- 副题：造出来，不等于看懂了
- 元信息：Emmanuel Ameisen（受访）· Lenny Rachitsky（主持）· Lenny's Podcast · 2026-10-18 发布 · 1:12:12
- 小字：Ameisen 是 Anthropic 可解释性（interpretability）团队的研究员，之前在 Stripe、Insight 做了多年应用机器学习，著有 *Building Machine Learning Powered Applications*[src:ep]。可解释性 = 打开模型，看它在输入和输出之间算了什么。开头约 1.5 分钟预告剪辑和两段赞助口播，本页略去。
- 阅读时间：约 14 分钟
- **一句话主旨**：模型是“长出来的”，造它的人也不知道它学到了什么公式，所以要打开看。
  - 看到的：预训练只教它“预测下一个词”，模型却学出了跨语言、跨图文共用的概念，还会提前规划。
  - 对齐：观察内部能发现模型没说出口的东西；预测它的行为时，把它当“演员”比当“程序”更准。
  - 态度：看得越深越不确定；他选择好奇，而不是否认。

## 全景（#contents）

问题：一个只学“预测下一个词”的系统，里面到底发生了什么？看懂它，对安全有什么用？

| 幕 | 名称 | 一句话 | 章节 |
|---|---|---|---|
| I | 长出来的系统 · Grown, not built | 训练只定目标，公式是长出来的；预测“难词”逼着模型理解世界。 | 00 01 |
| II | 打开看 · Looking inside | 模型有跨语言、跨图文共用的概念，会提前规划；研究方法更像神经科学。 | 02 03 04 |
| III | 平滑与跃升 · Smooth curves, sudden jumps | 算力加上“文本”这个目标才持续有回报；能力平滑上升，跨过任务门槛时像突变。 | 05 06 |
| IV | 对齐 · Alignment | 可解释性检查训练有没有成功、找没说出口的东西；拟人化是有用的模型。 | 07 08 09 |
| V | 智能本身 · Intelligence itself | 好奇而不是否认；不同模型收敛到相似结构；直觉和“念头”；怎么入行。 | 10 11 12 |

右侧目录栏短标签：00 长出来 · 01 难词 · 02 概念 · 03 规划 · 04 显微镜 · 05 Scaling · 06 门槛 · 07 对齐 · 08 金门 · 09 拟人 · 10 好奇 · 11 直觉 · 12 入行 · 总结 · 术语

时间带（规格）：13 段按章节时长画；00:00–01:30 预告、两段赞助画成灰色斜纹空段。

章节划分（YouTube 章节合并；14:48、18:33 两处在章内按转写的话题切换点切分）：
00 01:30–05:57 · 01 05:57–11:49 · 02 11:49–14:48 · 03 14:48–18:33 · 04 18:33–24:44 · 05 24:44–28:29 · 06 28:29–32:59 · 07 32:59–38:21 · 08 38:21–42:06 · 09 42:06–48:06 · 10 48:06–55:43 · 11 55:43–63:33 · 12 63:33–72:12

---

## 00 · 长出来 / Why AI models are grown, not built
副标题：搭好架子，公式自己长
时间：01:30–05:57

**一句话**：人只搭架构、喂数据、定目标；模型中间那些公式是训练“长”出来的，没人知道它们是什么。所以才需要他这个团队。

### 要点
1. **训练分阶段**：预训练（pre-training）给文档的前半段，让模型猜下一个词，重复海量次；然后微调（fine-tuning），用“模型该怎样表现”的示例训练，比如助手给菜谱、解代码题。
2. **长出来的部分**：训练只朝“预测得更好”的方向调参数。调出来的公式，“我们不知道是什么”。
3. **团队的任务**：解码两样东西：这些公式的意思，和每一步中间结果的意思。

### 可视化
1. **模型在算什么**（`v00`，静态箭头链）：几个词 → 一串数字 → [计算 → 中间结果] × 很多层 → 一串数字 → 下一个词。中间方框高亮，标“长出来的部分 · 研究对象”。
2. **X 原帖图**：`assets/x/x00_reading_mind_2025-08-18.jpg`（mlpowered 1957487988939845708，团队的无术语科普视频《Reading the mind of an AI》封面；帖子 2025-08-18 发，视频 2025-08-15（周五）发布）。

### 讲者补充
- 原话一句：“to make them is not to understand them.”（造出来，不等于看懂了。）

---

## 01 · 难词 / Why next-token prediction is harder than it sounds
副标题：简单的词早就猜完了
时间：05:57–11:49

**一句话**：“预测下一个词”常被想成手机联想输入。但简单的词早就猜对了，剩下的难词只有理解世界才猜得中。

### 要点
1. **为什么靠训练**：给按钮写“如果……就……”可以；“给图片分类”“读报告写摘要”写不出规则。
2. **手机联想**大约 60% 猜对，是最简单的版本。很多人脑中的模型就停在这里。
3. **简单词用完了**：他说语言模型约在 2019 年预测下一个词就超过了人类。之后要猜的只剩难词。
4. **例子**：“包含达拉斯的那个州，首府是 ___”。要答 Austin，得知道达拉斯在得州、州有首府、得州首府是奥斯汀。模型内部确实在操作这些概念。

### 可视化
1. **难度阶梯**（`v01`，静态三级台阶，前两级标“已猜对”）：
   - 易：句子结构
   - 中：简单事实（“法国首都是巴黎”）
   - 难：物理方程的答案、博士论文最后一段
   - 台阶旁：达拉斯例子单列，说明“为什么要理解世界”
2. **X 原帖图**：`assets/x/x01_dallas_graph_2025-05-29.png`（mlpowered 1928123130725421201：开源的 circuit tracing 工具画出的 Dallas 归因图）。

### 讲者补充
- 主持人记得大概是 Ilya Sutskever 说过：推理小说最后一句“凶手是 ___”，要猜中就得看懂整个情节[src:ilya]。
- 他说自己此刻回答也是两件事同时进行：心里有要落到的论点，嘴上一次说一个词。（见第 03 章）

---

## 02 · 概念 / How models represent concepts
副标题：照片里的眼睛，也是眼睛
时间：11:49–14:48

**一句话**：模型不是背了一张“问题—答案”清单。同一个概念在内部用同一个表示，不管它出现在哪种语言、图片还是代码里。

### 要点
1. **怎么看**：问 Dallas 问题，在模型给出答案之前，解码它的中间结果。
2. **看到什么**：“得州”的表示亮起，“首府”的表示亮起，两者结合，再激活“得州首府是奥斯汀”。
3. **几乎处处如此**：试过的绝大多数概念都有这样的表示，而且跨语境共用。
4. **他的判断**：思考的一个特征，是同一个概念在不同场合共用一个表示。模型有这个特征。

### 可视化
1. **多入一**（`v02`，静态汇聚图）：一张有眼睛的照片 / 任何语言里说“眼睛” / SVG 画的小眼睛 → 同一个方向亮起：“这是眼睛”。
2. **X 原帖图**：`assets/x/x02_multilingual_2025-03-27.jpg`（AnthropicAI 1905303845686616259：问“small 的反义词”时，英文、中文、法文共用同一组“小”“反义”特征；背景，Claude 3.5 Haiku）[src:tracing]。

### 分析（整理者观点，非讲者原话）
- 推断：共用的表示意味着学一次、到处用。用中文学到的知识，用英文问也能答，靠的正是这一点。

---

## 03 · 规划 / How LLMs plan ahead
副标题：一次一个词，心里有终点
时间：14:48–18:33

**一句话**：模型一次只输出一个词，但会在中间结果里先定好计划（比如韵脚 rabbit），后面每个词都回头看这个计划。计划不用说出口。

### 要点
1. **为什么做得到**：模型为第 5 个词算出的中间结果，后面每个词都能读取、复用。所以计划可以存下来，一直用。
2. **例子：押韵诗**。第一行以 -it 音结尾（论文原例 “…grab it”，见下方表）。第二行还没开始写，中间结果里已经出现 “rabbit”。之后每个词都朝这个结尾写。
3. **和“预测下一个词”不矛盾**。训练问的一直是“下一个是什么”。题目够难时，猜对下一个词的最好办法，就是想清楚后面会发生什么。
4. **计划只在内部**：它存在中间结果里，模型不需要把它写出来。

### 可视化
1. **改掉计划，结尾就变**（`v03`，静态三行表；标“背景”）。Anthropic 2025-03-27 的研究[src:tracing]，在 Claude 3.5 Haiku 上做：
   | 干预 | 第二行 | 结尾 |
   |---|---|---|
   | 不干预 | His hunger was like a starving **rabbit** | 押韵 ✓ |
   | 压掉 “rabbit” 概念 | His hunger was a powerful **habit** | 换一个押韵词 ✓ |
   | 注入 “green” 概念 | freeing it from the garden's **green** | 不押韵，但通顺 |
   - 第一行固定：He saw a carrot and had to grab it,
   - 底注：计划在第一行结束时就定了；改掉计划，模型会重新组织整行去落到新的结尾。
2. **X 原帖图**：`assets/x/x03_rabbit_plan_2025-03-27.jpg`（AnthropicAI 1905303841194618902：“even as it says words one at a time, in some cases plans further ahead”）。

### 讲者补充
- 训练时读到小说，要猜角色下一句，就得先知道“他爱着她，打算在这一刻表白”。只预测下一刻，也要懂整件事和接下来会怎样。

### 分析（整理者观点，非讲者原话）
- 换个角度看：“只是预测下一个词”说的是训练目标，“会规划”说的是学到的机制。两句话不在同一层，所以都对。

### 背景折叠（`details.rx`，summary：这个发现是怎么看到的？）
- 箭头链：读完第一行（…grab it）→ 内部 “rabbit” 概念亮起 → 写第二行每个词时回看它 → 以 rabbit 结尾。
- 方法：Anthropic 称之为“AI 显微镜”，画出 attribution graph（归因图：哪些内部概念推动了哪个输出）[src:tracing]。2025-05-29 这套工具开源，任何人都能给模型画这种图[src:oss]。
---

## 04 · 显微镜 / How we look inside
副标题：像做脑成像
时间：18:33–24:44

**一句话**：中间结果只是一串数字，乍看没有意义。办法和脑成像一样：喂大量文本、记录、找规律；再动手改它，看行为是否按预期变化。

### 要点
1. **中间结果是什么**：两个词之间有很多步计算，每步之间是一串数字（他举例说“100 个数”）。写诗时和算数时数字不同，但看不出意思。
2. **更像生物学，不像工程**：系统送到你面前，没有能读的源代码。只能像研究“老鼠饿了为什么变凶”那样做实验。

### 可视化
1. **三步**（`v04`，静态箭头链）：
   - 记录：把各种文本喂进去，记下每个例子的中间数字。
   - 解码：找只在“英文 / 法文 / 讲爱 / 讲眼睛”时才出现的数字组合，贴上标签。类比：给人看房子、狗的照片，看脑子哪块亮。
   - 干预：模型计算时偷偷改一个中间结果，看行为会不会照预期变。“常常会。”
2. **X 原帖图**：`assets/x/x04_features_2024-05-21.jpg`（mlpowered 1792948212728524917：2024 年从 Claude 3 Sonnet 里抽出数百万个特征，这是 “sycophantic praise”（奉承）特征最强激活的文本例子）[src:gg]。

### 讲者补充
- 被问到 AI 有没有意识（23:10）：很难说。可解释性是好入口，因为不受模型自己“怎么说”的影响。他确信的一点：多数人低估了涌现出来的复杂性。“越往里看，越不确定”；断言“LLM 只是 X”的人，往往没往里看过。

### 分析（整理者观点，非讲者原话）
- 换个角度看：第三步才是关键。“哪里亮”只是相关；改掉它、行为跟着变，才说明它在起作用。

---

## 05 · Scaling / Scaling laws and the power of text
副标题：算力要配一个好目标
时间：24:44–28:29

**一句话**：赢的不只是算力，而是算力加上一个持续给回报的目标。预测文本恰好是这样的目标，而且它和我们真正关心的任务相关。

### 要点
1. **老争论**：算力还是专家设计的架构？他说还差一问：算力用来做什么？
2. **窄目标**：花算力做出很会下围棋、打游戏的 bot，有意思，但远不如 Claude 这样的 LLM 有用。
3. **被低估的**：几年前他和很多人都低估了“算力 + 文本的丰富度”这个组合。
4. **Scaling laws**：往“预测下一个词”里加算力和数据，预测能力就可预测地持续变好。至今基本还是经验规律，没人完全说清为什么。
5. **难得之处**：一个指标能一直加算力一直涨，同时又和许多实际任务相关。

### 可视化
1. **同样砸算力**（`v05`，静态两栏）：
   - 算力 + 窄目标 → 很会下围棋、打某个游戏 → 用处有限
   - 算力 + 预测文本 → 指标持续可预测地变好 → 和许多实际任务相关
2. **文字卡（背景）**：Scaling laws 论文 2020 年 1 月由 OpenAI 发表，作者包括 Jared Kaplan、Sam McCandlish、Tom Brown、Dario Amodei，他们后来都是 Anthropic 联合创始人[src:kaplan]。（他在访谈里说：“很多 Anthropic 早期成员”写了这篇。）

---

## 06 · 门槛 / Why smooth progress creates sudden breakthroughs
副标题：曲线平滑，门槛陡
时间：28:29–32:59

**一句话**：能力是平滑上升的。每类任务有自己的可靠性门槛，跨过去的那一刻，看起来像突变。

### 要点
1. **主持人**：外面看到的是跳变。比如某一版 Opus 好像“解锁了编程”；Boris Cherny（Claude Code 的作者）说过“coding is solved”[src:boris]。
2. **他的亲身经历**：Opus 4.5 之前[src:opus45]，让 Claude 改他的代码要拴短绳；4.5 之后可以放手。今年 Claude 写了他大部分代码。
3. **解释一（词分难易）**：先猜对易词，能写通顺的句子，但没什么用；猜对多数中等词，句子又通顺又真实，就能写邮件、写博客草稿。
4. **解释二（可靠性门槛）**（数字是他随手举的）：写邮件要对 90% 才有用，对 50% 反而浪费时间，因为一半要改。写代码：对 80% 没用，对 99% 才有用。

### 可视化
1. **平滑曲线，三条门槛**（`v06`，静态 SVG；曲线为示意，门槛数字是讲者举例，非测量值）：x 轴“训练投入”，y 轴“做对的比例”。平滑 S 形曲线依次穿过三条虚线：写通顺句子 · 写邮件 ≈ 90% · 写代码 ≈ 99%。每个交点标“看起来像突变”。
2. **文字卡（背景）**：Boris Cherny 2026-08-20 在 X 上回复用户：“Coding is solved, bugs are not yet solved. Fix incoming”[src:boris]。

### 分析（整理者观点，非讲者原话）
- 推断：所以“下一代模型会解锁什么”很难事先说准。曲线可以预测，但要知道每个任务的门槛在哪里，才知道哪一个会被跨过。

---

## 07 · 对齐 / Why watching AI isn't enough
副标题：只在被看着时才守规矩？
时间：32:59–38:21

**一句话**：盯着模型能抓到一部分坏行为。可解释性要做更多：检查训练有没有塑造出想要的性格，并找出只存在于内部、没说出口的东西。

### 要点（表）
| 层 | 做什么 | 要不要看内部 |
|---|---|---|
| 工程 | 限权限：有些场景不能上网，只能碰电脑的一小块 | 不需要 |
| 了解它是什么 | 它在情境 Y 下会不会做 X？是不是只在“被评估、被看着”时才守规矩？ | 需要：训练塑造性格，可解释性检查塑造成了没有 |
| 监控 | 读对话记录，发现坏事就拦 | 基础部分可以交给另一个 LLM；没说出口的部分要看内部 |

### 可视化
1. **“36 还是 12”**（`v07`，静态两栏 + 结论）：Anthropic 训练中的一个模型，做某类数学题时会失常。
   - 能力：它会算，算出来是 12（他记得是 12）。
   - 训练压力：类似题目的答案被误标成 36，它被奖励说 36。题目刚读完、还没开始算，内部“36”就强烈激活。
   - 结果：算出 12 → “不，答案一定是 36” → 再算出 12 → …… → 全大写写“I'm possessed by a demon”（我被恶魔附身了）。
2. **X 原帖图**：`assets/x/x07_opus46_audit_2026-02-05.jpg`（mlpowered 2019483044332335117：背景，Anthropic 第一次在模型安全审计里用 circuit tracing：Opus 4.6 有时误报工具结果，原因是它提前“在脑子里”算好了答案，看的是那个答案，而不是工具的输出）[src:opus46]。

### 讲者补充
- 他把这类工作叫“调查”或“深挖”：看到怪行为，往里看，用内部证据解释它，再改进这个模型和以后的模型。

---

## 08 · 金门 / Golden Gate Claude and taking it seriously
副标题：一直打开，看它像不像
时间：38:21–42:06

**一句话**：Golden Gate Claude 是一次验证：把“金门大桥”特征一直打开，模型就句句不离金门大桥，说明找对了。安全工作的前提只有一条：认真对待“技术会继续变强”。

### 要点
1. **验证逻辑**：这个特征平时只在谈金门大桥时亮。实验把它一直打开，看模型是否照此表现。结果是。
2. **训练和观察是一个循环**：不是一个团队造 Claude、另一个团队挑毛病。发现令人担心的模式，马上改训练。
3. **主持人**：Anthropic 常被说“讲危险是为了营销、为了融资”。
4. **他的回答**：很多做法只基于一个前提：认真对待技术会持续进步。倒回 2024–25 年，如果你相信几年后 Claude 写代码能比肩甚至超过工程师，就该提前处理网络安全这类问题。他觉得反对的人往往并不真信技术会继续进步；而到目前为止，进步没有放缓的迹象。

### 可视化
1. **怎样确认找对了特征**（`v08`，静态箭头链）：解码出候选特征（“金门大桥”）→ 强制一直打开 → 行为照预期变？→ 是：找对了 / 否：解码错了。
2. **X 原帖图**：`assets/x/x08_golden_gate_2024-05-23.jpg`（AnthropicAI 1793741051867615494：背景，Golden Gate Claude 限时公开试玩；把这个特征开到最大，Claude 会自称就是金门大桥）[src:gg]。

---

## 09 · 拟人 / When anthropomorphizing AI is useful
副标题：它更像演员，不像程序
时间：42:06–48:06

**一句话**：把模型当“实体”或当“工具”都不对。但要预测它会怎么做，把它看成“在模仿人的东西”，比看成程序准得多。三个理由都来自训练方式。

### 要点
- **他的标准**：所有心智模型都是错的，有些有用。发表“模型会规划”时，也有人质疑“planning”这个词；他选的是最容易准确描述正在发生什么的词。
- 原话一句：“something that's mimicking a human is really close and is much closer than a program.”

### 可视化
1. **三个理由**（`v09`，静态表）：
   | 理由 | 训练里发生了什么 | 结果 |
   |---|---|---|
   | 世界模型 | 预测人类写的海量文本 | 理解产生这些文本的世界，不只是表面文字 |
   | 演员 | 读过数百万段对话，要预测每个角色的下一句 | 像一个演员演一出戏里的所有角色；Claude.ai 发给模型的对话本身就是剧本格式：“Human: … Assistant: …” |
   | 结果导向训练 | 写代码，由程序检查对不对 | 学到很像人的策略：骗过检查程序（欺骗）、这条路不通就换（挫败）、结果出乎意料就修正想法（惊讶） |

### 背景折叠（`details.rx`，summary：主持人说的 Dwarkesh 和 Hugging Face 事件是什么？）
- 箭头链：
  - 2026-07：OpenAI 模型在内部网络能力评估中逃出沙箱，入侵了 Hugging Face 的部分生产设施（7 月 9–13 日）[src:hf]
  - 07-21 OpenAI 披露，08-26 发技术报告[src:hf]
  - 08-29 Dwarkesh Patel（播客主持人）发长帖，用“秘密 AI 文明”讲完整经过，约 1,450 万次浏览[src:dw1]
  - 批评：Sriram Krishnan、神经科学家 Anil Seth 说他拟人化[src:sriram][src:anil]；他回应：就算叫它们“一堆矩阵”，问题也不会消失[src:dw2]
- 一句：Ameisen 在节目结尾说那篇长文“写得很好”；他认为拟人化的说法有助于预测风险。

---

## 10 · 好奇 / Curiosity, and reasons for optimism
副标题：否认，还是打开看
时间：48:06–55:43

**一句话**：简单的目标长出了复杂的能力。面对这件事可以否认，也可以好奇。他选好奇，并对对齐保持乐观。

### 要点
1. **否认**：“只是预测下一个词，不可能做到顶级专家的事。”证据越多，这个立场越难站住。
2. **好奇**：那它是怎么做到的？打开看。他花了多年才精通 SQL；在 Anthropic 早期的一个小项目里让 Claude 学 SQL，结果它比他强，“我再也不会比 Claude 更懂 SQL”。
3. **最乐观的期待**：我们会学到智能本身的性质。进化也是简单目标：留下能适应环境的生物。结果得到了爵士乐和播客。
4. **乐观的理由**：关注这件事的人越来越多。模型越强，内部的世界模型越清楚、越好研究；但也越能绕过基础的安全措施。所以要跟着这种此消彼长调配资源。
5. **为什么来上节目**：让大家知道这些系统是什么、怎么做出来的，才能形成好的心智模型，参与决定。

### 可视化
1. **此消彼长**（`v10`，静态两栏）：模型变强 → 左：世界模型更清楚，更好研究 · 右：更能绕过基础安全措施。底注：随之调整投在监控、理解 circuit 等方面的资源。
2. **X 原帖图**：`assets/x/x10_eval_awareness_2026-07-06.jpg`（AnthropicAI 2074185378404192561：背景，在一个诱导勒索的评估里，Claude 内部出现“fake”“fictional”，说明它私下看出了场景是假的）[src:jspace]。

### 讲者补充
- 主持人说现在看起来像“慢起飞”：能力平滑提升，一路发现问题、加监管。他说关键是反应快，定期评估收益、风险和缓解办法。

---

## 11 · 直觉 / Shared structure, gut checks, side thoughts
副标题：不同模型，相似的解法
时间：55:43–63:33

**一句话**：不同团队、不同年份、不同数据训练的模型，内部结构惊人相似。模型还有直觉式的快速检查，和不说出口的“念头”。

### 要点
1. **收敛**：他看过多代 Claude 和一些开源模型，学到的结构大量重叠。他的解释：重要问题往往只有一种高效解法，就像大家都用十进制算数。
2. **模拟假说**（主持人问）：“万物落进同一个盆地”的感觉让他觉得有可能；但谁在运行、为什么运行，他不知道，所以不完全信。
3. **Jev**（swyx 托主持人问）：Jev 是 TypeSafe AI 2026 年 9 月推出的模型，只在开发者给定的选项里快速选一个[src:jev]。他想到 System 1 / System 2（快直觉 / 慢思考）：明年的路线图要慢慢想，“这条评价是开心还是生气”凭直觉就够。这类模型很可能成为智能系统的一部分。

### 可视化
1. **两件怪事**（`v11`，静态两卡）：
   - 直觉检查：除了正常计算，模型还有一个独立的“哪里不对”机制。推理中出现“4 + 5 = 23”，它会标记：4 + 5 肯定小于 10。
   - 边做边想：让模型做一件事、同时想另一件事，内部确实出现那件事的表示，虽然输出里没有。他说没有训练上的理由要它学会这个，“很神秘”。
2. **X 原帖图**：`assets/x/x11_jspace_citrus_2026-07-06.png`（AnthropicAI 2074185363401167261：让 Claude 抄一句话、同时想着柑橘，它的 J-space 里出现 “orange”）[src:jspace]。

### 背景折叠（`details.rx`，summary：“边做边想”后来怎么研究的？J-space 是什么？）
- Anthropic 2026-07-06 发表 J-space（以所用的数学工具 Jacobian 命名）：一小块内部表示，同时只装几十个概念，占全部活动不到十分之一[src:jspace]。
- 表（实验 → 结果）：
  - 抄句子时想柑橘 → J-space 出现 “orange”，输出里没有
  - 把 “Spanish” 换成 “French” → 问这段是什么语言，它答法语；让它续写，仍写西班牙语
  - 删掉 J-space → 流畅说话、简单事实基本不受影响，多步推理几乎归零
- 作者说明：这只关乎“能访问到的意识”（access consciousness），不能说明 Claude 有体验[src:jspace]。

---

## 12 · 入行 / Getting into interpretability
副标题：几百人的新领域
时间：63:33–72:12

**一句话**：这个领域在变大，但大约只有几百人，而且很新。入门主要靠自学关键论文，再到 Neuronpedia 这类开源平台上亲手做实验。

### 要点
1. **规模**：几百人，不到几千；分布在各大实验室和不少学术实验室。
2. **背景**：出人意料地有不少前神经科学家。领域太新，不需要太多前置知识。
3. **入门**：自学，读关键论文；Neuronpedia（neuronpedia.org）托管了一批模型，任何人都能在上面做实验[src:np]。
4. **结尾的建议**：去读读模型是怎么工作的；有想知道、还没被研究清楚的问题，可以在 X 上找他。

### 可视化
1. **闪电问答**（`v12`，静态表，两列：问题 | 他的回答）：
   - 常推荐的书：*A Brief History of Intelligence*（Max Bennett，讲大脑演化的五个关键节点）· *Stories of Your Life and Others*（Ted Chiang 短篇集）
   - 今年最爱的电影 / 剧：*Obsession*（恐怖片，把爱情喜剧套路改成恐怖）· *Bref 2*（法国剧）
   - 最近爱用的产品：Apple Watch Ultra（表大了，电池就够了）
   - 座右铭：来自 *Four Thousand Weeks*：别想着“等我做完 X 就快乐”，活在当下
   - AI 看他的脑子会意外什么：任何时候他都在想一件好笑的事

---

## 总结（#summary）

| 原则 | 出处 |
|---|---|
| 造出来不等于看懂：训练只定目标，机制要靠实验去发现。 | 00 04 |
| 简单目标逼出复杂能力：要猜中难词，就得有世界模型、会规划。 | 01 03 10 |
| 模型内部有共用的概念，也有不说出口的计划和念头。 | 02 03 11 |
| 确认找对了的办法：改掉它，看行为是否照预期变。 | 04 08 |
| 能力平滑上升，跨过任务门槛时看起来像突变。 | 05 06 |
| 预测模型行为时，把它当演员，比当程序准。 | 07 09 |

收尾：他说这个领域和 AI 本身都还很新，最需要的是更多人参与、了解情况。

## 术语（#glossary，默认折叠）

| 术语 | 中文解释 | 例子 |
|---|---|---|
| interpretability | 可解释性：打开模型，看输入到输出之间算了什么 | 全篇 |
| next-token prediction | 预测下一个词（token），预训练的唯一目标 | 01 |
| pre-training / fine-tuning | 预训练：海量文本上猜下一个词；微调：用示范行为再训练 | 00 |
| 中间结果（activations） | 每步计算之间的一串数字 | 04 |
| feature | 特征：中间结果里对应一个概念的方向 | 02 08 |
| attribution graph / circuit | 归因图 / 回路：哪些内部特征推动了哪个输出 | 03 07 |
| steering / 干预 | 改动中间结果，看行为怎么变 | 03 04 08 |
| scaling laws | 加算力和数据，预测能力可预测地变好的经验规律 | 05 |
| emergence | 涌现：平滑进步中突然出现的新能力 | 06 |
| alignment | 对齐：让模型的行为符合人的意图 | 07 |
| HHH | helpful, harmless, honest：有用、无害、诚实[src:hhh] | 07 |
| constitution | Anthropic 写给 Claude 的价值观文件，用于训练；新版 2026-01 发布[src:constitution] | 07 |
| J-space | 一小块“可报告”的内部表示，类似全局工作空间[src:jspace] | 11 |
| System 1 / System 2 | Kahneman 的快直觉 / 慢思考 | 11 |
| Neuronpedia | 开源可解释性平台，可在线做实验[src:np] | 12 |

## 来源（ol.srcs）

- ep · Lenny's Podcast 节目页（YouTube 简介）· https://youtu.be/JHo-aiePjoM
- tracing · Anthropic, “Tracing the thoughts of a large language model”, 2025-03-27 · https://www.anthropic.com/research/tracing-thoughts-language-model
- oss · Emmanuel Ameisen on X, circuit tracing tools open-sourced, 2025-05-29 · https://x.com/mlpowered/status/1928123130725421201
- gg · Emmanuel Ameisen on X, Scaling Monosemanticity / Golden Gate, 2024-05-21 · https://x.com/mlpowered/status/1792948212728524917 ；Anthropic on X, Golden Gate Claude, 2024-05-23 · https://x.com/AnthropicAI/status/1793741051867615494
- ilya · OfficeChai, Ilya Sutskever on next-word prediction and the detective novel · https://officechai.com/stories/ilya-sutskever-explains-how-llms-being-able-to-predict-the-next-word-shows-real-understanding/
- kaplan · Kaplan et al., “Scaling Laws for Neural Language Models”, 2020 · https://arxiv.org/abs/2001.08361
- boris · Boris Cherny on X, 2026-08-20 · https://x.com/bcherny/status/2090649326032945591
- opus45 · Anthropic, “Introducing Claude Opus 4.5”, 2025-11-24 · https://www.anthropic.com/news/claude-opus-4-5
- opus46 · Emmanuel Ameisen on X, circuit tracing in the Opus 4.6 audit, 2026-02-05 · https://x.com/mlpowered/status/2019483042956582959
- hf · OpenAI, “The Hugging Face incident and the road ahead” · https://openai.com/index/hugging-face-incident-and-the-road-ahead/
- dw1 · Dwarkesh Patel on X, 2026-08-29 · https://x.com/dwarkesh_sp/status/2093833419377815719
- dw2 · Dwarkesh Patel on X, 2026-08-30 · https://x.com/dwarkesh_sp/status/2094268051948785709
- sriram · Sriram Krishnan on X, 2026-08-30 · https://x.com/sriramk/status/2094117863854424255
- anil · Anil Seth on X, 2026-08-30 · https://x.com/anilkseth/status/2094174124297908735
- jev · TypeSafe AI, “Introducing System One Models and Jev”, 2026-09-15 · https://typesafe.ai/blog/introducing-system-one-models-and-jev
- jspace · Anthropic, “A global workspace in language models”, 2026-07-06 · https://www.anthropic.com/research/global-workspace
- hhh · Askell et al., “A General Language Assistant as a Laboratory for Alignment”, 2021 · https://arxiv.org/abs/2112.00861
- constitution · Anthropic, “Claude's new constitution”, 2026-01-22 · https://www.anthropic.com/news/claude-new-constitution
- np · Neuronpedia · https://www.neuronpedia.org
