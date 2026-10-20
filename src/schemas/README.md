# 运行时校验（预留）

目前不引入 Zod。独立 `src/api/beta.js` 的邮箱、来源、速率和请求体校验，以及 `src/services/server/feishu-careers.ts` 的招聘字段解析保持原位。今后仅将真正跨模块复用的运行时校验放入本目录；TypeScript 类型不是运行时校验，领域私有校验仍就近维护。
