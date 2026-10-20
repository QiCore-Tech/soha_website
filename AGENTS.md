# 项目协作规范

## 架构与目录

这是 Next.js 15 / React 19 静态导出网站。源码、测试和开发脚本统一放在 `src/`；`@/*` 指向 `src/*`，更精确的 `@/i18n/*` 指向根级 `i18n/*`。首页入口是 `src/app/(qicore)/layout.tsx` 组装 `HomeScreens`（`home-screens.tsx`，Hero / GenPI / 产品三屏纵向展示）与 `QiCoreRouteShell`，不是独立的 `src/app/page.tsx`。

| 目录 | 职责与示例 |
| --- | --- |
| `src/app/` | 路由薄组装、metadata、layout、全局样式入口；保留现有路由 CSS Modules |
| `src/components/` | 共享导航、MarketingPage、缓存路由 shell；`ui/` 是 shadcn 基础组件 |
| `src/features/home/` | 首页三屏纵向展示（`home-screens.tsx`）；旧 Swiper 轮播与品牌区块文件保留但未挂载 |
| `src/features/careers/` | 招聘导航、列表、领域类型与本地样例 |
| `src/features/oyscat/` | 产品/Beta 组件、领域 CSS、图片预览与抵达效果 |
| `src/features/news/` | 新闻专属交互 |
| `src/features/legacy-voxel/` | 保留旧首页、Three 场景、体素类型/调色板/算法，不删除旧功能 |
| `src/services/` | 外部系统访问；`server/feishu-careers.ts` 仅服务端/构建期 |
| `src/stores/` | 跨组件语言状态，React 原生外部订阅，不新增 Zustand |
| `src/hooks/` | 通用 `use-locale`、性能分级；业务专属 hook 放 feature |
| `src/utils/` | 无 React、DOM、网络依赖的纯函数，如 `math.ts` 的 clamp |
| `src/lib/` | 第三方适配、shadcn `utils.ts`、HTML 缓存导航基础设施 |
| `src/types/` | 跨模块类型契约，如 Locale/LocalizedText；领域类型就近维护 |
| `src/constants/` | 跨业务不变量和存储键，不堆放领域内容或翻译 |
| `src/configs/` | 站点配置；框架/工具要求的根配置不搬动 |
| `src/providers/` | 根级 Context 组合预留，见中文 README；没有需求不建空壳 Provider |
| `src/schemas/` | 跨模块运行时校验预留，见中文 README；当前不引入 Zod |
| `i18n/` | zh/en 配置、统一 `messages.json` 文案库、首屏初始化和 DOM 属性同步 |
| `src/api/` | 独立 Vercel API 业务实现，不搬到 `src/app/api/` |
| `api/` | 唯一部署兼容例外：Vercel `api/*.js` 自动发现所需薄入口，仅 require 对应 src/api 实现 |
| `ops/` | Python 运维服务及部署工具，本次不重构 |
| `public/` | 静态媒体、字体、旧 JS 等公开资源，禁止凭据 |
| `src/scripts/` | 只读静态预览等开发工具 |
| `src/tests/` | Node 内置单元测试、Playwright 浏览器回归、性能脚本 |

依赖方向：app 组装 features 和共享组件；feature 可使用 src/components/ui、hooks、stores、i18n、纯工具；基础 src/types/constants/utils 不反向依赖业务。共享站点导航可显式引用产品品牌展示组件，但不得创建混合 server/client 的聚合导出。服务端模块不可被 `"use client"` 组件导入。不要形成循环依赖或为归类过度拆分；`index.html`、legacy JS 与旧场景在确认用途前保留。

根仅保留 `src/`、`i18n/`、`public/`、`ops/`、`node_modules/`、`.next/`、`.next-preview/`、`out/` 及上述 Vercel 薄入口 `api/`；隐藏版本控制/工具目录不迁。根工具配置、package 文件、AGENTS 与既有根静态文件保留。Tailwind PostCSS 扫描基目录为 `src/`；根 i18n 只有逻辑和文案，无 Tailwind 类。

