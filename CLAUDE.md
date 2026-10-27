# atlas.haoli-agi.com

个人长期站点（“星图”）：收录高价值讲座与文章的学习页。讲座页由 constellate skill 生成。

## 结构
- `public/`：线上发布的全部静态文件，只有这里会上线。
  - `index.html` 首页，`privacy.html` 隐私说明，`404.html`
  - 网站图标 `favicon.ico`（16/32/48）和 `apple-touch-icon.png`（180）：由 `python3 -I sources/favicon/build_icons.py` 生成，改图标只改这个脚本再重跑。浏览器会自动请求这两个根路径，所以页面 `<head>` 里不放图标 `<link>`，新页面也不用加。
  - 不让搜索引擎和爬虫收录：`robots.txt` 只放行 X 的 `Twitterbot`（生成分享卡片），其余全站 `Disallow: /`；`_headers` 给所有静态响应加 `X-Robots-Tag: noindex`。因此不维护 `sitemap.xml`；重新开放时三处一起改。
  - `assets/atlas.js` 统计脚本（所有页面共用）；`.assetsignore` 挡住 `.DS_Store` 这类杂文件，不让它们被上传
  - `talks/<slug>/`（`<slug>` 形如 `2026-10-cs146s-always-on-agents`，年月取讲座日期；它也是统计 id `talks/<slug>`，上线后不改）：`index.html`（英文，默认）+ `zh.html`（中文）+ `NOTICE.txt` + `assets/hermes/filler-bg0.webp`，有幻灯片时加 `slides/`；访谈类（无幻灯片）用 `assets/cover.jpg`（视频画面，也是分享卡片）和 `assets/x/`（X 原帖截图）
- `sources/talks/<slug>/`：生成页面用的工作文件，不发布。`transcript.md`、`aligned.md`、`content_full.md`、`asr/`、`backup/` 是逐字稿或接近逐字稿，不进 git（仓库要公开）。无幻灯片的讲座把章节边界写成 `chapters.json`，不要叫 `slides.json`：`bun run check` 见到 `slides.json` 会把它当幻灯片清单检查。
- `src/worker/`：Cloudflare Worker。`/api/e` 接收统计，`/admin` 统计后台（Cloudflare Access 保护），其余路径直接走静态文件。
- `migrations/`：D1 表结构。`test/`：vitest（@cloudflare/vitest-pool-workers）。
- `scripts/check_page.py` 检查页面结构（真身在 constellate skill，发布新讲座时同步过来）；`scripts/add_atlas_hooks.py` 给页面加统计脚本和隐私小字（已加过时只重设 `data-page` 和 `data-v`）；`scripts/ship.sh` 实现 `bun run check` / `bun run ship`。

## 命令
- 安装 `bun install`；测试 `bun run test`；类型检查 `bun run typecheck`
- wrangler 一律用项目里的 `./node_modules/.bin/wrangler`。`bunx wrangler` 会调到全局旧版，它的运行时不支持本项目的兼容日期。
- `compatibility_date` 不能晚于本地 wrangler 运行时支持的日期（现为 2026-05-22）；升级 wrangler 后才能调。
- 本地预览：先 `./node_modules/.bin/wrangler d1 migrations apply atlas --local`，再 `bun run dev`。本地后台 `http://127.0.0.1:8787/admin`（`.dev.vars` 里的 `DEV_ADMIN_OPEN=1` 只对 localhost 生效）。`bun run dev` 带 `--local-upstream 127.0.0.1:8787`；不带时 wrangler 会把主机名改写成正式域名，本地后台会返回 503。改了或新增 `public/` 里的文件后要重启 dev 服务，它不会自动读到。
- 提交直接进 `main`（单人项目）。远端 `origin` 是公开仓库 `github.com/2939427213a-boop/atlas`：只推 `main`（`git push origin main`），不推标签。本地标签 `archive/pre-public` 是带逐字稿的旧历史，永远不推。提交邮箱用仓库级的 GitHub noreply 地址。
- 部署前检查：`bun run check`（所有讲座页的 `check_page.py`、首页是否链到每一篇、类型检查、测试；无副作用）。
- 部署：先提交，再问用户（用 `git log --oneline live..HEAD` 说明这次会带上哪些提交），同意后 `bun run ship`：工作区不干净就拒绝 → check → `wrangler deploy` → git 标签 `live` 移到当前提交 → 线上冒烟检查（边缘缓存约半分钟才更新，所以带 60 秒重试）。冒烟全是 `ok` 后同步 GitHub：确认 `git ls-files | grep -E 'transcript|aligned\.md|content_full|/asr/|/backup/'` 没有输出，再 `git push origin main`（部署时的同意已包含这一步）。只复查线上：`bash scripts/ship.sh smoke`。回滚 `./node_modules/.bin/wrangler rollback`。表结构变了才另跑 `wrangler d1 migrations apply atlas --remote`，同样先问。
- 改已上线的页面：两种语言一起改，再用 `python3 -I scripts/add_atlas_hooks.py <page> talks/<slug> <当天日期>` 把 `data-v` 更新为当天（`<slug>` 不变），后台就能分开新旧版本。改首页同样要更新：`add_atlas_hooks.py public/index.html home <当天日期>`。小改只动 HTML；有 `build/` 的讲座把同样的改动写进 `build/` 的正文，否则下次重新构建会丢掉。`content.md` 只是写作骨架（主旨、5 幕、每章一句话和证据时间戳），不是正文来源；`2026-10-a16z-openai-computer-use` 及更早讲座的 `content.md` 是全文底稿，可能已过时。

