import { messages } from "@/i18n/messages";

// Gradient stand-ins for artwork that has not been shot yet. Swap a block for
// an <img> with the same size classes once the final image exists.
const tones = {
  graphite: { gradient: "from-[#1b1f1c] via-[#26331f] to-[#5f9e2e]", dark: true },
  signal: { gradient: "from-[#b6f27a] via-[#5fb82a] to-[#1f3b16]", dark: true },
  slate: { gradient: "from-[#3a403b] via-[#262b27] to-[#151816]", dark: true },
  ink: { gradient: "from-[#3a3f3c] to-[#151816]", dark: true },
  lime: { gradient: "from-[#e1f8c2] to-[#8be33a]", dark: false },
  mist: { gradient: "from-[#f1f8e7] to-[#cfe8b0]", dark: false },
  stone: { gradient: "from-[#ecede8] to-[#c4c9bd]", dark: false },
  sun: { gradient: "from-[#f6f2e4] via-[#e2ebc9] to-[#a3d46c]", dark: false },
} as const;

export type HomePlaceholderTone = keyof typeof tones;

type HomePlaceholderProps = {
  tone: HomePlaceholderTone;
  /** Marks an image slot (as opposed to a purely decorative block). */
  label?: boolean;
  className?: string;
};

export function HomePlaceholder({ tone, label, className = "" }: HomePlaceholderProps) {
  const { gradient, dark } = tones[tone];
  return (
    <div
      aria-hidden="true"
      data-home-placeholder={tone}
      className={`relative overflow-hidden rounded-[20px] bg-linear-to-br ${gradient} shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] ${className}`}
    >
      {label && (
        <span className={`absolute top-4 left-4 font-mono text-[10px] tracking-[0.18em] ${dark ? "text-white/55" : "text-black/40"}`}>
          <span data-lang="zh">{messages.homeScreens.imagePlaceholder.zh}</span><span data-lang="en">{messages.homeScreens.imagePlaceholder.en}</span>
        </span>
      )}
    </div>
  );
}
