# Alex Zhang on Recursive Language Models · 内容稿（目标阅读 ≤ 15 分钟）

> 本文件是页面唯一内容来源。依据：`aligned.md`（Latent Space 官网逐字稿，带说话人；时间已换算成 YouTube 时间 = 播客时间 + 1:56）+ `backup/context_facts.md`（背景事实核查）。
> 约定：
> - 这是访谈。“要点”默认是 Alex Zhang 的话；主持人 swyx、Vibhu 的话一律标“主持人”。
> - 无幻灯片：全页只有 1 张画面（`assets/cover.jpg`），用于 hero 和分享卡片；X 原帖图放 `assets/x/`。
> - 00:00–01:56 是预告剪辑，不进页面；时间带上画成灰色斜纹空段，标“预告”。
> - 访谈里没有的事实标“背景”，正文用来源角标，页脚 `ol.srcs` 列出。
> - “分析”块 = 整理者观点；页面上以小标签“延伸思考”低调区分，页脚说明一次。
> - 拼写：逐字稿 “Jev” = YouTube 简介 “GEV”；“Prime and Select” = Prime Intellect；“Kodak” = Codex（疑）；“Terry Turnstow” = Terence Tao；“Ultra” = Sakana Fugu Ultra。

## Hero

- 标题：Recursive Language Models
- 副题：模型够聪明了，缺的是更好的 harness
- 元信息：Alex Zhang（受访）· swyx、Vibhu Sapra（主持）· Latent Space · 2026-10-02 发布 · 1:43:24
- 小字：Zhang 是 MIT CSAIL 二年级博士生（导师 Omar Khattab、Tim Kraska），RLM 论文第一作者，GPU Mode 社区成员，KernelBench 作者之一[src:alex][src:rlm]。访谈里的 GPT-6 Astra（OpenAI）、Fable（Anthropic）是 2026 年的前沿模型[src:astra][src:fable]。开头约 2 分钟预告剪辑，本页略去。
- 阅读时间：约 14 分钟
- **一句话主旨**：今天的模型被包在大同小异的 harness 里，能力没有用足。
  - harness：Claude Code、Codex、Pi 的逻辑几乎一样；RLM 让模型用代码操作放在环境里的上下文、递归调用自己，换来组合泛化。
  - 规模：OpenAI 用一个 swarm 解开了难题，但 swarm 里大部分 token 可能是白烧的，“收敛”不是免费的。
  - 研究：学术界的优势，是去押工业界不押、初看“很蠢”的注。

## 全景（#contents）

问题：模型已经很聪明，为什么能力还没用足？harness、RLM 和 swarm 各补上哪一块？

| 幕 | 名称 | 一句话 | 章节 |
|---|---|---|---|
| I | 起点 · Kernels & taste | AI 写的 kernel 占满排行榜，专家仍是最强的验证器；博士生该押别人不押的注。 | 00 01 02 |
| II | 模型与 harness · Model vs harness | “语言模型”不必是自回归解码器；主流 harness 都一样，好的设计能让模型组合泛化。 | 03 04 05 |
| III | RLM | 只有代码一种工具、上下文放在环境里、可以调用自己；Prime Agent 等已在实际使用。 | 06 07 |
| IV | Swarm | 砸钱能解难题，但大部分搜索是浪费；让 swarm 收敛靠训练，不是白来的。 | 08 09 10 |
| V | 下一步 · What's next | 能力过剩：可靠地做一个月简单工作是“技能问题”；他的下一步押在 harness 和模型层。 | 11 12 |

右侧目录栏短标签：00 Kernel · 01 专家 · 02 品味 · 03 Jev · 04 Harness · 05 泛化 · 06 RLM · 07 Prime · 08 Swarm · 09 开放 · 10 收敛 · 11 过剩 · 12 下一步 · 总结 · 术语

时间带（规格）：13 段按章节时长画；00:00–01:56 画成灰色斜纹空段，标“预告”。

---

## 00 · Kernel / GPU Mode and AI-written kernels
副标题：分数高，不等于能用
时间：01:56–09:34

**一句话**：GPU Mode 排行榜上几乎全是 AI 写的 kernel，但前十名里只有一位老成员掌舵写出的那份，放进真实系统还稳定。kernel 有验证问题。

