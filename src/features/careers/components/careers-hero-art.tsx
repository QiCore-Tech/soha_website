import { messages } from "@/i18n/messages";
import { BilingualText as Bi } from "@/components/bilingual-text";

/**
 * Careers hero pegboard in three tones only: white, off-white and light grey.
 * Beads lighten corner to corner; every open role leaves a dashed empty seat.
 * Purely decorative, so it stays a server component with no state or listeners.
 */

const WHITE = "#ffffff";
const OFF_WHITE = "#f3f3f1";
const LIGHT_GRAY = "#e0e0dd";
const TEXT = "#8e8e8b";

const COLS = 9;
const ROWS = 7;
const PITCH = 40;
const PAD = 6;
const BEAD_R = 15;
const HOLE_R = 4.5;
const BOARD_W = PAD * 2 + PITCH * COLS;
const BOARD_H = PAD * 2 + PITCH * ROWS;

// [row, col] seats freed in order, one per open role; seats past the role count stay beaded.
const OPEN_SEATS: [number, number][] = [[1, 2], [2, 4], [3, 2], [4, 5], [5, 7], [0, 4], [6, 4], [2, 7]];

function Bead({ row, col, cx, cy }: { row: number; col: number; cx: number; cy: number }) {
  const step = row + col;

  if (step <= 4) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={BEAD_R} fill={LIGHT_GRAY} />
        <circle cx={cx} cy={cy} r={HOLE_R} fill={WHITE} />
      </g>
    );
  }

  if (step <= 8) {
    return (
      <g>
        <circle cx={cx + 1.8} cy={cy + 2.4} r={BEAD_R} fill={LIGHT_GRAY} />
        <circle cx={cx} cy={cy} r={BEAD_R} fill={OFF_WHITE} />
        <circle cx={cx} cy={cy} r={HOLE_R} fill={WHITE} />
      </g>
    );
  }

  return (
    <g fill={WHITE} stroke={LIGHT_GRAY}>
      <circle cx={cx} cy={cy} r={BEAD_R - 0.6} strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={HOLE_R} strokeWidth="1" />
    </g>
  );
}

export function CareersHeroArt({ openRoles = 0 }: { openRoles?: number }) {
  const seatOrder = new Map(
    OPEN_SEATS.slice(0, Math.max(0, openRoles)).map(([row, col], order) => [`${row}:${col}`, order])
  );

  return (
    <div
      className="relative aspect-square w-full max-[900px]:mx-auto! max-[900px]:mt-2! max-[900px]:w-[min(78vw,420px)]"
      aria-hidden="true"
    >
      <div
        className="absolute inset-[5%] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3.5 overflow-hidden rounded-[22px] border bg-white px-[clamp(16px,5%,22px)]! pt-5! pb-[18px]! font-mono text-[10px] tracking-[0.14em]"
        style={{ borderColor: LIGHT_GRAY, boxShadow: `12px 14px 0 ${OFF_WHITE}`, color: TEXT }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span><Bi {...messages.careersHeroArt.teamMap2026} /></span>
          <span><Bi {...messages.careersHeroArt.scale11} /></span>
        </div>

        <svg className="block size-full" viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}>
          {Array.from({ length: ROWS * COLS }, (_, index) => {
            const row = Math.floor(index / COLS);
            const col = index % COLS;
            const key = `${row}:${col}`;
            const cx = PAD + PITCH * col + PITCH / 2;
            const cy = PAD + PITCH * row + PITCH / 2;
            const seat = seatOrder.get(key);

            if (seat === undefined) return <Bead key={key} row={row} col={col} cx={cx} cy={cy} />;

            return (
              <g key={key} stroke={LIGHT_GRAY}>
                <circle
                  className="animate-[careers-seat-march_3s_linear_infinite] motion-reduce:animate-none"
                  style={{ animationDelay: `${seat * -0.6}s` }}
                  cx={cx}
                  cy={cy}
                  r={BEAD_R - 1}
                  fill={WHITE}
                  strokeWidth="1.5"
                  strokeDasharray="2.4 1.6"
                  pathLength={48}
                />
                <path d={`M${cx - 5} ${cy}h10M${cx} ${cy - 5}v10`} strokeWidth="1.6" strokeLinecap="round" />
              </g>
            );
          })}
        </svg>

        <p className="flex items-baseline gap-2.5">
          <strong className="text-[34px] leading-none font-normal tracking-[-0.06em]">{openRoles}</strong>
          <span><Bi {...messages.careersHeroArt.openRoles} /></span>
        </p>
      </div>
    </div>
  );
}
