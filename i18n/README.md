# 文案维护

网站固定文案统一维护在 `messages.json`，按页面和组件分组。每条文案都包含 `zh` 和 `en`，品牌名、邮箱等不需要翻译的文字可以使用相同值。

```json
{
  "runtime": {
    "roleCount": {
      "zh": "{count} 个职位",
      "en": "{count} roles"
    }
  }
}
```

页面通过 `@/i18n/messages` 导入 `messages`。可见文字使用 `BilingualText` 或既有 `data-lang="zh/en"` 节点，以兼容缓存 HTML 的语言切换。动态参数使用 `formatMessage`，不要在组件中拼接翻译片段。

图片说明、按钮标签、提示文字使用对应的 `data-alt-zh/en`、`data-aria-label-zh/en`、`data-title-zh/en`、`data-placeholder-zh/en` 属性；`dom.ts` 在切换语言和激活缓存页面时同步属性。`messages.ts` 维护路由标题及描述映射。

CSS 的 `content` 标签放在 `cssLabels` 分组，样式使用 `var(--i18n-键名)`；首屏脚本和 `dom.ts` 将对应译文作为带引号的 CSS 变量同步到根节点。

飞书返回的职位名称、职责等双语内容仍在飞书维护；网站固定分类译名、兜底文字以及本地开发样例来自此 JSON。新增路由时一并添加标题、描述和相关文案。

`config.ts`、`init-script.ts`、`dom.ts` 保留语言配置和初始化逻辑，语言状态继续使用现有 `useLocale` / `locale-store`。

保留的根目录 `index.html` 通过 `public/legacy-i18n.js` 从此目录加载同一份 JSON，需要通过 HTTP 静态服务访问；正式 Next.js 页面不依赖这次请求。旧画布脚本使用根布局嵌入的文案数据，不维护第二份翻译文件。