### 要点
1. **GPU Mode**：2023 年起的 Discord 社区，原名 CUDA Mode，教人写 GPU kernel；后来加了排行榜。他因为在 Princeton 听了 Tri Dao 讲 FlashAttention 入坑。
2. **KernelBench 的出发点**：kernel 优化的套路不多，常用 kernel 也不多；像 Codeforces 那样攒够题目，就能自动化。研究者很需要这件事：Mamba 要附带 kernel 才能用，不是每个团队都有 Tri Dao。
3. **现在**：“人人都写 kernel”，这个领域几乎饱和。
4. **排行榜的教训**：近期题目的解几乎都是 AI 生成。有位老成员也用 AI，但由他掌舵；他的 kernel 是前十里唯一在端到端系统里稳定的，代码也短得多。KernelBench 发布以来，reward hacking 一直很多。

### 可视化
1. **分数高 ≠ 能用**（`v00`，静态对照两列）：
   - AI 自己跑出的解：排行榜前十 ✓ · 端到端稳定 ✕ · 代码长 · 风险：reward hacking。
   - 专家掌舵的解：排行榜前十 ✓ · 端到端稳定 ✓ · 代码短得多。
   - 底注：“kernel 有验证问题。”

### 讲者补充
- 主持人 Vibhu 说 GPT-5.6 写的 kernel 让 Terra 和 Luna 便宜了 80%。（背景：只有 Luna 降价 80%，Terra 降 20%；kernel 由 GPT-5.6 Sol 经 Codex 改写，连同其他改动让服务成本降约 20%[src:gpt56]）

---

## 01 · 专家 / Human expertise vs brute-force search
副标题：一个洞见，抵一万亿 token
时间：09:34–15:16

**一句话**：懂行的人是最强的验证器。swarm 也许要烧一万亿 token 才摸到的东西，专家一个洞见就能省掉；不能总靠堆算力，效率仍然重要。

### 要点
1. **为什么专家更会用 AI**：他们知道怎样看问题，所以能当很强的 verifier。算力给够，swarm 能把解空间探索充分；但懂行的人可能一句话就“抹掉那一万亿 token 的开销”。
2. **Speed of light**：矩阵乘可以算出理论最快值，前提是数据在哪、传输完美重叠。实际 kernel 往往离它很远，也未必能达到。
3. **单个最快 ≠ 整体最快**：在完整模型里，你可能故意让第一个算子慢一点，把数据留在缓存里给第二个用（kernel fusion / megakernel）。这主要在 memory-bound 时才重要。
4. **该让模型直接生成 megakernel 吗**：他偏向不。没有数据，他还没见过模型能凭空学会一类难题；megakernel 由单个 kernel 组合而成，交给编译器更合适。

### 可视化
1. **两种“快”**（`v01`，静态两行，数值为示意）：
   - 单独测：算子 A 最快、算子 B 最快，各自回显存。
   - 端到端：A 慢一点，结果留在缓存 → B 直接读 → 总时间更短。
   - 标签：“speed of light 取决于数据从哪里出发”。

### 分析（整理者观点，非讲者原话）
- 推断：他把专家定位成“验证器”而不是“写代码的人”；这和第 09 章“从 slop 里挑出好东西”是同一个瓶颈。

---

## 02 · 品味 / Research taste and big bets
副标题：别人说“这不就是 subagents”时
时间：15:16–21:24

**一句话**：学术界最成功的研究，做的是工业界没在看的问题。别人第一反应是“这有什么用”，往往是好信号；不押大注，就去工业实验室。

### 要点
1. **出身**：本科在 Princeton Karthik Narasimhan 组，和 SWE-bench 团队共事；主持人说很多 benchmark 出自这一组。他认为品味靠机会养成。
2. **常见错误**：博士生做“在工业实验室眼里好看”的题，比如热门 benchmark、某个任务的专用 harness，目标被今天的模型框住了。
3. **被低估的论文**：SWE-bench 刚出时没人在乎，大家说“不可能的任务”，直到 Devin 出来才都来爬榜；STaR、Quiet-STaR、chain of thought、ReAct 初读都“很显然”。它们的价值是讲了一个“领域该长什么样”的故事。
4. **结论**：博士生几乎能做任何事，没有官僚流程，这是最大的优势。大注多数会失败，这很正常。

### 可视化
1. **初见反应 → 后来**（`v02`，静态卡片 4 张）：
   - SWE-bench：“不可能的任务，没人在乎” → Devin 之后人人爬榜。
   - STaR / Quiet-STaR · chain of thought · ReAct：“这不是很显然吗” → 改变了领域方向。
   - RLM：“这不就是 subagents 吗？” → 他说：这是好信号。
   - Jev（见 03）：“我们早就有了” → 打开新的设计空间。

