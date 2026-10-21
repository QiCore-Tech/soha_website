import type { CSSProperties } from "react";
import { messages } from "@/i18n/messages";
import { BilingualText as Bi } from "@/components/bilingual-text";

/**
 * 404 pegboard: "404" set in ink beads, one bead short. Its seat is a dashed
 * outline and the bead itself has dropped loose to the bottom of the board.
 * Purely decorative, so it stays a server component with no state or listeners.
 */

const WHITE = "#ffffff";
const OFF_WHITE = "#f3f3f1";
const LIGHT_GRAY = "#e0e0dd";
const INK = "#111111";
const TEXT = "#8e8e8b";

// 5×7 bead glyphs, one string per row; "#" is a bead.
const GLYPHS: Record<string, string[]> = {
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."]
};
const GLYPH_W = 5;
const TEXT_ROW = 1;
const TEXT_COL = 1;

// One empty column around and between the digits, two spare rows below them.
const COLS = TEXT_COL * 2 + GLYPH_W * 3 + 2;
const ROWS = TEXT_ROW + 7 + 2;
const PITCH = 20;
const PAD = 4;
const BEAD_R = 7.4;
const HOLE_R = 2.4;
const PIN_R = 1.6;
const BOARD_W = PAD * 2 + PITCH * COLS;
const BOARD_H = PAD * 2 + PITCH * ROWS;

const BEADS = new Set(
  [..."404"].flatMap((digit, index) => GLYPHS[digit].flatMap((line, row) => [...line].flatMap((cell, col) => (
    cell === "#" ? [`${TEXT_ROW + row}:${TEXT_COL + index * (GLYPH_W + 1) + col}`] : []
  ))))
);

// Bottom-right bead of the middle 0; it rests off the grid in the spare rows.
const SEAT = { row: 7, col: 10 };
const FALLEN = { row: 8.6, col: 11.5 };

function center({ row, col }: { row: number; col: number }) {
  return { cx: PAD + PITCH * col + PITCH / 2, cy: PAD + PITCH * row + PITCH / 2 };
}

function Bead({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx + 1} cy={cy + 1.4} r={BEAD_R} fill={LIGHT_GRAY} />
      <circle cx={cx} cy={cy} r={BEAD_R} fill={INK} />
      <circle cx={cx} cy={cy} r={HOLE_R} fill={WHITE} />
    </g>
  );
}

export function NotFoundPegboard() {
  const seat = center(SEAT);
  const fallen = center(FALLEN);

  return (
    <div className="relative w-full max-w-[560px]" aria-hidden="true">
      <div
        className="grid gap-3.5 rounded-[22px] border bg-white px-[clamp(16px,5%,22px)] pt-5 pb-[18px] font-mono text-[10px] tracking-[0.14em]"
        style={{ borderColor: LIGHT_GRAY, boxShadow: `12px 14px 0 ${OFF_WHITE}`, color: TEXT }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span><Bi {...messages.site.notFound.boardLabel} /></span>
          <span><Bi {...messages.site.notFound.boardMissing} /></span>
        </div>

        <svg className="block h-auto w-full" viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}>
          {Array.from({ length: ROWS * COLS }, (_, index) => {
            const row = Math.floor(index / COLS);
            const col = index % COLS;
            const key = `${row}:${col}`;
            const { cx, cy } = center({ row, col });

            if (row === SEAT.row && col === SEAT.col) {
              return (
                <circle
                  key={key}
                  className="animate-[careers-seat-march_3s_linear_infinite] motion-reduce:animate-none"
                  cx={cx}
                  cy={cy}
                  r={BEAD_R - 0.6}
                  fill={WHITE}
                  stroke={TEXT}
                  strokeWidth="1.2"
                  strokeDasharray="2.4 1.6"
                  pathLength={48}
                />
              );
            }
            if (BEADS.has(key)) return <Bead key={key} cx={cx} cy={cy} />;
            return <circle key={key} cx={cx} cy={cy} r={PIN_R} fill={LIGHT_GRAY} />;
          })}

          {/* Drawn last so it passes over the board; it falls once from its seat on load. */}
          <g
            className="animate-[not-found-bead-drop_900ms_450ms_both] motion-reduce:animate-none"
            style={{
              "--bead-from-x": `${seat.cx - fallen.cx}px`,
              "--bead-from-y": `${seat.cy - fallen.cy}px`
            } as CSSProperties}
          >
            <Bead cx={fallen.cx} cy={fallen.cy} />
          </g>
        </svg>
      </div>
    </div>
  );
}