## 中英文与缓存 DOM

默认中文 `zh`，支持英文 `en`；持久化键 `qicore-locale`、`html[data-locale]` 和双语 `data-lang` 节点是现有协议，不能替换成 Context-only 渲染。通过 `useLocale` / `locale-store` 切换，存储被禁用仍可操作。`html.lang` 同步为 `zh-CN` 或 `en`。

`i18n/init-script.ts` 在 hydration 前初始化，根 layout 同一脚本保留路由及产品转场恢复。缓存 HTML 不一定重新挂载 React；切换语言及面板激活时必须同步标题和必要属性。需要缓存的属性使用 `data-aria-label-zh/en`、`data-alt-zh/en`、`data-placeholder-zh/en`、`data-title-zh/en`。全部网站固定文案集中维护在 `i18n/messages.json`，包含页面、组件、本地招聘样例、动态提示、无障碍标签和 CSS 生成文字；页面通过 `i18n/messages.ts` 引用，动态参数使用 `formatMessage`。飞书返回的岗位双语内容仍由飞书维护。不要同时重构 HTML 快照、事件委托与路由缓存机制。

## 样式、交互与三端

新增/实质改写 UI 默认 Tailwind 4；保留现有 globals 和必要 CSS Modules，不一次性重写。复用 `src/components/ui/button.tsx`、`components.json` 和 `src/lib/utils.ts`；shadcn 使用 **Base UI** API，不使用 Radix 的 `asChild` 假设。首页箭头复用 Button，触摸区域至少约 44px。

Swiper 负责轮播位移、触摸、键盘与自动播放。GSAP 客户端按需加载，仅动画首页活动 slide 文案；不碰 Swiper wrapper/slide 的 transform，也不竞争图片 zoom。动画须限定作用域、切换/卸载 revert、处理异步卸载和加载失败，并尊重 `prefers-reduced-motion`。静态内容不能依赖动画成功才可见。

Mobile-first、内容驱动断点；覆盖 Web 键盘/鼠标、iPad 触摸/横竖屏/分屏、iPhone 小屏/横屏/动态视口和安全区。验证中英文长文案、菜单、表单、媒体、无横向溢出、焦点及 aria 标签。参考视口 390×844、844×390、768×1024、1024×768、1440×900；浏览器仿真不等于真机。

## 全部直接依赖

以 `package.json` 为准；仅真实变更依赖时更新 lockfile，不删除尚未确认用途的库。

### 运行时依赖

- `next`：App Router、静态导出和构建，当前使用。
- `react`：组件、hooks、原生 `useSyncExternalStore`，当前使用。
- `react-dom`：DOM 渲染与产品图片 Portal，当前使用。
- `@base-ui/react`：shadcn Button 的无样式交互基础，当前使用。
- `class-variance-authority`：Button 变体组合，当前使用。
- `cn`：class 合并；`src/lib/utils.ts` 提供基础设施入口，现有 Button 也直接使用。
- `lucide-react`：首页矢量图标，当前使用。
- `gsap`：首页活动文案的按需入场动画，当前使用。
- `swiper`：首页轮播、触摸、键盘、无障碍与自动播放，当前使用。
- `xgplayer`：首页工作台视频的西瓜播放器；客户端按需加载，复用原生 video，播放受滚动完成进度门控。
- `three`：旧体素场景的 3D 基础；不在新轮播加载，保留旧功能。
- `@react-three/fiber`：旧体素场景 React renderer，保留。
- `@react-three/drei`：旧场景 AdaptiveDpr/AdaptiveEvents，保留。

### 开发依赖

