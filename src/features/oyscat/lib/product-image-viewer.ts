import styles from "@/features/oyscat/components/oyscat-image.module.css";
import { messages } from "@/i18n/messages";
import { syncLocaleDocument } from "@/i18n/dom";

export function openProductImage(trigger: HTMLElement) {
  const image = trigger.querySelector("img");
  if (!image) return () => {};
  const dialog = document.createElement("dialog");
  dialog.className = styles.viewer;
  dialog.dataset.ariaLabelZh = messages.common.imagePreview.zh;
  dialog.dataset.ariaLabelEn = messages.common.imagePreview.en;
  const sheet = document.createElement("div");
  sheet.className = styles.sheet;
  const header = document.createElement("header");
  const title = document.createElement("h2");
  for (const locale of ["zh", "en"] as const) {
    const label = document.createElement("span");
    label.dataset.lang = locale;
    label.textContent = trigger.querySelector(`[data-lang="${locale}"]`)?.textContent ?? messages.common.productName[locale];
    title.append(label);
  }
  const close = document.createElement("button");
  close.type = "button";
  for (const locale of ["zh", "en"] as const) {
    const label = document.createElement("span");
    label.dataset.lang = locale;
    label.textContent = messages.common.closePreview[locale];
    close.append(label);
  }
  header.append(title, close);
  sheet.append(header, image.cloneNode(true));
  dialog.append(sheet);
  document.body.append(dialog);
  syncLocaleDocument(document.documentElement.dataset.locale === "en" ? "en" : "zh");
  const overflow = document.body.style.overflow;
  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    dialog.close();
    dialog.remove();
    document.body.style.overflow = overflow;
    if (trigger.isConnected) trigger.focus({ preventScroll: true });
  };
  close.onclick = cleanup;
  dialog.oncancel = event => { event.preventDefault(); cleanup(); };
  dialog.onclose = cleanup;
  dialog.onclick = event => { if (event.target === dialog) cleanup(); };
  dialog.showModal();
  document.body.style.overflow = "hidden";
  close.focus();
  return cleanup;
}
