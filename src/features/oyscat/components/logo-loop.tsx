"use client";
import { messages } from "@/i18n/messages";
import { useLocale } from "@/hooks/use-locale";
import type { LocalizedText } from "@/types/locale";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, Key, ReactNode } from "react";
import { startLogoLoop } from "../lib/logo-loop-controller";
import styles from "./logo-loop.module.css";

const ANIMATION_CONFIG = {
  // The route shell snapshots innerHTML at mount, before the first width
  // measurement. Render enough tiles up front so cached HTML still fills
  // wide viewports seamlessly.
  INITIAL_COPIES: 6,
} as const;

export type LogoItem = {
  node?: ReactNode;
  src?: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  href?: string;
  ariaLabel?: string;
  [key: string]: unknown;
};

export type LogoLoopProps = {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right" | "up" | "down";
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  repeat?: boolean;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  renderItem?: (item: LogoItem, key: Key, isPrimaryCopy: boolean) => ReactNode;
  ariaLabel?: string | LocalizedText;
  className?: string;
  style?: CSSProperties;
};

function toCssLength(value: number | string | undefined): string | undefined {
  return typeof value === "number" ? `${value}px` : (value ?? undefined);
}

function LogoLoopComponent({
  logos,
  speed = 120,
  direction = "left",
  width = "100%",
  logoHeight = 28,
  gap = 32,
  repeat = true,
  pauseOnHover,
  hoverSpeed,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  renderItem,
  ariaLabel = messages.runtime.partnerLogos,
  className,
  style,
}: LogoLoopProps) {
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveHoverSpeed = useMemo(() => {
    if (hoverSpeed !== undefined) return hoverSpeed;
    if (pauseOnHover === true) return 0;
    if (pauseOnHover === false) return undefined;
    return 0;
  }, [hoverSpeed, pauseOnHover]);

  const isVertical = direction === "up" || direction === "down";

  useEffect(() => {
    if (containerRef.current) return startLogoLoop(containerRef.current);
  }, [logos, speed, direction, effectiveHoverSpeed, gap, logoHeight, renderItem, repeat]);

  const cssVariables = useMemo(
    () =>
      ({
        "--logoloop-gap": `${gap}px`,
        "--logoloop-logoHeight": `${logoHeight}px`,
        ...(fadeOutColor && { "--logoloop-fadeColor": fadeOutColor }),
      }) as CSSProperties,
    [gap, logoHeight, fadeOutColor]
  );

  const rootClassName = useMemo(
    () =>
      [
        styles.root,
        isVertical ? styles.vertical : styles.horizontal,
        fadeOut && styles.fade,
        scaleOnHover && styles.scaleHover,
        !repeat && styles.finite,
        className,
      ]
        .filter(Boolean)
        .join(" "),
    [isVertical, fadeOut, scaleOnHover, repeat, className]
  );

  const renderLogoItem = useCallback(
    (item: LogoItem, key: Key, isPrimaryCopy: boolean) => {
      if (renderItem) {
        return (
          <li className={styles.item} key={key} role="listitem">
            {renderItem(item, key, isPrimaryCopy)}
          </li>
        );
      }
      const node = item.node;
      const content = node !== undefined ? (
        <span className={styles.node} aria-hidden={!!item.href && !item.ariaLabel}>
          {node}
        </span>
      ) : (
        <img
          src={item.src}
          srcSet={item.srcSet}
          sizes={item.sizes}
          width={item.width}
          height={item.height}
          alt={item.alt ?? ""}
          title={item.title}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      );
      const itemAriaLabel = node !== undefined ? (item.ariaLabel ?? item.title) : (item.alt ?? item.title);
      const itemContent = item.href ? (
        <a
          className={styles.link}
          href={item.href}
          aria-label={itemAriaLabel || messages.runtime.logoLink[locale]}
          target="_blank"
          rel="noreferrer noopener"
          tabIndex={isPrimaryCopy ? undefined : -1}
        >
          {content}
        </a>
      ) : (
        content
      );
      return (
        <li className={styles.item} key={key} role="listitem">
          {itemContent}
        </li>
      );
    },
    [renderItem, locale]
  );

  const logoLists = useMemo(
    () =>
      Array.from({ length: repeat ? ANIMATION_CONFIG.INITIAL_COPIES : 1 }, (_, copyIndex) => (
        <ul
          className={styles.list}
          key={`copy-${copyIndex}`}
          role="list"
          aria-hidden={copyIndex > 0}
          data-logo-loop-sequence=""
        >
          {logos.map((item, itemIndex) => renderLogoItem(item, `${copyIndex}-${itemIndex}`, copyIndex === 0))}
        </ul>
      )),
    [logos, renderLogoItem, repeat]
  );

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      width: isVertical ? (toCssLength(width) === "100%" ? undefined : toCssLength(width)) : (toCssLength(width) ?? "100%"),
      ...cssVariables,
      ...style,
    }),
    [width, cssVariables, style, isVertical]
  );

  return (
    <div
      ref={containerRef}
      className={rootClassName}
      style={containerStyle}
      role="region"
      aria-label={typeof ariaLabel === "string" ? ariaLabel : ariaLabel[locale]} data-aria-label-zh={typeof ariaLabel === "string" ? ariaLabel : ariaLabel.zh} data-aria-label-en={typeof ariaLabel === "string" ? ariaLabel : ariaLabel.en}
      data-logo-loop=""
      data-logo-loop-speed={speed}
      data-logo-loop-direction={direction}
      data-logo-loop-hover-speed={effectiveHoverSpeed}
      data-logo-loop-repeat={String(repeat)}
    >
      <div className={styles.track} data-logo-loop-track="">
        {logoLists}
      </div>
    </div>
  );
}

export const LogoLoop = memo(LogoLoopComponent);
LogoLoop.displayName = "LogoLoop";

export default LogoLoop;