- `tailwindcss`：Tailwind 4 样式编译，当前使用。
- `@tailwindcss/postcss`：Tailwind 4 的 PostCSS 插件，当前使用。
- `postcss`：CSS 构建处理，当前使用。
- `shadcn`：组件生成工具与全局 `shadcn/tailwind.css` 来源；不作为业务状态库。
- `typescript`：严格类型检查；招聘/语言测试也用 transpileModule。
- `@types/node`：Node 服务端、脚本与构建类型。
- `@types/react`：React 组件/hooks 类型。
- `@types/react-dom`：React DOM/Portal 类型。
- `@types/three`：保留的旧 3D 场景类型。
- `playwright`：Chromium/WebKit 浏览器驱动，使用 `node:test` 而非 `@playwright/test`。
- `pixelmatch`：截图像素差异测试工具；当前测试未引用，保留既有依赖待确认，不宣称已做像素回归。
- `pngjs`：PNG 解码/像素处理工具；当前测试未引用，保留既有依赖待确认。

`node:test`、`node:assert`、HTTP/文件系统工具是 Node 内置模块，不是 npm 依赖。不要为整理再加入国际化、状态管理或动画包装库。

## 开发与验证命令

在仓库根执行，安装使用 `npm install`：

**验证由用户自行负责**：用户会自己检查和验证。改完代码后不要自动运行任何验证命令（包括类型检查、Node 单测、构建、Playwright/浏览器测试、性能测试）。仅当用户明确要求时才执行对应命令，不要主动“顺手跑一下”。若未获得明确要求，不得声称已通过任何验证，只需如实说明改动内容。

- `npm run dev`：Next 开发服务器。
- `npx tsc --noEmit --incremental false`：类型检查。
- `node --test src/tests/beta-intake.test.mjs src/tests/careers-local-sample.test.mjs src/tests/locale.test.mjs`：API、招聘隔离及语言逻辑单测，外部服务 mock。
- `npm run build`：静态导出 `out/`；保持生产飞书配置校验。
- `npm run start` / `npm run preview`：只读预览已有 `out/`，不是不适配 export 的 `next start`。
- `npm run test:preview`：静态服务器路径、安全和方法测试。
- `npm run test:e2e` / `npm test`：开发模式 Chromium 回归；与导出产物测试不同。
- `npm run test:e2e:static`：明确使用已有 out 的全量浏览器测试，不能误复用 dev。
- `npm run test:e2e:smoke`：静态产物 Chromium/WebKit 核心 smoke。
- `npm run test:e2e:ci`：构建、预览单测、静态 E2E。
- `npm run test:perf`：现有性能脚本，非每次整理的强制验证。

以上命令均由用户按需自行执行；代理不得主动自动触发。

浏览器/环境变量详细约定见 `src/tests/e2e/README.md`。浏览器二进制不可用必须明确报告，不得宣称完成真机三端实测。所有表单测试拦截响应，不真实写入飞书或其他外部系统。

## 安全、部署与协作

`next.config.mjs` 为静态导出，不引入运行时服务端能力；API 部署仍独立。飞书密钥只供 `src/services/server/` 或 API 读取，禁止 `NEXT_PUBLIC_` 暴露、输出日志、提交 `.env`、Vercel 状态或密钥。招聘本地样例仅未配置的本地 development 可用，生产拒绝缺失真实配置的既有规则不可放宽。canonical 域名始终为 `https://qicore.ai`。

禁止手改 `.next/`、`out/`、`.artifacts/` 等生成目录。先看 `git status` / `git diff`，保护用户未提交与未跟踪改动。沿用严格 TypeScript、两空格、双引号、分号、组件 PascalCase、hook 文件 `use-*` 和具名导出；现有生成组件可保持原风格。不自动提交推送或创建 worktree。验证一律由用户自行完成，代理不得自动运行任何检查命令，用户明确要求时才验证，并如实说明实际执行了哪些命令。用户要求提交时保持聚焦、简洁祈使句；PR 说明变更、真实验证、交互截图和未验证项。