### 分析（整理者观点，非讲者原话）
- 换个角度看：这条标准可以自测：如果你的题目已经在某家前沿实验室的路线图上，你的比较优势接近零。

---

## 03 · Jev / Rethinking the language model
副标题：输出空间也是旋钮
时间：21:24–30:59

**一句话**：Jev 的意义不在“又一个分类器”，而在它提出的问题：语言模型一定要是“文本进、文本出”的自回归解码器吗？输出空间和推理延迟可以一起调。

### 要点
1. **是什么**（背景）：Jev 是 TypeSafe AI 在 2026-09-15 发布的模型：开发者先定义输出空间（选项、分数、是否），模型返回带校准概率的判断，不生成自由文本[src:jev]。
2. **同样的批评**：Jev 先被炒热，又被说“我们早就有了，就是个 NLP 分类器”。RLM 也被说“这不是语言模型”。他的回答：语言模型只是在建模语言，不必是 Transformer 解码器。
3. **新问题**：只要二分类，何必付约 400 倍的成本（他的粗算）？looped transformer 同理：只循环一部分？路由到模型不同部分？harness 里做的事能不能搬进模型？
4. **对 RLM 有用**：RLM 和 swarm 最大的瓶颈是慢，连简单子任务也得调笨重的大模型。
5. **新实验室**：如果只复制 OpenAI、Anthropic 的做法，就只能在数据和算力上硬拼，必输。前沿实验室也不会把大量算力押在新路线上，因为旧路线还有效。

### 可视化
1. **两种输出空间**（`v03`，静态左右对照）：
   - 自回归解码器：文本 → 骨干 → 逐个 token 生成文本。标“慢、贵；二分类也要付约 400×”。
   - Jev 式：文本 + 你定义的选项 → 同一类骨干 → 一次给出 {选项, 概率}。标“快：游戏、路由、分类”。

### 讲者补充
- 难的是训练：他不知道 TypeSafe 怎样训练的；有人说是在 Qwen 上后训练，但开源 Qwen 的复现都更差。
- 主持人 swyx 的看法：普通模型被问“你有多大把握”，只会给出最可能的下一个词；Jev 给的是有依据的分类概率，大家还没用好这一点。

---

## 04 · Harness / Why Claude Code, Codex and Pi are the same
副标题：harness 是一段有主见的程序
时间：30:59–38:38

**一句话**：Claude Code、Codex、Pi 的设计选择几乎一样。harness 决定模型怎样“贴合”一个问题，它能做的远不止“给几个工具”：设计得好，不同的任务在模型眼里会变成同一个任务。

### 要点
1. **都一样**：Claude Code、Codex、Pi、Oh My Pi 的设计大体相同；Prime Agent 稍不同，因为它本质上是 RLM。
2. **为什么需要 harness**：用 next-token prediction 直接做难任务很别扭，比如一次调用解决整个代码库的问题。
3. **训练也别扭**：我们现在围绕 harness 的 rollout 训练模型，多 agent 的超长轨迹，做法很 hacky。
4. **实验**（他的博客）：检索任务和聚合任务领域完全不同；普通模型的轨迹差别很大，Pi、Claude Code 也把它们分得太开。RLM 的顶层策略一样，差别交给子 agent。在一个上训练，另一个直接会做；在短任务上训练，能泛化到长 8–30 倍的任务。他强调“没有魔法”。

### 可视化
1. **同一个顶层程序**（`v04`，静态）：
   - 上排芯片：Claude Code · Codex · Pi · Oh My Pi = “工具调用循环 + 整条轨迹当 prompt”；Prime Agent = RLM。
   - 下方两任务对照：检索 / 聚合。普通 harness：两条完全不同的轨迹。RLM：同一个顶层程序，子 agent 做不同的局部活。
   - 底部数字：“短任务训练 → 长 8–30× 的任务”。

### 讲者补充
- 他做的 VideoGameBench 故意用极简 harness。他说现在仍没有模型能有意义地通关这些游戏，见过 Astra 通关 Kirby。（背景：2025 年发布时最好的模型只完成 0.48%[src:vgb]）

---

## 05 · 泛化 / Harnesses as compositional generalizers
副标题：今天的模型是为旧 harness 训练的
时间：38:38–46:20

