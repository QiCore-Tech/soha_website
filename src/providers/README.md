# 根级 Provider（预留）

目前语言使用 `src/stores/locale-store.ts` + React 原生订阅，缓存 HTML 依赖 DOM 协议；无需空壳 Context。仅在真实的跨路由 Context 需求出现时，在此组合 Provider 并由 `src/app/layout.tsx` 引入。业务私有 Provider 放入所属 feature，禁止将服务端凭据引入客户端 Provider。
