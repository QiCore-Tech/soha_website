
import { messages } from "@/i18n/messages";
import { BilingualText as Bi } from "@/components/bilingual-text";
import type { LocalizedText } from "@/types/locale";
export type MarketingHeroArtVariant = "system" | "signal" | "workbench";

const artMeta: Record<MarketingHeroArtVariant, { index: LocalizedText; note: LocalizedText; action: LocalizedText; label: LocalizedText }> = {
  system: { index: messages.marketingHeroArt.qicoreSystem01, note: messages.marketingHeroArt.ideaPrototypeReality, action: messages.marketingHeroArt.ideaReality, label: messages.marketingHeroArt.interactWithTheQicoreCreationSystem },
  signal: { index: messages.marketingHeroArt.qicoreSignal02, note: messages.marketingHeroArt.researchReleaseUpdate, action: messages.marketingHeroArt.followTheSignal, label: messages.marketingHeroArt.tuneTheQicoreNewsSignal },
  workbench: { index: messages.marketingHeroArt.qicoreWorkbench03, note: messages.marketingHeroArt.designCodeMake, action: messages.marketingHeroArt.createTogether, label: messages.marketingHeroArt.bringTheQicoreTeamToTheWorkbench }
};

export function MarketingHeroArt({ variant }: { variant: MarketingHeroArtVariant }) {
  return (
    <button
      type="button"
      className={`company-hero-art themed-hero-art hero-art-${variant}`}
      data-qicore-waterfall="1"
      data-hero-art-variant={variant}
      aria-label={artMeta[variant].label.zh}
      data-aria-label-zh={artMeta[variant].label.zh}
      data-aria-label-en={artMeta[variant].label.en}
      aria-pressed="false"
    >
      <div className="company-blueprint-card hero-blueprint-card">
        <span className="hero-art-index"><Bi {...artMeta[variant].index} /></span>
        <span className="hero-art-note"><Bi {...artMeta[variant].note} /></span>
        <span className="hero-art-action"><Bi {...artMeta[variant].action} /></span>
        <span className="hero-art-crop crop-a" />
        <span className="hero-art-crop crop-b" />

        {variant === "system" && <SystemArt />}
        {variant === "signal" && <SignalArt />}
        {variant === "workbench" && <WorkbenchArt />}
      </div>
    </button>
  );
}

function SystemArt() {
  return (
    <div className="hero-system-diagram">
      <svg className="hero-art-wires hero-art-far" viewBox="0 0 400 400">
        <path d="M48 305 C105 305 112 236 169 236 S238 166 287 166 S326 101 354 101" />
        <path className="wire-muted" d="M72 93 L72 305 M169 236 L169 342 M287 166 L354 166" />
      </svg>
      <span className="system-node node-idea"><i /><span data-lang="zh">{messages.marketingHeroArt.text01Idea.zh}</span><span data-lang="en">{messages.marketingHeroArt.text01Idea.en}</span></span>
      <span className="system-node node-prototype"><i /><span data-lang="zh">{messages.marketingHeroArt.text02Prototype.zh}</span><span data-lang="en">{messages.marketingHeroArt.text02Prototype.en}</span></span>
      <span className="system-node node-reality"><i /><span data-lang="zh">{messages.marketingHeroArt.text03Reality.zh}</span><span data-lang="en">{messages.marketingHeroArt.text03Reality.en}</span></span>
      <div className="system-assembly hero-art-near">
        <span className="assembly-block block-red" />
        <span className="assembly-block block-green" />
        <span className="assembly-block block-yellow" />
        <span className="assembly-block block-blue" />
        <span className="assembly-core">{messages.marketingHeroArt.q.zh}</span>
      </div>
      <div className="system-captions hero-art-mid">
        <span><span data-lang="zh">{messages.marketingHeroArt.form.zh}</span><span data-lang="en">{messages.marketingHeroArt.form.en}</span></span><span><span data-lang="zh">{messages.marketingHeroArt.logic.zh}</span><span data-lang="en">{messages.marketingHeroArt.logic.en}</span></span><span><span data-lang="zh">{messages.marketingHeroArt.motion.zh}</span><span data-lang="en">{messages.marketingHeroArt.motion.en}</span></span>
      </div>
    </div>
  );
}