**一句话**：好的 harness 能让模型用更少的环境泛化到更多任务，而且这条论证能递归成立。但今天的模型是围绕“整条轨迹当 prompt”的 harness 训练的，放进 RLM 还不够好。

### 要点
1. **递归论证**：竞赛编程和 GPU 优化技能相近。harness 可以学会同一个解法：列出候选 → 派子 agent 展开 → 写循环对 verifier 检查、演化。子 agent 解的问题也可能是同一形式。
2. **再往前一步**：RLM 里哪些部件是必需的？能不能训练模型在前向传播里隐式地当一个 RLM？代码不可微，但会有近似。
3. **harness tax**：主持人说通用编码 harness 已被用来做设计和 PPT。他引 Arena 的论文：大多数 harness 选择不重要。（背景：论文结论是成功率只差约 ±2–5%，成本却最多差约 5 倍[src:htax]）
4. **模型越强，差别越小**：把 Astra 放进 OpenCode 也不会乱，剩下的差别主要是成本。但放进 RLM，模型还只是“还行”，因为训练围绕的是 trajectory as a prompt。需要有团队专门在新 harness 上做规模化后训练。

### 可视化
1. **同一个程序，向下递归**（`v05`，静态两棵树）：根节点相同“列候选 → 派子 agent → 对 verifier 检查 / 演化”；左树叶子是竞赛编程的子题，右树叶子是 GPU 优化的子题。

### 讲者补充
- 内部结果（未公开）：Fable 曾是最适合 RLM 的模型，他认为是因为 Anthropic 训练过 dynamic workflows（背景：Claude Code 的功能，用脚本编排大量子 agent[src:workflows]）；Astra 现在也够好。

---

## 06 · RLM 是什么 / RLMs explained
副标题：只有代码这一种工具
时间：46:20–53:57

**一句话**：RLM 是一种 harness 设计：唯一的工具是代码，模型能把自己当函数调用，上下文始终存在代码环境里。它要解决的问题已从“长上下文”变成“组合”。

### 要点
1. **定义**（他说希望原论文里就写了这一版）：唯一的工具是代码；其他工具和“调用自己”都是代码里的函数；上下文存在代码环境的内存里，比如文件系统。
2. **和常规 harness 的差别**：常规 harness 每轮调一个工具，A、B、C 依次来，没有能随时回查的中央上下文。RLM 用代码编排调用，并守着一份中央上下文。swarm 的留言板是同类设计；RLM 的主张是这份共享上下文最好用代码操作，因为模型最会写代码。
3. **局部同分布**（locally in-distribution）：常规 harness 把整条轨迹不断追加进 prompt（trajectory as a prompt），任务一长就出了训练分布，除非你像 Anthropic、OpenAI 那样拿用户轨迹训练。RLM 把任务拆给只看局部问题的子调用：整个任务出了分布，每一次调用仍在分布内。
4. **“都一样”指什么**：Claude Code、Codex、Pi 拆开逻辑几乎一样，RLM 的逻辑很不一样。类比架构：预训练 scaling law 成立，是因为架构选择大体稳定；换掉架构，幂律就会变，harness 也是这样。

### 可视化
1. **两种上下文**（`v06`，可逐步播放；默认显示第 4 轮的结果）：
   - 左 · trajectory as a prompt：一条 prompt 随轮次变长（任务 → 工具结果 → 第 2 轮 → …），颜色由绿渐红，标“越来越出分布”。
   - 右 · RLM：根模型在 REPL 里写代码；`context` 是一个变量（内存 / 磁盘）；`llm_query(片段)` 发出 3 个子调用，每个只看一小段，都标绿“在分布内”。
   - 按钮“下一步 / 重置”。

### 讲者补充
- 他用 Prime Agent 举例：轨迹存在磁盘上，压缩（compaction）之后模型仍能回查原始上下文；所有工具都在 Python 或 Bash REPL 里跑。
- 训练：主持人说 RLM 的尽头是连模型一起训练。他说 MIT 付不起规模化训练，Prime Intellect 这样的公司在做；也许会看到“围绕聪明 harness 训练”时更好的后训练 scaling law（他的猜测）。

### 分析（整理者观点，非讲者原话）
- 换个角度看：RLM 不靠更长的上下文窗口，而是让每次调用看到的东西都短而熟悉，把“长”的问题换成了“组合”的问题。

---

## 07 · Prime Agent / Prime Agent and RLMs in the wild
副标题：把一切外部化，让一切走代码
时间：53:57–1:02:26

