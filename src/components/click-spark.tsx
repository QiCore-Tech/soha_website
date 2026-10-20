"use client";

import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ClickSparkEasing = "linear" | "ease-in" | "ease-in-out" | "ease-out";

type ClickSparkProps = {
  /** Color of each spark line. */
  sparkColor?: string;
  /** Initial length of each spark line. */
  sparkSize?: number;
  /** How far sparks travel from the click center. */
  sparkRadius?: number;
  /** Number of spark lines that appear on each click. */
  sparkCount?: number;
  /** Animation duration in milliseconds. */
  duration?: number;
  /** Easing function used for the spark animation. */
  easing?: ClickSparkEasing;
  /** Additional multiplier for spark distance. */
  extraScale?: number;
  className?: string;
  children?: ReactNode;
};

type Spark = {
  x: number;
  y: number;
  angle: number;
  startTime: number;
};

type SparkPainterOptions = {
  sparkColor: string;
  sparkSize: number;
  sparkRadius: number;
  sparkCount: number;
  duration: number;
  easing: ClickSparkEasing;
  extraScale: number;
};

function useSparkPainter({
  sparkColor,
  sparkSize,
  sparkRadius,
  sparkCount,
  duration,
  easing,
  extraScale,
}: SparkPainterOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationRef = useRef<number | null>(null);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  const draw = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        animationRef.current = null;
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const remaining: Spark[] = [];
      for (const spark of sparksRef.current) {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) continue;

        const progress = elapsed / duration;
        const eased = easeFunc(progress);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        remaining.push(spark);
      }

      sparksRef.current = remaining;
      animationRef.current = remaining.length > 0 ? requestAnimationFrame(draw) : null;
    },
    [duration, easeFunc, extraScale, sparkColor, sparkRadius, sparkSize]
  );

  useEffect(
    () => () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    },
    []
  );

  const spawnSparks = useCallback(
    (x: number, y: number) => {
      if (!canvasRef.current) return;
      // Animation is decorative; skip it entirely when motion is reduced.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const now = performance.now();
      for (let i = 0; i < sparkCount; i += 1) {
        sparksRef.current.push({
          x,
          y,
          angle: (2 * Math.PI * i) / sparkCount,
          startTime: now,
        });
      }

      if (animationRef.current === null) {
        animationRef.current = requestAnimationFrame(draw);
      }
    },
    [draw, sparkCount]
  );

  return { canvasRef, spawnSparks };
}

/**
 * Canvas click-spark effect from React Bits.
 *
 * The wrapper captures clicks as they bubble from children and paints radial
 * spark lines on an overlay canvas. The canvas is `pointer-events-none` and
 * z-indexed above the children so sparks stay visible over opaque content
 * without blocking interaction.
 */
export function ClickSpark({
  sparkColor = "#fff",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1,
  className,
  children,
}: ClickSparkProps) {
  const { canvasRef, spawnSparks } = useSparkPainter({
    sparkColor,
    sparkSize,
    sparkRadius,
    sparkCount,
    duration,
    easing,
    extraScale,
  });

  // Size the backing store to the wrapper while keeping spark coordinates in
  // CSS pixels. ResizeObserver covers rotations, split view and route swaps.
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    let resizeTimeout: number | undefined;

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const nextWidth = Math.round(width * dpr);
      const nextHeight = Math.round(height * dpr);
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 100);
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(parent);
    resizeCanvas();

    return () => {
      observer.disconnect();
      window.clearTimeout(resizeTimeout);
    };
  }, []);

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      spawnSparks(event.clientX - rect.left, event.clientY - rect.top);
    },
    [canvasRef, spawnSparks]
  );

  return (
    <div className={cn("relative isolate h-full w-full", className)} onClick={handleClick}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] block h-full w-full select-none"
      />
      {children}
    </div>
  );
}

/** Viewport-level click sparks for every route, including light pages. */
export function GlobalClickSpark({
  sparkColor = "#ffffff",
  sparkSize = 8,
  sparkRadius = 18,
  sparkCount = 10,
  duration = 450,
  easing = "ease-out",
  extraScale = 1,
}: Omit<ClickSparkProps, "className" | "children">) {
  const { canvasRef, spawnSparks } = useSparkPainter({
    sparkColor,
    sparkSize,
    sparkRadius,
    sparkCount,
    duration,
    easing,
    extraScale,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout: number | undefined;
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 100);
    };
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.detail === 0) return;
      spawnSparks(event.clientX, event.clientY);
    };

    resizeCanvas();
    window.addEventListener("resize", handleResize);
    window.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick, true);
      window.clearTimeout(resizeTimeout);
    };
  }, [canvasRef, spawnSparks]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[10000] block h-full w-full select-none mix-blend-difference"
    />
  );
}
