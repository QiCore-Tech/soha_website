import { LOCALE_STORAGE_KEY } from "@/constants/storage";
import { localeCssProperties } from "@/i18n/messages";

// 在 hydration 前执行；不可访问服务端凭据。转场恢复仍留在根 layout 原脚本中。
export const localeInitScript = `try{var locale=window.localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)})==="en"?"en":"zh";root.dataset.locale=locale;root.lang=locale==="en"?"en":"zh-CN";}catch(error){root.dataset.locale="zh";root.lang="zh-CN";}var localeCss=${JSON.stringify(localeCssProperties).replace(/</g, "\\u003c")};Object.keys(localeCss[root.dataset.locale]).forEach(function(key){root.style.setProperty(key,localeCss[root.dataset.locale][key]);});`;
