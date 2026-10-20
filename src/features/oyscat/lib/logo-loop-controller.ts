const SMOOTH_TAU = 0.25;
const COPY_HEADROOM = 2;
const DRAG_THRESHOLD = 6;
const controllers = new WeakMap<HTMLElement, () => void>();

export function startLogoLoop(root: HTMLElement): () => void {
  controllers.get(root)?.();
  const track = root.querySelector<HTMLElement>("[data-logo-loop-track]");
  const sequence = track?.querySelector<HTMLElement>("[data-logo-loop-sequence]");
  if (!track || !sequence) return () => {};

  const direction = root.dataset.logoLoopDirection ?? "left";
  const repeat = root.dataset.logoLoopRepeat !== "false";
  const isVertical = direction === "up" || direction === "down";
  const speed = Number(root.dataset.logoLoopSpeed ?? 120);
  const targetVelocity = (direction === "right" || direction === "down" ? -1 : 1) * speed;
  const hoverSpeed = root.dataset.logoLoopHoverSpeed === undefined
    ? undefined
    : Number(root.dataset.logoLoopHoverSpeed);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let hovered = window.matchMedia("(any-hover: hover)").matches && root.matches(":hover");
  let keyboardInput = document.activeElement instanceof Element && document.activeElement.matches(":focus-visible");
  let focused = root.contains(document.activeElement);
  let sequenceSize = 0;
  let maxOffset = 0;
  let travelDirection = 1;
  let offset = 0;
  let velocity = 0;
  let frame: number | null = null;
  let lastTimestamp: number | null = null;
  let disposed = false;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let lastPosition = 0;
  let dragging = false;
  let suppressClick = false;

  // A cached snapshot may already contain a translated track.
  if (track.style.transform && track.style.transform !== "none") {
    const matrix = new DOMMatrixReadOnly(track.style.transform);
    offset = -(isVertical ? matrix.m42 : matrix.m41);
  }

  const paint = () => {
    track.style.transform = isVertical
      ? `translate3d(0, ${-offset}px, 0)`
      : `translate3d(${-offset}px, 0, 0)`;
  };
  const constrainOffset = (value: number) => repeat
    ? ((value % sequenceSize) + sequenceSize) % sequenceSize
    : Math.max(0, Math.min(maxOffset, value));
  const clearSelection = () => {
    root.querySelectorAll<HTMLElement>("[data-review-trigger]").forEach(trigger => {
      trigger.dataset.selected = "false";
      trigger.setAttribute("aria-pressed", "false");
    });
  };
  const currentTarget = () => pointerId !== null || focused ? 0
    : (hovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity * travelDirection);
  const stop = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    lastTimestamp = null;
    velocity = 0;
  };
  const animate = (timestamp: number) => {
    frame = null;
    const deltaTime = lastTimestamp === null ? 0 : Math.min(0.05, Math.max(0, timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;
    velocity += (currentTarget() - velocity) * (1 - Math.exp(-deltaTime / SMOOTH_TAU));
    const nextOffset = offset + velocity * deltaTime;
    offset = constrainOffset(nextOffset);
    if (!repeat && ((nextOffset >= maxOffset && velocity > 0) || (nextOffset <= 0 && velocity < 0))) {
      travelDirection *= -1;
      velocity = 0;
    }
    paint();
    frame = window.requestAnimationFrame(animate);
  };
  const sync = () => {
    if (disposed) {
      stop();
      return;
    }
    const paused = currentTarget() === 0;
    track.dataset.paused = String(paused);
    if (paused || motion.matches || document.hidden || sequenceSize <= 0 || (!repeat && maxOffset <= 0)) {
      stop();
    } else if (frame === null) {
      frame = window.requestAnimationFrame(animate);
    }
  };

  const measure = () => {
    if (isVertical) {
      const parentHeight = root.parentElement?.clientHeight ?? 0;
      if (parentHeight > 0) root.style.height = `${parentHeight}px`;
    }
    // Layout sizes are unaffected by the route's entrance transforms.
    sequenceSize = isVertical ? sequence.offsetHeight : sequence.offsetWidth;
    if (sequenceSize > 0) {
      const viewportSize = isVertical ? root.clientHeight : root.clientWidth;
      maxOffset = Math.max(0, sequenceSize - viewportSize);
      offset = constrainOffset(offset);
      const copiesNeeded = repeat ? Math.max(2, Math.ceil(viewportSize / sequenceSize) + COPY_HEADROOM) : 1;
      const copies = Array.from(track.querySelectorAll<HTMLElement>("[data-logo-loop-sequence]"));
      for (let index = copies.length; index < copiesNeeded; index += 1) {
        const copy = sequence.cloneNode(true) as HTMLElement;
        copy.dataset.logoLoopClone = "";
        copy.setAttribute("aria-hidden", "true");
        copy.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]").forEach(node => {
          node.tabIndex = -1;
        });
        copy.querySelectorAll<HTMLElement>("[data-review-trigger]").forEach(node => {
          node.dataset.selected = "false";
          node.setAttribute("aria-pressed", "false");
        });
        track.append(copy);
      }
      copies.slice(copiesNeeded).forEach(copy => {
        if (copy.hasAttribute("data-logo-loop-clone")) copy.remove();
      });
      paint();
    }
    sync();
  };
  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    hovered = true;
    sync();
  };
  const handlePointerLeave = () => {
    hovered = false;
    sync();
  };
  const handlePointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || pointerId !== null) return;
    suppressClick = false;
    keyboardInput = false;
    if (!(event.target instanceof Node) || !root.contains(event.target)) {
      // Clicking non-focusable content does not always blur the active button.
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active)) active.blur();
      focused = false;
      clearSelection();
    }
    if (event.pointerType === "touch") hovered = false;
    if (event.target instanceof Node && root.contains(event.target) && sequenceSize > 0) {
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastPosition = isVertical ? startY : startX;
    }
    sync();
  };
  const finishDrag = (cancelled: boolean) => {
    const capturedPointer = pointerId;
    if (capturedPointer === null) return;
    suppressClick = dragging || cancelled;
    pointerId = null;
    dragging = false;
    delete root.dataset.dragging;
    if (root.hasPointerCapture(capturedPointer)) root.releasePointerCapture(capturedPointer);
    sync();
  };
  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    if (sequenceSize <= 0) {
      finishDrag(true);
      return;
    }
    const distance = isVertical ? event.clientY - startY : event.clientX - startX;
    const crossDistance = isVertical ? event.clientX - startX : event.clientY - startY;
    if (!dragging) {
      if (Math.max(Math.abs(distance), Math.abs(crossDistance)) < DRAG_THRESHOLD) return;
      // Let the browser own a perpendicular touch gesture (page scrolling).
      if (Math.abs(crossDistance) > Math.abs(distance)) {
        finishDrag(true);
        return;
      }
      dragging = true;
      suppressClick = true;
      root.dataset.dragging = "true";
      root.setPointerCapture(event.pointerId);
    }
    if (event.cancelable) event.preventDefault();
    const position = isVertical ? event.clientY : event.clientX;
    offset = constrainOffset(offset - (position - lastPosition));
    lastPosition = position;
    paint();
  };
  const handlePointerUp = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    const bounds = root.getBoundingClientRect();
    hovered = event.pointerType !== "touch" && event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    finishDrag(false);
  };
  const handlePointerCancel = (event: PointerEvent) => {
    if (event.pointerId === pointerId) finishDrag(true);
  };
  const handleClick = (event: MouseEvent) => {
    // Pointer capture can retarget the release click; never let a drag select a maker.
    if (dragging || (suppressClick && event.detail !== 0)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const trigger = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-review-trigger]") : null;
    // Touch and Safari clicks need explicit focus to keep the chosen review still.
    trigger?.focus({ preventScroll: true });
  };
  const handleNativeDrag = (event: DragEvent) => event.preventDefault();
  const handleWindowBlur = () => {
    hovered = false;
    finishDrag(true);
    sync();
  };
  const handleVisibilityChange = () => {
    if (document.hidden) handleWindowBlur();
    else sync();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || ["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    keyboardInput = true;
    focused = root.contains(document.activeElement);
    sync();
  };
  const handleFocusIn = (event: FocusEvent) => {
    focused = event.target instanceof Node && root.contains(event.target);
    if (focused && keyboardInput && event.target instanceof HTMLElement && sequenceSize > 0) {
      // Keep the primary, keyboard-accessible copy visible after it has looped offscreen.
      const bounds = root.getBoundingClientRect();
      const focused = event.target.getBoundingClientRect();
      const before = isVertical ? focused.top - bounds.top : focused.left - bounds.left;
      const after = isVertical ? focused.bottom - bounds.bottom : focused.right - bounds.right;
      const adjustment = before < 0 ? before : after > 0 ? after : 0;
      offset = Math.max(0, Math.min(repeat ? sequenceSize - 1 : maxOffset, offset + adjustment));
      paint();
    }
    sync();
  };
  const handleFocusOut = (event: FocusEvent) => {
    focused = event.relatedTarget instanceof Node && root.contains(event.relatedTarget);
    clearSelection();
    sync();
  };
  const handleMotionChange = () => {
    if (motion.matches) {
      offset = 0;
      paint();
    }
    sync();
  };

  const resizeObserver = window.ResizeObserver ? new ResizeObserver(measure) : null;
  resizeObserver?.observe(root);
  resizeObserver?.observe(sequence);
  if (isVertical && root.parentElement) resizeObserver?.observe(root.parentElement);
  window.addEventListener("resize", measure);
  root.addEventListener("load", measure, true);
  root.addEventListener("error", measure, true);
  root.addEventListener("pointerenter", handlePointerEnter);
  root.addEventListener("pointerleave", handlePointerLeave);
  root.addEventListener("lostpointercapture", handlePointerCancel);
  root.addEventListener("click", handleClick, true);
  root.addEventListener("dragstart", handleNativeDrag);
  root.addEventListener("focusin", handleFocusIn);
  root.addEventListener("focusout", handleFocusOut);
  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("pointermove", handlePointerMove, { capture: true, passive: false });
  document.addEventListener("pointerup", handlePointerUp, true);
  document.addEventListener("pointercancel", handlePointerCancel, true);
  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleWindowBlur);
  motion.addEventListener("change", handleMotionChange);

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    finishDrag(true);
    stop();
    resizeObserver?.disconnect();
    window.removeEventListener("resize", measure);
    root.removeEventListener("load", measure, true);
    root.removeEventListener("error", measure, true);
    root.removeEventListener("pointerenter", handlePointerEnter);
    root.removeEventListener("pointerleave", handlePointerLeave);
    root.removeEventListener("lostpointercapture", handlePointerCancel);
    root.removeEventListener("click", handleClick, true);
    root.removeEventListener("dragstart", handleNativeDrag);
    root.removeEventListener("focusin", handleFocusIn);
    root.removeEventListener("focusout", handleFocusOut);
    document.removeEventListener("pointerdown", handlePointerDown, true);
    document.removeEventListener("pointermove", handlePointerMove, true);
    document.removeEventListener("pointerup", handlePointerUp, true);
    document.removeEventListener("pointercancel", handlePointerCancel, true);
    document.removeEventListener("keydown", handleKeyDown, true);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", handleWindowBlur);
    motion.removeEventListener("change", handleMotionChange);
    track.querySelectorAll("[data-logo-loop-clone]").forEach(copy => copy.remove());
    delete track.dataset.paused;
    if (controllers.get(root) === cleanup) controllers.delete(root);
  };
  controllers.set(root, cleanup);
  if (!focused) clearSelection();
  measure();
  return cleanup;
}
