(() => {
  const script = document.currentScript;
  const catalogUrl = new URL(script.dataset.catalog, window.location.href);
  let locale = "zh";
  try { locale = localStorage.getItem("qicore-locale") === "en" ? "en" : "zh"; } catch {}
  function sync() {
    const catalog = window.qicoreMessages;
    if (!catalog) return;
    document.documentElement.dataset.locale = locale;
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    const resolve = (key) => key.split(".").reduce((value, part) => value?.[part], catalog);
    for (const node of document.querySelectorAll("[data-i18n]")) {
      const text = resolve(node.dataset.i18n);
      if (text) node.textContent = text[locale];
    }
    for (const attribute of ["aria-label", "content"]) {
      for (const node of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
        const text = resolve(node.getAttribute(`data-i18n-${attribute}`));
        if (text) node.setAttribute(attribute, text[locale]);
      }
      for (const node of document.querySelectorAll(`[data-${attribute}-${locale}]`)) {
        node.setAttribute(attribute, node.getAttribute(`data-${attribute}-${locale}`));
      }
    }
    const organization = document.querySelector("[data-i18n-organization]");
    if (organization) {
      organization.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: catalog.common.companyName[locale],
        alternateName: catalog.common.brand[locale],
        url: "https://qicore.ai"
      });
    }
  }
  document.querySelector("[data-legacy-locale-toggle]")?.addEventListener("click", () => {
    locale = locale === "zh" ? "en" : "zh";
    try { localStorage.setItem("qicore-locale", locale); } catch {}
    sync();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== "qicore-locale" && event.key !== null) return;
    locale = event.newValue === "en" ? "en" : "zh";
    sync();
  });
  fetch(catalogUrl).then((response) => {
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    return response.json();
  }).then((catalog) => {
    window.qicoreMessages = catalog;
    sync();
  }).catch((error) => console.error("Unable to load the legacy page catalog.", error));
})();