## 隐私不变量（改统计代码前先读）
- 不存原始 IP。访客去重用 `sha256(当天随机盐 | IP | UA)` 前 16 位，盐次日删除。
- 不用 cookie，不录屏，不记输入内容（键盘只记导航键名）。
- 欧盟/EEA、英国、瑞士访客，以及发送 GPC 或 DNT 的访客，不存 localStorage 访客 ID（由 `/api/e` 首次响应 `{p:0}` 决定）。
- `public/privacy.html` 和页脚小字必须和实际记录的字段一致；新增字段时同步修改。
- 原始事件保留 `RETENTION_DAYS`（730 天），每日 cron 清理。

## 线上与账号
- Cloudflare 账号 `6eea0c0db7f7abff29599f723cf4c6c0`。DNS 在 Cloudflare，不在 Spaceship。域名靠 `wrangler.jsonc` 的 custom_domain 绑定，部署时自动建 DNS 记录和证书。
- D1 免费额度与 `investment-cabbage`（`~/Desktop/投资网页`）共用。`DAILY_BEACON_CAP` 是保护阀；超额会让两个项目的 D1 查询一起失败。
- `/admin` 由 Cloudflare Access 应用 `atlas-admin` 保护（团队 `orange-smoke-772b`，复用投资网页的“仅站长邮箱”策略 `investment-owner-only`，会话 24 小时）。Worker 也校验 Access JWT，并只放行 JWT 里的邮箱等于 secret `OWNER_EMAIL` 的人（第二道锁：这条 Access 策略和投资网页共用，放宽它不会放开本站后台）；`ACCESS_AUD` 或 `OWNER_EMAIL` 为空时 `/admin` 返回 503，邮箱不符返回 403。在 `/admin` 点“标记”后，这个浏览器打开本站页面不再上报统计（localStorage `atlas.self`）。Access 设置在 Zero Trust 控制台修改（`dash.cloudflare.com/<账号>/one/access-controls/apps`）。

## 版权与署名
- 不发布讲座逐字稿。幻灯片截图、视频画面注明版权归原作者。X 原帖截图标作者和日期、链接原帖。
- 讲座/访谈里没有的背景事实（人物身份、外部数据）标“背景 / Context”，正文用来源角标，页脚 `ol.srcs` 列出公开来源；主持人的话标“主持人 / Host”。
- 每篇讲座页：最上方一行放“← Atlas”回首页和来源栏（链接用用户给的；没有讲者原帖时，文字写明链接是什么）；页脚放讲者署名 + 同一个来源链接、给讲者和版权方的联系句（X @steamedbun1111）、隐私小字；视觉设计致谢 Nous Research（非官方、无关联）；字体只用 Google Fonts 的 OFL 字体（首页署名用 Dancing Script）。
- 新增页面时同步更新首页：`#latest` 换成新的一篇，`#index` 按日期倒序保留全部条目并更新条目数。首页的阅读时长取中英两页 `reading_time.py` 结果中较大的那个，向上取整。

## 首页与取向（用户定的）
- 首页只用英文 ATLAS 字标（字号上限 200px），不放“星图”大字块。署名只用英文 “Haoli”（Dancing Script，名字后一个陶土色圆点），放在简介下方，后接 X 链接。网站图标用“星云星图”：深空底、更深一档的绿色星云、4 颗亮星连成小星座。
- 统计不弹 cookie 窗，只靠页脚小字和 `/privacy`；行为数据尽量多记，但不存身份。