**一句话**：Prime Agent 在 Pi 上加了 RLM 抽象：唯一工具是 IPython，harness 能改自己，子 agent 能长期存在并用代码互相通信。Harvey、Laude 等第三方也在用 RLM。

### 要点
1. **来历**：Prime Intellect 先自己发文说 RLM 是未来；经 GPU Mode 的朋友牵线合作。他觉得他们懂论文的本意：不只是解长上下文，而是要更有主见的 harness 设计。
2. **组成**：Pi（极简 harness，他拿它当所有 harness 的参照）+ 只开放 IPython，其他工具是 Python 模块或 Bash 脚本；continual harness：harness 能改自己的 skills、子 agent 和 system prompt；agent 之间用代码通信；persistent subagent 跑完后还能继续追问。
3. **主持人的痛点**：Codex 的子 agent 太短命。诀窍是“外部化到文件系统，一切走代码”，他同意。
4. **分工**：Prime 在训练自己的 RLM 模型；他不参与训练，想把博士时间押在别的大注上。
5. **第三方**：Harvey（与 Baseten）给法律工作后训练 RLM；Laude Institute 的 Headlong 能“持续思考”又控制 token 成本；DSPy 有 RLM 模块；ARC-AGI-3 Kaggle 赛上很多 harness 借了 RLM 抽象。

### 可视化
1. **Prime Agent 拆解**（`v07`，静态分层块）：Pi 核心循环 → 唯一工具：IPython 内核 → continual harness（改 skills · 子 agent · prompt）→ agent 间消息（写在代码里）→ 持久子 agent。
2. 右侧 4 个“在用 RLM 的”芯片：Harvey · Headlong · DSPy · ARC-AGI-3 Kaggle。

### 讲者补充
- （背景）Prime Agent 2026-08-05 发布，Zhang 是作者之一[src:prime]；Harvey 的 RLM harness 让 7 个模型的尽调评分通过率均值从 23% 升到 62%[src:harvey]；Headlong 的作者也包括 Zhang[src:headlong]。

---

## 08 · Swarm / OpenAI swarms and the future of language models
副标题：你问的“模型”，背后可能是一群
时间：1:02:26–1:09:22

**一句话**：OpenAI 解 Navier–Stokes 用的是共享上下文的 agent swarm。harness 细节不重要，重要的是怎样组合 agent；将来你问的“语言模型”，背后可能是一整个看不见的 swarm。

### 要点
1. **是不是 RLM**：他猜不是，但精神相近：一群 agent 共享文件系统。Astra 级模型拿到对的信息就够聪明，难的是找到那些信息：长时间搜索，也许加上研究员的方向引导（这点他不确定）。
2. **将来**：前端保留 Claude Code、Codex 那种用户爱看的流，背后是复杂的 swarm；用户看不到，也不想看。他认为这是相对稳的押注。
3. **成本**：主持人说约 10,000 个 agent、88 小时、1,300 亿 output token，按公开价约 4,000 万美元。他说“比我想的少”。（背景：4,000 万是主持人的估算；OpenAI 只说“数百万美元”；证明针对的是带外力的版本，署名也有争议[src:ns]）
4. **浪费**：主持人举 Cursor 2 月的设计像软件团队组织图，汇总是瓶颈。他用压缩和 RLM 作类比：RLM 能解更难的题，但多数时候选压缩，因为便宜又快。他“相当确定” swarm 里 95% 的探索没用，只是在烧 token。
5. **开放问题**：什么问题该用 swarm？界线画在哪？agent 能不能自己决定？

### 可视化
1. **那次 swarm 的账单**（`v08a`，静态数字块）：约 10,000 agents · 88 小时 · 1,300 亿 output token · ≈4,000 万美元（主持人估算）。
2. **两种组织**（`v08b`，静态对照）：组织图式（规划者 → 子规划者 → worker，汇总是瓶颈，背景：Cursor[src:cursor]）vs 共享黑板式（每个 agent 各干各的，读写同一份上下文）。

---

## 09 · 开放 / Open-endedness and Sakana AI
副标题：难的是从 slop 里挑
时间：1:09:22–1:17:48

**一句话**：开放式研究和未解的数学题用的是同一套办法：演化搜索、放出 swarm。真正的难点在最后一步：从一大堆 slop 里挑出值得留的东西。

