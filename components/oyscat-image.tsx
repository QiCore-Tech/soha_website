"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./oyscat-image.module.css";

type Props = { src: string; zh: string; en: string; large?: boolean; showPrompt?: boolean };

export function OyscatImage({ src, zh, en, large = false, showPrompt = true }: Props) {
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [visible, setVisible] = useState(false);
  const [viewed, setViewed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = trigger.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open || !dialog.current) return;
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return <>
    <button ref={trigger} type="button" className={styles.preview} data-product-image data-large={large} data-in-view={visible} data-viewed={viewed}
      aria-haspopup="dialog" onClick={() => { setViewed(true); setOpen(true); }}>
      <img src={src} alt="" decoding="async" />
      {showPrompt && <span className={styles.prompt}>
        <span className={styles.cat} aria-hidden="true" />
        <span data-lang="zh">{viewed ? "再次查看" : "点击探索"}</span>
        <span data-lang="en">{viewed ? "View again" : "Explore"}</span>
        <span aria-hidden="true">↗</span>
      </span>}
      <span className={styles.srOnly}><span data-lang="zh">{zh}</span><span data-lang="en">{en}</span></span>
    </button>
    {open && createPortal(
      <dialog ref={dialog} className={styles.viewer} aria-labelledby={titleId}
        onCancel={() => setOpen(false)} onClose={() => setOpen(false)}
        onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div className={styles.sheet}>
          <header><h2 id={titleId}><span data-lang="zh">{zh}</span><span data-lang="en">{en}</span></h2>
            <button type="button" autoFocus onClick={() => setOpen(false)}><span data-lang="zh">关闭</span><span data-lang="en">Close</span> ×</button>
          </header>
          <img src={src} alt="" />
        </div>
      </dialog>, document.body)}
  </>;
}
