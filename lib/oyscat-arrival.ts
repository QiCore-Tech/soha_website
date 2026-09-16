// Keep the gateway and its cat in viewport coordinates during in-place navigation.
export function prepareOyscatArrival() {
  const source = document.querySelector<HTMLElement>(".oyscat-gateway");
  if (!source) return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rect = source.getBoundingClientRect();
  const sourceCat = source.querySelector("img");
  if (!sourceCat) return () => {};
  const catRect = sourceCat.getBoundingClientRect();
  const card = source.cloneNode(true) as HTMLElement;
  card.removeAttribute("id");
  card.removeAttribute("data-oyscat-entry");
  card.setAttribute("aria-hidden", "true");
  card.tabIndex = -1;
  card.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;right:auto;bottom:auto;margin:0;z-index:10000;pointer-events:none;transform:none;`;
  card.querySelector("img")!.style.visibility = "hidden";
  const cat = document.createElement("img");
  cat.src = "/brand/oyscat-workspace-loading-320-12fps.webp";
  cat.alt = "";
  cat.style.cssText = `position:fixed;left:${catRect.left}px;top:${catRect.top}px;width:${catRect.width}px;height:${catRect.height}px;object-fit:contain;z-index:10001;pointer-events:none;`;
  document.body.append(card, cat);
  let frame = 0;
  let target: HTMLElement | null = null;
  let cancelled = false;
  const cleanup = () => {
    cancelled = true;
    clearTimeout(watchdog);
    cancelAnimationFrame(frame);
    card.remove(); cat.remove();
    if (target) target.style.visibility = "";
  };
  const watchdog = window.setTimeout(cleanup, 5000);
  function land() {
    if (cancelled) return;
    target = document.querySelector<HTMLElement>(".qicore-route-panel.is-active [data-oyscat-landing-cat]");
    const destination = document.querySelector<HTMLElement>(".qicore-route-panel.is-active [data-oyscat-landing-card]");
    if (!target || !destination) { frame = requestAnimationFrame(land); return; }
    const end = target.getBoundingClientRect();
    const panel = destination.getBoundingClientRect();
    target.style.visibility = "hidden";
    const options: KeyframeAnimationOptions = {duration: reduced ? 120 : 850, easing:"cubic-bezier(.22,1,.36,1)",fill:"forwards"};
    card.animate([{transform:"translate(0,0)",opacity:1},{transform:`translate(${panel.left-rect.left}px,${panel.top-rect.top}px)`,opacity:0}],options);
    const animation = cat.animate([{left:`${catRect.left}px`,top:`${catRect.top}px`,width:`${catRect.width}px`,height:`${catRect.height}px`},{left:`${end.left}px`,top:`${end.top}px`,width:`${end.width}px`,height:`${end.height}px`}],options);
    void animation.finished.then(cleanup, cleanup);
  }
  frame = requestAnimationFrame(land);
  return cleanup;
}