### 要点
1. **方法相同**：演化搜索很像放出一群 agent 等它们碰出好东西（AlphaEvolve 一类）。没有明确目标时，他还看不清价值；实际做法仍要往某些方向推，像 OpenAI 做 Navier–Stokes 那样。
2. **瓶颈在挑选**：他读博前在 Sakana 待过一个夏天，那里最大的难题是“最后怎么选”。Sakana 的 Fugu 就受这个想法启发。也许“高吞吐生成 + 让 agent 去筛”就够了。
3. **主持人的版本**：基础科学 vs 应用科学；“如果连 prompt 都没有呢？”留在学校，就是为了做开放式研究。
4. **Sakana**：更像博士实验室，研究常被看成“怪”，他喜欢这一点；日本市场的生意方式也不同。

### 可视化
1. **开放式研究的漏斗**（`v09`，静态）：放出 swarm / 演化搜索 → 海量产出（slop）→ **筛选（瓶颈）** → 少数好东西。

### 讲者补充
- （背景）Fugu 是一个训练来调用其他模型的模型，比普通路由器多了委派和核验[src:fugu]；主持人现场查到 Sakana 的日语模型是 Kimi 微调，即 Namazu（基于 Kimi K2.6）[src:namazu]。

---

## 10 · 收敛 / Kimi vs OpenAI agent swarms
副标题：收敛不是白送的
时间：1:17:48–1:22:02

**一句话**：swarm 能朝目标收敛，不是模型够聪明就白送的，要专门训练。在他看来 OpenAI 做到了；Kimi 的 swarm 和 Claude Code 的 dynamic workflows 还没有。

### 要点
1. **OpenAI**：“显然是对的做法”。没有聪明的 harness 设计，什么都不白来；他把 Hugging Face 事件解读为 OpenAI 在训练一个像 swarm 那样工作的系统。
2. **Kimi Agent Swarm**：有意思，但他不知道能不能解新问题（主持人：“它帮你做表格”）。
3. **Dynamic workflows**：他觉得“有点失败”：太贵，用得少，他试过，行为不像是朝着目标走。
4. **核心**：“我们把 swarm 收敛到一个答案当成理所当然。”

### 可视化
1. **他对四种多 agent 方案的判断**（`v10`，静态表）：

| 方案 | 他的判断 | 理由 |
|---|---|---|
| OpenAI swarm | 对的做法 | 训练过，能花钱解未解问题 |
| Kimi Agent Swarm | 有意思，存疑 | 不确定能解新问题 |
| Claude Code dynamic workflows | “有点失败” | 太贵，不朝目标收敛 |
| Gemini 的 IMO harness | 当时很聪明 | 但他听说 GDM 太官僚 |

### 讲者补充
- （背景）Hugging Face 事件：2026 年 7 月，OpenAI 内部网络能力测评中的模型逃出沙箱，攻入 Hugging Face 的部分生产设施；OpenAI 的报告把“agent 之间未经授权的通信”列为原因之一[src:hf]。
- 他说 Antigravity 他不认识谁在用；主持人说 Meta 也被骂过，后来恢复了。

---

## 11 · 过剩 / Capability overhang and speculative tool calling
副标题：一个 18 岁实习生都能做的事
时间：1:22:02–1:30:15

**一句话**：能力过剩是真的：让前沿模型像一个 18 岁高中生那样，连续一个月可靠地做一份简单工作，今天还做不到。他认为这是“技能问题”，一个好 harness 就能解决。

### 要点
1. **Speculative PTC**（他的博客）：模型还在写代码时，就提前发出能静态分析出来的工具调用，不必等。他说这“几乎显而易见”，凡是程序化调用都该用。主持人：函数式语言更容易这样流水线。
2. **Mismanaged geniuses**：主持人概括为“模型其实能做更多，是技能问题”，他同意。
3. **该有人去解**：长时间、简单、可靠的任务。像跟实习生说话那样交代小事；不必为找论文专门造 agent，一个通用 harness 插进去就能用。也许学术界该做，不需要前沿实验室。
4. **能力参差能迁移吗**：模型数学和代码特别强。IMO 金牌选手换个领域也能上手，模型呢？思想实验：从 Astra 里去掉所有 GPU 编程数据，它还能在上下文里学会优化 kernel 吗？主持人说这就是 continual learning，他说“最好的例子”。

### 可视化
1. **顺序 vs 投机**（`v11`，静态甘特对照，时长为示意）：
   - 顺序：[写代码] → [工具 A] → [工具 B] → 完成。
   - 投机：[写代码……] 期间 A、B 已经启动 → 更早完成。

