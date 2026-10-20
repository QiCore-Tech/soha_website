import type { ReactNode } from "react";

export function BilingualText({ zh, en }: { zh: ReactNode; en: ReactNode }) {
  return <><span data-lang="zh">{zh}</span><span data-lang="en">{en}</span></>;
}
