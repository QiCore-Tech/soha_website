import styles from "./oyscat-pixel-scenes.module.css";

type SceneKind = "design" | "modules" | "creation" | "workspace" | "connect";

function Spark({ x, y }: { x: number; y: number }) {
  return <path transform={`translate(${x} ${y})`} d="M6 0h4v6h6v4h-6v6H6v-6H0V6h6Z" fill="#a6dd3f" className={styles.spark} />;
}

function Cursor() {
  return <g className={styles.cursor}><path d="M0 0v28h6v-8h5l7 12 6-4-7-12h11Z" fill="#242820" /><path d="M4 8v12l4-5h8Z" fill="#a6dd3f" /></g>;
}

function Lamp() {
  return <g><path d="M8 0h20v4h8v8h4v20h-4v8h-8v8H12v-8H4v-8H0V12h4V4h4Z" fill="#242820" /><path className={styles.lamp} d="M8 8h24v8h4v12h-8v12H12V28H4V16h4Z" fill="#a6dd3f" /><path d="M12 48h16v4H12zm4 6h8v4h-8Z" fill="#242820" /></g>;
}

function Gear() {
  return <g className={styles.gear}><path d="M-6-22H6v6h6l4-4 8 8-4 4v4h6V6h-6v6l4 4-8 8-4-4H6v6H-6v-6h-6l-4 4-8-8 4-4V6h-6V-6h6v-6l-4-4 8-8 4 4h6Z" fill="#242820" /><path d="M-6-10H6v4h4V6H6v4H-6V6h-4V-6h4Z" fill="#eae8ec" /></g>;
}

function Rover() {
  return <g className={styles.rover}>
    <path d="M0 24h8V8h8v8h20V8h8v16h8v28H0Z" fill="#242820" />
    <path d="M10 30h6v8h-6zm24 0h6v8h-6Z" fill="#a6dd3f" />
    <path d="M4 42h8v3H4zm36 0h8v3h-8Z" fill="#a6dd3f" />
    <path d="M4 54h12v12H4zm32 0h12v12H36Z" fill="#242820" />
    <path d="M8 58h4v4H8zm32 0h4v4h-4Z" fill="#a6dd3f" />
    <path d="M52 42h8V28h6v20H52Z" fill="#91a99a" />
  </g>;
}