---

## 12 · 下一步 / Neuralese, future research and AI for science
副标题：十几个想法，多数是坏的
时间：1:30:15–1:43:24

**一句话**：模型的“母语”大概是英语加 Python，因为能力反映训练数据。他从 GPU 走到 harness，是因为大部分创新还没发生；选题靠很多想法、快速放弃，确信时放下一切。

### 要点
1. **Neuralese**：他押英语和 Python 的混合，不买“二进制”。主持人谈语言塑造思维、《降临》里像 diffusion 那样一次说出整句；他反问：代码、时间这类推理不是天生自回归吗？
2. **为什么离开 GPU**：kernel 是手段，自动化它是为了探索想法时不被系统问题卡住。做 harness 很不舒服：模糊，算力有限难验证；但创新在这里。他也对模型层有兴趣，“点到为止”。
3. **怎样找他合作**：别写“我很喜欢 RLM，想一起做”；他喜欢有强观点、能说清为什么的人。
4. **节奏**：手上 10–15 个想法，大多是坏的；跑步、打网球时想；确信后放下一切，到能跑实验就轻松了。
5. **科学**：反馈环很长，要判断半年后会不会被新模型直接解决；ARC-AGI-3 不到一年就饱和。主持人认为下一个前沿是科学。

### 可视化
1. **他的选题循环**（`v12`，静态环）：10–15 个想法 → 大多是坏的（跑步、打网球时想）→ 花一点时间看看 → 确信 → 放下一切 → 能跑实验 → “轻松滑行”。

### 讲者补充
- 结尾主持人说数学家（Terence Tao）主张“别用 AI”。（背景：Tao 联署的公开信批评 AI 公司拿著名难题当 benchmark，并未主张不用 AI[src:tao]）

---

## 总结（#summary）

这场访谈的 6 个要点（读后归纳）：
1. **能力没用足**：模型够聪明，瓶颈在怎样组织它；可靠地做长而简单的工作是“技能问题”。（04 11）
2. **harness 大同小异**：主流 harness 逻辑相同；换一种抽象，scaling 曲线才会变。（04 06）
3. **上下文放进环境**：用代码组合子调用，让每次调用都在分布内，换来组合泛化。（05 06 07）
4. **swarm 不是白来的**：砸钱能解难题，但大部分搜索是浪费，收敛要靠训练。（08 10）
5. **专家仍是验证器**：一个洞见可以抵掉海量 token；从 slop 里挑出好东西是瓶颈。（00 01 09）
6. **学术界押怪注**：做工业界不做、初看“很蠢”的题；输出空间、架构、harness 都还能重想。（02 03 12）

Zhang 的收尾：论文主要是实证结果，“想法本身很简单”。（1:43:03）

## 术语（#glossary，默认折叠，不计入阅读时间）

| 术语 | 中文解释 | 例子 |
|---|---|---|
| Harness | 包住模型、让它调用工具和执行任务的外层程序 | 04 |
| RLM | Recursive Language Model：唯一工具是代码、能递归调用自己、上下文存在环境里的 harness 设计 | 06 |
| Trajectory as a prompt | 把整条轨迹不断追加进 prompt 的常规做法 | 05 06 |
| Locally in-distribution | 局部同分布：整个任务没见过，但每次调用都是见过的形式 | 06 |
| Context offloading | 把上下文放到模型外（变量、文件），需要时再读 | 06 |
| Compaction | 压缩：上下文太长时把旧内容总结掉 | 06 08 |
| Subagent / persistent subagent | 子 agent；持久子 agent 跑完后还能继续追问 | 07 |
| Programmatic tool calling (PTC) | 用写代码的方式调用工具，而不是一轮一个 | 11 |
| Agent swarm | 成千上万个 agent 协同解一个问题 | 08 10 |
| GPU kernel | 在 GPU 上执行一个算子的底层程序 | 00 |
| Speed of light | 按硬件极限算出的理论最快速度 | 01 |
| Kernel fusion / megakernel | 把多个算子合成一个 kernel，减少数据进出显存 | 01 |
| Reward hacking | 奖励投机：钻打分规则的空子拿高分 | 00 |
| Verifier | 验证器：判断解对不对的程序或人 | 01 05 |
| Output space | 模型能输出的东西的集合（自由文本或固定选项） | 03 |
| Looped transformer | 把同一组层循环使用的 Transformer | 03 |
| Calibration | 校准：模型说的把握和真实正确率一致 | 03 |
| Open-endedness | 开放式研究：没有固定目标，让系统自己找有趣的问题 | 09 |
| Capability overhang | 能力过剩：模型已有的能力远多于实际用上的 | 11 |
| Jagged intelligence | 能力参差：有的事极强，有的事很弱 | 11 |
| Continual learning | 持续学习：模型在使用中不断学会新东西 | 11 |
| Neuralese | 设想中模型自己的“内部语言” | 12 |
| Neo lab | 新创办的 AI 实验室 | 03 |

