"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FOOTER_ALIASES, GRID_SIZE, FACE_KEYS, COLOR_OPTIONS, MULTICOLOR_GRADIENT, clamp, getMaxZInArea, getTopVoxelAt, pickRandomColorKey, type ColorMode, type PaletteKey, type Voxel, type VoxelDraft } from "@/lib/site-data";
import { usePerformanceTier } from "@/hooks/use-performance-tier";

const VoxelScene = dynamic(() => import("./voxel-scene").then((mod) => mod.VoxelScene), {
  ssr: false
});

type PointerState = {
  x: number;
  y: number;
  normX: number;
  normY: number;
};

type PaletteState = "closed" | "opening" | "open" | "closing";

export function HomePage() {
  const { tier, reducedMotion } = usePerformanceTier();
  const paperRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sloganRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, normX: 0, normY: 0 });
  const drawingRef = useRef<{ startX: number; startY: number; colorKey: PaletteKey } | null>(null);
  const paletteTimersRef = useRef<number[]>([]);

  const [paperSize, setPaperSize] = useState({ width: 0, height: 0 });
  const [isMobileView, setIsMobileView] = useState(false);
  const [isContrastText, setIsContrastText] = useState(false);
  const [sloganExpanded, setSloganExpanded] = useState(false);
  const [footerAliasIndex, setFooterAliasIndex] = useState(0);
  const [paletteState, setPaletteState] = useState<PaletteState>("closed");
  const [paletteAnchor, setPaletteAnchor] = useState({ x: 0, y: 0 });
  const [pointerVisual, setPointerVisual] = useState<PointerState>({ x: 0, y: 0, normX: 0, normY: 0 });
  const [activeColorMode, setActiveColorMode] = useState<ColorMode>("multicolor");
  const [pendingPlacementColor, setPendingPlacementColor] = useState<PaletteKey | null>(null);
  const [voxels, setVoxels] = useState<Voxel[]>([]);
  const [magnetic, setMagnetic] = useState<VoxelDraft | null>(null);
  const [preview, setPreview] = useState<VoxelDraft | null>(null);
  const [coordText, setCoordText] = useState("X: 0 | Y: 0 | Z: 0");

  const gridCols = Math.max(1, Math.floor(paperSize.width / GRID_SIZE));
  const gridRows = Math.max(1, Math.floor(paperSize.height / GRID_SIZE));
  const interactiveEnabled = !isMobileView && tier !== "low";

  const displayBrushColor = activeColorMode === "multicolor" ? pendingPlacementColor : activeColorMode;
  const cursorCubeClassName = [
    "cursor-cube-container",
    paletteState !== "closed" ? "is-palette-mode" : "",
    paletteState === "open" || paletteState === "opening" ? "is-palette" : "",
    displayBrushColor ? "is-colored" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const footerAlias = FOOTER_ALIASES[footerAliasIndex];
  const footerEmail = `${footerAlias}@qicore.ai`;
  const cursorCubeStyle = {
    "--selected-color": displayBrushColor ? COLOR_OPTIONS[displayBrushColor].hex : "transparent"
  } as CSSProperties;

  const paperTransform = useMemo(() => {
    const { normX, normY } = pointerVisual;
    const rotX = interactiveEnabled ? normY * -14 : 0;
    const rotY = interactiveEnabled ? normX * 14 : 0;
    return {
      transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
      boxShadow: `${normX * -36}px ${normY * -36 + 40}px 100px rgba(0, 0, 0, 0.56)`
    };
  }, [interactiveEnabled, pointerVisual]);

  function clearPaletteTimers() {
    paletteTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    paletteTimersRef.current = [];
  }

  function queuePaletteTimer(delay: number, callback: () => void) {
    const timer = window.setTimeout(callback, delay);
    paletteTimersRef.current.push(timer);
    return timer;
  }

  function ensurePendingColor() {
    if (activeColorMode !== "multicolor") return activeColorMode;
    if (pendingPlacementColor) return pendingPlacementColor;
    const nextColor = pickRandomColorKey();
    setPendingPlacementColor(nextColor);
    return nextColor;
  }

  function clearPendingColor() {
    setPendingPlacementColor(null);
  }

  function openPaletteAt(clientX: number, clientY: number) {
    if (isMobileView || paletteState !== "closed") return;
    clearPaletteTimers();
    clearPendingColor();
    setPaletteAnchor({ x: clientX, y: clientY });
    setPaletteState("opening");
    queuePaletteTimer(180, () => setPaletteState("open"));
  }

  function closePalette(nextMode?: ColorMode) {
    if (paletteState !== "open") return;
    clearPaletteTimers();
    if (nextMode) setActiveColorMode(nextMode);
    clearPendingColor();
    setPaletteState("closing");
    queuePaletteTimer(720, () => setPaletteState("closed"));
  }

  function selectPaletteColor(mode: ColorMode) {
    closePalette(mode);
  }

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;

    const update = () => {
      const rect = paper.getBoundingClientRect();
      setPaperSize({ width: rect.width, height: rect.height });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(paper);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const detect = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const noHover = window.matchMedia("(hover: none)").matches;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|HarmonyOS/i.test(
        navigator.userAgent
      );
      setIsMobileView(mobileUA || (navigator.maxTouchPoints > 0 && (coarse || noHover)));
    };

    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFooterAliasIndex((index) => (index + 1) % FOOTER_ALIASES.length);
    }, 2200);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => clearPaletteTimers();
  }, []);

  function resolveGridCoords(clientX: number, clientY: number) {
    const paper = paperRef.current;
    if (!paper) return null;
    const rect = paper.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return null;

    const x = clamp(Math.floor(localX / GRID_SIZE), 0, Math.max(0, gridCols - 1));
    const y = clamp(Math.floor(localY / GRID_SIZE), 0, Math.max(0, gridRows - 1));
    return { x, y };
  }

  function syncPointer(clientX: number, clientY: number) {
    const nextPointer = {
      x: clientX,
      y: clientY,
      normX: window.innerWidth ? clamp(clientX / window.innerWidth - 0.5, -0.5, 0.5) : 0,
      normY: window.innerHeight ? clamp(clientY / window.innerHeight - 0.5, -0.5, 0.5) : 0
    };
    pointerRef.current = nextPointer;
    setPointerVisual(nextPointer);

    if (paletteState !== "closed" || isMobileView) {
      setIsContrastText(false);
      return;
    }

    const titleRect = titleRef.current?.getBoundingClientRect();
    const sloganRect = sloganRef.current?.getBoundingClientRect();
    const footerRect = footerRef.current?.getBoundingClientRect();
    const within = (rect?: DOMRect, padX = 0, padY = 0) =>
      !!rect &&
      clientX >= rect.left - padX &&
      clientX <= rect.right + padX &&
      clientY >= rect.top - padY &&
      clientY <= rect.bottom + padY;

    setIsContrastText(within(titleRect, 10, 10) || within(sloganRect, 10, 10) || within(footerRect, 8, 8));
  }

  function handleShellPointerMove(event: React.PointerEvent<HTMLElement>) {
    syncPointer(event.clientX, event.clientY);
  }

  function handleShellPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (isMobileView || paletteState !== "closed") return;
    if (event.button !== 2) return;
    if (paperRef.current?.contains(event.target as Node)) return;
    event.preventDefault();
    openPaletteAt(event.clientX, event.clientY);
  }

  function handlePaperPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (isMobileView || paletteState !== "closed") return;

    syncPointer(event.clientX, event.clientY);
    const coords = resolveGridCoords(event.clientX, event.clientY);
    if (!coords) {
      setMagnetic(null);
      setCoordText("X: 0 | Y: 0 | Z: 0");
      if (!drawingRef.current) clearPendingColor();
      return;
    }

    const currentColor = activeColorMode === "multicolor" ? ensurePendingColor() : activeColorMode;
    const draft = drawingRef.current;

    if (!draft) {
      const z = getMaxZInArea(voxels, coords.x, coords.y, coords.x, coords.y);
      setCoordText(`X: ${coords.x} | Y: ${coords.y} | Z: ${z}`);
      setMagnetic({ x: coords.x, y: coords.y, w: 1, h: 1, z, colorKey: currentColor });
      return;
    }

    const minX = Math.min(draft.startX, coords.x);
    const minY = Math.min(draft.startY, coords.y);
    const w = Math.abs(coords.x - draft.startX) + 1;
    const h = Math.abs(coords.y - draft.startY) + 1;
    const z = Math.max(0, getMaxZInArea(voxels, minX, minY, minX + w - 1, minY + h - 1));
    setPreview({ x: minX, y: minY, w, h, z, colorKey: draft.colorKey });
    setMagnetic(null);
    setCoordText(`X: ${coords.x} | Y: ${coords.y} | Z: ${z}`);
  }

  function handlePaperPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isMobileView || paletteState !== "closed") return;
    syncPointer(event.clientX, event.clientY);

    if (event.button === 2) {
      event.preventDefault();
      event.stopPropagation();
      const coords = resolveGridCoords(event.clientX, event.clientY);
      if (!coords) return;
      const topVoxel = getTopVoxelAt(voxels, coords.x, coords.y);
      if (topVoxel) {
        clearPendingColor();
        setVoxels((current) => current.filter((voxel) => voxel.id !== topVoxel.id));
      } else {
        openPaletteAt(event.clientX, event.clientY);
      }
      return;
    }

    if (event.button !== 0) return;
    const coords = resolveGridCoords(event.clientX, event.clientY);
    if (!coords) return;
    const colorKey = activeColorMode === "multicolor" ? ensurePendingColor() : activeColorMode;
    const z = getMaxZInArea(voxels, coords.x, coords.y, coords.x, coords.y);
    drawingRef.current = { startX: coords.x, startY: coords.y, colorKey };
    setPreview({ x: coords.x, y: coords.y, w: 1, h: 1, z, colorKey });
    setMagnetic(null);
  }

  useEffect(() => {
    const handlePointerUp = () => {
      if (!drawingRef.current) return;
      if (preview) {
        setVoxels((current) => [
          ...current,
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            ...preview
          }
        ]);
      }
      drawingRef.current = null;
      setPreview(null);
      clearPendingColor();
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [preview]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && paletteState === "open") closePalette();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paletteState]);

  const ambientGlowStyle = {
    transform: `translate3d(${pointerVisual.x}px, ${pointerVisual.y}px, 0) translate(-50%, -50%)`
  };

  return (
    <main className="site-shell" onPointerMove={handleShellPointerMove} onPointerDown={handleShellPointerDown}>
      <div className="ambient-glow" style={ambientGlowStyle} />

      <section ref={paperRef} className="paper-canvas" style={paperTransform}>
        <div className="grid-plane" />
        <div className="scene-layer">
          <VoxelScene
            voxels={voxels}
            preview={preview}
            magnetic={magnetic}
            gridCols={gridCols}
            gridRows={gridRows}
            pointerRef={pointerRef}
            tier={tier}
            interactiveEnabled={!reducedMotion && !isMobileView}
          />
        </div>

        <div
          className="hit-layer"
          onPointerMove={handlePaperPointerMove}
          onPointerDown={handlePaperPointerDown}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className={`crosshair ${magnetic || preview ? "is-visible" : ""}`}>
            <div className="axis-h" style={{ top: magnetic ? `${(magnetic.y + 0.5) * GRID_SIZE}px` : preview ? `${(preview.y + preview.h / 2) * GRID_SIZE}px` : 0 }} />
            <div className="axis-v" style={{ left: magnetic ? `${(magnetic.x + 0.5) * GRID_SIZE}px` : preview ? `${(preview.x + preview.w / 2) * GRID_SIZE}px` : 0 }} />
            <div className="coord-tracker">{coordText}</div>
          </div>
        </div>

        <div className="content-layer">
          <h1 ref={titleRef} className="brand-title">
            <span className="qi">Qi</span>
            <span className="core">Core</span>
          </h1>

          <div className="slogan-shell">
            <div
              ref={sloganRef}
              className={`slogan-card ${sloganExpanded ? "is-expanded" : ""}`}
              onPointerEnter={() => !isMobileView && setSloganExpanded(true)}
              onPointerLeave={() => setSloganExpanded(false)}
            >
              <div className="slogan-bar">
                <p>
                  Make Smart <span className="slogan-separator" /> 气造万物
                </p>
              </div>
              <div className="slogan-drawer">
                <div className="slogan-detail">
                  <p className="company-note">
                    <span className="brand">气核科技（qicore）</span> 专注于智能硬件创造与新一代平台研发，欢迎了解公司业务，
                    <span className="hiring">WE ARE HIRING</span>。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={footerRef} className="footer-signature">
          <div className="terminal-footer">
            <a className="terminal-footer-link" href={`mailto:${footerEmail}`} aria-label={`Email ${footerEmail}`}>
              <div className="icon-indicator" />
              <div className="slot-machine">
                <div className="slot-track" style={{ transform: `translateY(${-footerAliasIndex * 16}px)` }}>
                  <span>info</span>
                  <span>hr</span>
                </div>
              </div>
              <span className="domain">@qicore.ai</span>
            </a>
          </div>
        </div>
      </section>

      <div className={`palette-overlay ${paletteState !== "closed" ? "is-active" : ""}`} aria-hidden={paletteState === "closed"}>
        <button className="palette-backdrop" type="button" aria-label="Close palette" onPointerDown={() => paletteState === "open" && closePalette()} />
      </div>

      <div
        className={`cursor-wrapper ${isContrastText ? "is-contrast-text" : ""} ${paletteState !== "closed" ? "is-palette-mode" : ""}`}
        style={{ transform: `translate3d(${paletteState !== "closed" ? paletteAnchor.x : pointerVisual.x}px, ${paletteState !== "closed" ? paletteAnchor.y : pointerVisual.y}px, 0)` }}
      >
        <div className="cursor-dot" />
        <div
          className={cursorCubeClassName}
          style={cursorCubeStyle}
        >
          {FACE_KEYS.map((faceKey) => (
            <button
              key={faceKey}
              type="button"
              className={`cursor-cube-face face ${faceKey}`}
              data-color-key={faceKey}
              aria-label={`Select ${faceKey} color`}
              onPointerDown={(event) => {
                if (paletteState !== "open") return;
                event.stopPropagation();
                selectPaletteColor(faceKey);
              }}
            />
          ))}
          <button
            type="button"
            className="extra-face multi"
            data-color-key="multicolor"
            aria-label="Multicolor"
            onPointerDown={(event) => {
              if (paletteState !== "open") return;
              event.stopPropagation();
              selectPaletteColor("multicolor");
            }}
          />
          <button
            type="button"
            className="extra-face white"
            data-color-key="white"
            aria-label="White"
            onPointerDown={(event) => {
              if (paletteState !== "open") return;
              event.stopPropagation();
              selectPaletteColor("white");
            }}
          />
          <button
            type="button"
            className="extra-face black"
            data-color-key="black"
            aria-label="Black"
            onPointerDown={(event) => {
              if (paletteState !== "open") return;
              event.stopPropagation();
              selectPaletteColor("black");
            }}
          />
        </div>
      </div>
    </main>
  );
}
