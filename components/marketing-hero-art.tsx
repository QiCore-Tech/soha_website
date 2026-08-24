export type MarketingHeroArtVariant = "system" | "signal" | "workbench";

const artMeta: Record<MarketingHeroArtVariant, { index: string; note: string; action: string; label: string }> = {
  system: { index: "QICORE / SYSTEM 01", note: "IDEA · PROTOTYPE · REALITY", action: "IDEA → REALITY", label: "Interact with the QiCore creation system" },
  signal: { index: "QICORE / SIGNAL 02", note: "RESEARCH · RELEASE · UPDATE", action: "FOLLOW THE SIGNAL", label: "Tune the QiCore news signal" },
  workbench: { index: "QICORE / WORKBENCH 03", note: "DESIGN · CODE · MAKE", action: "CREATE TOGETHER", label: "Bring the QiCore team to the workbench" }
};

export function MarketingHeroArt({ variant }: { variant: MarketingHeroArtVariant }) {
  return (
    <button
      type="button"
      className={`company-hero-art themed-hero-art hero-art-${variant}`}
      data-qicore-waterfall="1"
      data-hero-art-variant={variant}
      aria-label={artMeta[variant].label}
      aria-pressed="false"
    >
      <div className="company-blueprint-card hero-blueprint-card">
        <span className="hero-art-index">{artMeta[variant].index}</span>
        <span className="hero-art-note">{artMeta[variant].note}</span>
        <span className="hero-art-action">{artMeta[variant].action}</span>
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
      <span className="system-node node-idea"><i />01 / IDEA</span>
      <span className="system-node node-prototype"><i />02 / PROTOTYPE</span>
      <span className="system-node node-reality"><i />03 / REALITY</span>
      <div className="system-assembly hero-art-near">
        <span className="assembly-block block-red" />
        <span className="assembly-block block-green" />
        <span className="assembly-block block-yellow" />
        <span className="assembly-block block-blue" />
        <span className="assembly-core">Q</span>
      </div>
      <div className="system-captions hero-art-mid">
        <span>FORM</span><span>LOGIC</span><span>MOTION</span>
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
        <span>ACTIVE CHANNELS</span><strong>04</strong><i>LIVE</i>
      </div>
      <div className="signal-channels">
        <span><i />R&amp;D</span><span><i />RELEASE</span><span><i />UPDATE</span><span><i />STORY</span>
      </div>
      <span className="signal-stamp hero-art-near">RECORDING<br />CREATION</span>
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
      <div className="workbench-role role-design hero-art-mid"><span>DESIGN</span><strong>△</strong></div>
      <div className="workbench-role role-code hero-art-mid"><span>CODE</span><strong>{"{}"}</strong></div>
      <div className="workbench-role role-make hero-art-mid"><span>MAKE</span><strong>＋</strong></div>
      <div className="workbench-prototype hero-art-near">
        <svg viewBox="0 0 90 80" role="presentation">
          <polygon className="prototype-top" points="4,26 25,6 84,6 63,26" />
          <polygon className="prototype-front" points="4,26 63,26 63,73 4,73" />
          <polygon className="prototype-side" points="63,26 84,6 84,53 63,73" />
          <text x="33.5" y="55">Q</text>
        </svg>
      </div>
      <span className="workbench-pencil hero-art-near" />
      <span className="workbench-note">ONE TABLE<br />MANY DISCIPLINES</span>
    </div>
  );
}
