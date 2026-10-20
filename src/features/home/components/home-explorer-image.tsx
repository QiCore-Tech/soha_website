"use client";

import { messages } from "@/i18n/messages";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useLocale } from "@/hooks/use-locale";

export function HomeExplorerImage() {
  const { locale } = useLocale();
  const imageRef = useRef<HTMLImageElement>(null);
  const pixelsRef = useRef<ImageData | null>(null);
  const [hovered, setHovered] = useState(false);

  const readPixels = useCallback(() => {
    const image = imageRef.current;
    if (!image?.naturalWidth) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0);
      pixelsRef.current = context.getImageData(0, 0, canvas.width, canvas.height);
    } catch {
      pixelsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (imageRef.current?.complete) readPixels();
  }, [readPixels]);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const image = imageRef.current;
    const pixels = pixelsRef.current;
    if (event.pointerType !== "mouse" || !image || !pixels) {
      setHovered(false);
      return;
    }

    // Sample the unscaled object-contain image to keep edge hover from oscillating.
    const bounds = event.currentTarget.getBoundingClientRect();
    const scale = Math.min(image.offsetWidth / pixels.width, image.offsetHeight / pixels.height);
    if (!scale) return;
    const left = (bounds.width - pixels.width * scale) / 2;
    const top = (bounds.height - pixels.height * scale) / 2;
    const x = Math.floor((event.clientX - bounds.left - left) / scale);
    const y = Math.floor((event.clientY - bounds.top - top) / scale);
    const hit = x >= 0 && y >= 0 && x < pixels.width && y < pixels.height
      && pixels.data[(y * pixels.width + x) * 4 + 3] > 16;
    setHovered(hit);
  };

  return (
    <div onPointerMove={move} onPointerLeave={() => setHovered(false)}
      onPointerCancel={() => setHovered(false)}
      className={`flex items-center justify-center ${hovered ? "cursor-pointer" : "cursor-auto"}`}>
      <img ref={imageRef} src="/media/new/explorer-robot-trimmed.png"
        alt={messages.runtime.explorerAlt[locale]}
        data-alt-zh={messages.homeExplorerImage.oyscatBinocularExplorationRobot.zh} data-alt-en={messages.homeExplorerImage.oyscatBinocularExplorationRobot.en}
        loading="lazy" decoding="async" width={1040} height={1084} onLoad={readPixels}
        className={`block h-auto max-h-[min(60svh,620px)] w-full object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${hovered ? "motion-safe:scale-[1.045]" : ""}`} />
    </div>
  );
}
