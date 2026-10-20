"use client";

import { useEffect, useRef } from "react";
import { useContentScrollReveal } from "@/hooks/use-content-scroll-reveal";

export function SiteScrollReveal() {
  const rootRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    rootRef.current = document.body;
    return () => { rootRef.current = null; };
  }, []);
  useContentScrollReveal(rootRef, { enabled: true });
  return null;
}