function SignalArt() {
  return (
    <div className="hero-signal-diagram">
      <svg className="signal-plot hero-art-far" viewBox="0 0 400 260">
        <path className="signal-grid" d="M20 52H380 M20 104H380 M20 156H380 M20 208H380 M92 20V240 M164 20V240 M236 20V240 M308 20V240" />
        <path className="signal-line signal-line-back" d="M20 168 C54 168 55 116 90 116 S128 194 164 194 S199 72 236 72 S270 145 307 145 S343 101 380 101" />
        <path className="signal-line" d="M20 150 C55 150 55 132 91 132 S128 164 164 164 S199 94 236 94 S272 126 308 126 S344 84 380 84" />
      </svg>
      <span className="signal-scan hero-art-near" />
      <div className="signal-readout hero-art-mid">
        <span><span data-lang="zh">{messages.marketingHeroArt.activeChannels.zh}</span><span data-lang="en">{messages.marketingHeroArt.activeChannels.en}</span></span><strong>{messages.marketingHeroArt.value04.zh}</strong><i><span data-lang="zh">{messages.marketingHeroArt.live.zh}</span><span data-lang="en">{messages.marketingHeroArt.live.en}</span></i>
      </div>
      <div className="signal-channels">
        <span><i /><span data-lang="zh">{messages.marketingHeroArt.rD.zh}</span><span data-lang="en">{messages.marketingHeroArt.rD.en}</span></span><span><i /><span data-lang="zh">{messages.marketingHeroArt.release.zh}</span><span data-lang="en">{messages.marketingHeroArt.release.en}</span></span><span><i /><span data-lang="zh">{messages.marketingHeroArt.update.zh}</span><span data-lang="en">{messages.marketingHeroArt.update.en}</span></span><span><i /><span data-lang="zh">{messages.marketingHeroArt.story.zh}</span><span data-lang="en">{messages.marketingHeroArt.story.en}</span></span>
      </div>
      <span className="signal-stamp hero-art-near"><span data-lang="zh">{messages.marketingHeroArt.recording.zh}</span><span data-lang="en">{messages.marketingHeroArt.recording.en}</span><br /><span data-lang="zh">{messages.marketingHeroArt.creation.zh}</span><span data-lang="en">{messages.marketingHeroArt.creation.en}</span></span>
    </div>
  );
}

function WorkbenchArt() {
  return (
    <div className="hero-workbench-diagram">
      <svg className="workbench-links hero-art-far" viewBox="0 0 400 400">
        <path d="M96 112 C150 112 156 172 201 201" />
        <path d="M305 108 C252 108 247 172 201 201" />
        <path d="M104 302 C154 302 160 242 201 201" />
        <circle cx="201" cy="201" r="67" />
      </svg>
      <div className="workbench-role role-design hero-art-mid"><span><span data-lang="zh">{messages.marketingHeroArt.design.zh}</span><span data-lang="en">{messages.marketingHeroArt.design.en}</span></span><strong>△</strong></div>
      <div className="workbench-role role-code hero-art-mid"><span><span data-lang="zh">{messages.marketingHeroArt.code.zh}</span><span data-lang="en">{messages.marketingHeroArt.code.en}</span></span><strong>{"{}"}</strong></div>
      <div className="workbench-role role-make hero-art-mid"><span><span data-lang="zh">{messages.marketingHeroArt.make.zh}</span><span data-lang="en">{messages.marketingHeroArt.make.en}</span></span><strong>＋</strong></div>
      <div className="workbench-prototype hero-art-near">
        <svg viewBox="0 0 90 80" role="presentation">
          <polygon className="prototype-top" points="4,26 25,6 84,6 63,26" />
          <polygon className="prototype-front" points="4,26 63,26 63,73 4,73" />
          <polygon className="prototype-side" points="63,26 84,6 84,53 63,73" />
          <text x="33.5" y="55">{messages.marketingHeroArt.q.zh}</text>
        </svg>
      </div>
      <span className="workbench-pencil hero-art-near" />
      <span className="workbench-note"><span data-lang="zh">{messages.marketingHeroArt.oneTable.zh}</span><span data-lang="en">{messages.marketingHeroArt.oneTable.en}</span><br /><span data-lang="zh">{messages.marketingHeroArt.manyDisciplines.zh}</span><span data-lang="en">{messages.marketingHeroArt.manyDisciplines.en}</span></span>
    </div>
  );
}
