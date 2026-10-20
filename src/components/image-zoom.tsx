"use client";

import type { ReactNode } from "react";
import type { LocalizedText } from "@/types/locale";
import { useLocale } from "@/hooks/use-locale";

import {
  Dialog,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import styles from "./image-zoom.module.css";

type ImageZoomProps = {
  src: string;
  alt: string | LocalizedText;
  /** Accessible dialog title. Falls back to `alt`. */
  title?: string;
  /** Name shown as the plate heading (bilingual node). */
  name?: ReactNode;
  /** Role shown under the name (bilingual node). */
  role?: ReactNode;
  /** Short introduction shown beside the portrait (bilingual node). */
  bio?: ReactNode;
  /** Class applied to the clickable trigger (the thumbnail wrapper). */
  className?: string;
  children: ReactNode;
};

export function ImageZoom({ src, alt, title, name, role, bio, className, children }: ImageZoomProps) {
  const { locale } = useLocale();
  const labels = typeof alt === "string" ? { zh: alt, en: alt } : alt;
  return (
    <Dialog>
      <DialogTrigger className={cn(className)} aria-label={labels[locale]} data-aria-label-zh={labels.zh} data-aria-label-en={labels.en}>
        {children}
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className={styles.overlay} />
        <DialogPopup className={styles.viewer}>
          <figure className={styles.plate}>
            <div className={styles.media}>
              {/* Local static assets do not need an image optimization server. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={labels[locale]} data-alt-zh={labels.zh} data-alt-en={labels.en} decoding="async" />
            </div>
            <figcaption className={styles.caption}>
              <DialogTitle className={styles.name}>{name ?? title ?? labels[locale]}</DialogTitle>
              {role ? <p className={styles.role}>{role}</p> : null}
              {bio ? <p className={styles.bio}>{bio}</p> : null}
            </figcaption>
          </figure>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