export function OyscatPixelScene({ kind, compact = false }: { kind: SceneKind; compact?: boolean }) {
  return <div className={`${styles.scene} ${compact ? styles.compact : ""}`} data-scene={kind} aria-hidden="true">
    <svg viewBox="0 0 240 128" shapeRendering="crispEdges" focusable="false">
      <path d="M8 112h224" stroke="#242820" strokeOpacity=".15" strokeWidth="2" />
      {kind === "design" && <>
        <path d="M24 20h140v76H24Z" fill="#242820" />
        <path d="M28 24h132v68H28Z" fill="#f6f5f0" />
        <path d="M28 24h132v12H28Z" fill="#a6dd3f" />
        <path d="M34 28h4v4h-4zm8 0h4v4h-4zm8 0h4v4h-4Z" fill="#242820" />
        <path d="M80 96h24v10h20v4H60v-4h20Z" fill="#242820" />
        <path d="M36 44h24v4H36zm0 10h16v4H36zm0 10h20v4H36Z" fill="#b6beb0" />
        <g className={styles.buildOne}><path d="M80 64h24v24H80Z" fill="#a6dd3f" /><path d="M84 68h16v16H84Z" fill="#c6ef8e" /></g>
        <g className={styles.buildTwo}><path d="M108 64h24v24h-24Z" fill="#91a99a" /><path d="M112 68h16v16h-16Z" fill="#bbcdbd" /></g>
        <g className={styles.buildThree}><path d="M80 36h24v24H80Z" fill="#242820" /><path d="M88 44h8v8h-8Z" fill="#a6dd3f" /></g>
        <Cursor />
        <g transform="translate(184 38)"><Spark x={0} y={0} /></g>
        <path className={styles.confirm} d="M182 84h6v6h6V78h6v-6h6v12h-6v12h-12v-6h-6Z" fill="#6c942c" />
      </>}
      {kind === "modules" && <>
        <path d="M46 62h38v18h54V54h30" fill="none" stroke="#8b9383" strokeWidth="4" />
        <path className={styles.signal} d="M46 62h38v18h54V54h30" fill="none" stroke="#a6dd3f" strokeWidth="4" strokeDasharray="8 160" />
        <g className={styles.plug}><path d="M12 36h42v52H12Z" fill="#242820" /><path d="M16 40h34v44H16Z" fill="#91a99a" /><path d="M26 48h14v8H26zm0 16h14v8H26Z" fill="#242820" /><path d="M54 54h8v4h8v8h-8v4h-8Z" fill="#242820" /></g>
        <path d="M98 46h28v28H98Z" fill="#242820" /><path d="M106 54h12v12h-12Z" fill="#a6dd3f" />
        <path d="M104 40h4v6h-4zm12 0h4v6h-4zm-12 34h4v6h-4zm12 0h4v6h-4Z" fill="#242820" />
        <g transform="translate(174 24)"><Lamp /></g>
        <path className={styles.rays} d="M186 10h4v8h-4zm24 0h4v8h-4zm12 22h10v4h-10zm-58 0h8v4h-8Z" fill="#a6dd3f" />
        <path d="M18 102h28v4H18zm80 0h28v4H98zm82 0h28v4h-28Z" fill="#b6beb0" />
      </>}
      {kind === "workspace" && <>
        <path d="M24 104h190" stroke="#b6beb0" strokeWidth="2" />
        <path d="M30 20h100v76H30Z" fill="#f6f5f0" stroke="#242820" strokeWidth="3" />
        <path d="M42 32h40v4H42zm0 10h28v4H42Z" fill="#b6beb0" />
        <g className={styles.buildOne}><path d="M50 62h24v24H50Z" fill="#a6dd3f" /></g>
        <g className={styles.buildTwo}><path d="M78 62h24v24H78Z" fill="#91a99a" /></g>
        <g className={styles.pencil}><path d="M0 0h8v38H0Z" fill="#242820" /><path d="M2 6h4v26H2Z" fill="#a6dd3f" /><path d="M0 38h8l-4 8Z" fill="#242820" /></g>
        <g transform="translate(185 70)"><Gear /></g>
        <Spark x={164} y={20} />
      </>}
      {kind === "connect" && <>
        <path d="M14 104h214" stroke="#b6beb0" strokeWidth="2" />
        <g className={styles.snapLeft}><path d="M22 40h48v48H22Z" fill="#242820" /><path d="M26 44h40v40H26Z" fill="#91a99a" /><path d="M70 54h8v20h-8Z" fill="#242820" /><path d="M34 52h24v8H34zm0 16h16v8H34Z" fill="#242820" /></g>
        <path d="M94 40h48v48H94Z" fill="#242820" /><path d="M98 44h40v40H98Z" fill="#a6dd3f" /><path d="M106 54h24v20h-24Z" fill="#242820" /><path d="M114 58h8v12h-8Z" fill="#a6dd3f" />
        <g className={styles.snapRight}><path d="M166 40h48v48h-48Z" fill="#242820" /><path d="M170 44h40v40h-40Z" fill="#b8c6b5" /><path d="M158 54h8v20h-8Z" fill="#242820" /><path d="M182 50h16v4h4v20h-4v4h-16v-4h-4V54h4Z" fill="#242820" /><path className={styles.lamp} d="M186 58h8v12h-8Z" fill="#a6dd3f" /></g>
        <path className={styles.confirm} d="M108 18h6v6h6V12h6v18h-18Z" fill="#6c942c" />
      </>}
      {kind === "creation" && <>
        <g transform="translate(38 54)"><Gear /></g>
        <path d="M28 94h20v4H28Z" fill="#b6beb0" />
        <g transform="translate(100 30)"><Rover /></g>
        <Spark x={182} y={26} />
        <path className={styles.speed} d="M78 60h12v4H78zm-8 14h20v4H70zm8 14h12v4H78Z" fill="#91a99a" />
        <path d="M186 94h14v-8h14v-8h14v28h-42Z" fill="#a6dd3f" />
      </>}
    </svg>
  </div>;
}
