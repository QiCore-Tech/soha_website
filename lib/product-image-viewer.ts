import styles from "@/components/oyscat-image.module.css";

export function openProductImage(trigger: HTMLElement) {
  const image = trigger.querySelector("img");
  if (!image) return () => {};
  const dialog = document.createElement("dialog");
  dialog.className = styles.viewer;
  dialog.setAttribute("aria-label", document.documentElement.dataset.locale === "en" ? "Image preview" : "图片预览");
  const sheet = document.createElement("div");
  sheet.className = styles.sheet;
  const header = document.createElement("header");
  const title = document.createElement("h2");
  title.textContent = trigger.querySelector(`[data-lang="${document.documentElement.dataset.locale === "en" ? "en" : "zh"}"]`)?.textContent ?? "Oyscat";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = document.documentElement.dataset.locale === "en" ? "Close ×" : "关闭 ×";
  header.append(title, close);
  sheet.append(header, image.cloneNode(true));
  dialog.append(sheet);
  document.body.append(dialog);
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