## 来源（页脚 `ol.srcs`，正文角标指向这里）

- alex：Alex L. Zhang 个人主页 https://alexzhang13.github.io/
- rlm：Zhang, Kraska, Khattab · Recursive Language Models · arXiv 2512.24601 https://arxiv.org/abs/2512.24601
- astra：Latent Space AINews · GPT-6 Astra（2026-09-04）https://www.latent.space/p/ainews-gpt-6-astra-openais-biggest
- fable：Anthropic · Claude Fable 5 and Mythos 5（2026-06-09）https://www.anthropic.com/news/claude-fable-5-mythos-5
- gpt56：OpenAI · Advancing the price-performance frontier with GPT-5.6（2026-07-30）https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/
- jev：TypeSafe AI · Introducing System One models and Jev（2026-09-15）https://typesafe.ai/blog/introducing-system-one-models-and-jev
- vgb：Zhang et al. · VideoGameBench · arXiv 2505.18134 https://arxiv.org/abs/2505.18134
- htax：Arena · HarnessTax（2026-09-16）https://arena.ai/blog/coding-agents-harness-tax
- workflows：Claude · Introducing dynamic workflows in Claude Code（2026-05-28）https://claude.com/blog/introducing-dynamic-workflows-in-claude-code
- prime：Prime Intellect · Prime Agent（2026-08-05）https://primeintellect.ai/blog/prime-agent
- harvey：Harvey · Post-Training RLM Agents for End-to-End M&A Diligence（2026-09-08）https://www.harvey.ai/blog/post-training-rlm-agents-for-m-and-a-diligence
- headlong：Laude Institute · Headlong（2026-08-24）https://www.laude.org/updates/headlong-a-microharness-for-persistent-agents
- ns：CoinDesk · OpenAI says 10,000 AI agents solved a $1M math problem（2026-09-09）https://www.coindesk.com/tech/2026/09/09/openai-says-10-000-ai-agents-solved-a-usd1-million-math-problem-now-mathematicians-are-fighting
- cursor：Cursor · Towards self-driving codebases（2026-02-05）https://cursor.com/blog/self-driving-codebases
- fugu：Sakana AI · Fugu https://sakana.ai/fugu-release/
- namazu：Sakana AI · Namazu https://sakana.ai/namazu/
- hf：OpenAI · The Hugging Face incident and the road ahead（报告 2026-08-26）https://openai.com/index/hugging-face-incident-and-the-road-ahead/
- tao：Scientific American · 25 Fields medalists decry the AI invasion of their discipline https://www.scientificamerican.com/article/25-winners-of-maths-nobel-prize-decry-the-ai-invasion-of-their-discipline/

## 第二轮（2026-10-18，建页时的改动；页面以 build/zh_body.html 为准；05 harness tax 改为 Alex 自己引用，08 “不确定”指另一种组织方式）
- 事实核查 26 条全部落实：OpenAI 的 Navier–Stokes 结果标“宣称、有争议”；“共享上下文 swarm”“95% 浪费”标为 Alex 的判断和估计（对 OpenAI 那次他不确定）；Qwen 一句改为“直接用开源 Qwen 都比它差”；HF 事件改为“四种失准模式之一”；Kimi swarm 改为“他不确定”；v03、v06、v11 标“示意”；v04 改“Prime Agent ≈ RLM（仍保留压缩循环）”；v07 加 system prompt 背景注；Fugu、能力过剩、scaling 类比、选题节奏按原话补保留语。
- 预算：首版 18.3 分钟，删到 15.0 分钟。各章要点压到 3–4 条；删 01、02 的延伸思考，删 12 章 Tao 补充（来源 20 一并删除，来源共 19 条）；总结 6 条各压成一句。
- 07 副标题改为“唯一的工具是 IPython”（“外部化一切”是主持人的话）。
- v11 甘特图改为三条泳道（写代码 / 工具 A / 工具 B）。
