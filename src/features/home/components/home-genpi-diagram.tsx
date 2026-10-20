"use client";

import { formatMessage, messages } from "@/i18n/messages";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ArrowUp, Check, ChevronDown, Hammer, Plane } from "lucide-react";
import type { Locale, LocalizedText } from "@/types/locale";
import ThoughtLine from "@/components/ui/thought-line";
import { useLocale } from "@/hooks/use-locale";
import { bearingOf, flightStages, moduleOf, runwayHeading, planeModules, planeParts, planeStepStarts, planeSteps, type PlaneModule, type PlanePart } from "../lib/home-genpi-plane";

// Three.js only loads once the demo starts.
const HomeGenpiBuildScene = dynamic(() => import("./home-genpi-build-scene"), { ssr: false, loading: () => null });

type Phase = "idle" | "typing" | "thinking" | "toast" | "building" | "flight" | "done";

const STREAM_MS = 28;
// Characters revealed per tick, so both languages stream at a similar pace.
const STREAM_CHARS: Record<Locale, number> = { zh: 2, en: 5 };
const THOUGHT_GAP_MS = 260;
const TOAST_MS = 1200;
const PART_MS = 110;
const STEP_GAP_MS = 520;
const SETTLE_MS = 1200;
const totalParts = planeParts.length;
const lastStep = planeSteps.length - 1;
const runwayBearing = String(bearingOf(runwayHeading)).padStart(3, "0");

/** The chain of thought the agent streams before building, takeoff included. */
function thoughts(locale: Locale) {
  return [
    messages.homeScreens.genpiThoughtIntent[locale],
    formatMessage(messages.homeScreens.genpiThoughtStructure, locale, { steps: planeSteps.length, modules: totalParts }),
    messages.homeScreens.genpiThoughtMaterials[locale],
    messages.homeScreens.genpiThoughtGear[locale],
    formatMessage(messages.homeScreens.genpiThoughtTakeoff, locale, { heading: runwayBearing }),
  ];
}

const thoughtCount = thoughts("zh").length;

// The build header's glyph; the sparkle belongs to the thinking block alone.
// Hoisted so ThoughtLine's breathing animation does not restart every render.
const buildGlyph = <Hammer strokeWidth={2.25} />;

const rowClass = "relative flex h-7 shrink-0 items-center gap-2 rounded-lg px-2! text-[13px] transition-[opacity,translate,background-color] duration-300 starting:-translate-y-1 starting:opacity-0 data-[current]:bg-[#f4f5f1] motion-reduce:transition-none";

// Human-ish typing: brisk, uneven gaps with the odd short hesitation.
function nextKeyDelay() {
  return 35 + Math.random() * 45 + (Math.random() < 0.08 ? 140 : 0);
}

function tally(parts: PlanePart[]) {
  const counts = new Map<PlaneModule, number>();
  for (const part of parts) counts.set(moduleOf(part), (counts.get(moduleOf(part)) ?? 0) + 1);
  return [...counts];
}

function summary(parts: PlanePart[], locale: Locale) {
  return tally(parts).map(([module, count]) => `${planeModules[module].label[locale]} ×${count}`).join(" · ");
}

/** The step the next module belongs to, i.e. the one being built. */
function stepAt(placed: number) {
  let step = 0;
  while (step < lastStep && planeStepStarts[step + 1] <= placed) step += 1;
  return step;
}

function Swatch({ module }: { module: PlaneModule }) {
  return <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px] border border-black/15" style={{ background: planeModules[module].swatch }} />;
}

type NodeProps = { step: LocalizedText; text: LocalizedText; column: string; panel: string; children: ReactNode };

// Phones read the flow top to bottom; from md up the two nodes sit side by
// side with the connector between their panels and captions on a second row.
// Phones cap the prompt console height so its build log scrolls instead of
// stretching the page. From md up the panel height follows the viewport
// (32rem ≈ heading, captions and screen padding) so the whole GenPI screen
// fits one 16:9 or 16:10 screen.
function Node({ step, text, column, panel, children }: NodeProps) {
  return (
    <>
      <div className={`relative w-full overflow-hidden rounded-[20px] border border-black/8 md:row-start-1 md:h-[clamp(16rem,calc(100svh-32rem),28rem)] ${panel} ${column}`}>
        {children}
      </div>
      <p className={`mt-4! flex items-baseline justify-between gap-4 border-t border-black/10 pt-3! md:row-start-2 ${column}`}>
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#686860] sm:text-xs"><span data-lang="zh">{step.zh}</span><span data-lang="en">{step.en}</span></span>
        <span className="text-right text-base font-medium sm:text-lg"><span data-lang="zh">{text.zh}</span><span data-lang="en">{text.en}</span></span>
      </p>
    </>
  );
}

export function HomeGenpiDiagram({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState(0);
  // One counter drives both sides: the 3D scene and the console read it.
  const [placed, setPlaced] = useState(0);
  const [flightStage, setFlightStage] = useState(0);
  const [thought, setThought] = useState(0);
  // Characters of the current thought streamed so far.
  const [streamed, setStreamed] = useState(0);
  // The thought box folds once thinking ends; this reopens it.
  const [thoughtsExpanded, setThoughtsExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const thoughtsRef = useRef<HTMLDivElement>(null);
  const pointerType = useRef("mouse");
  const roseRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const prompt = messages.homeScreens.genpiPrompt[locale];
  const plan = useMemo(() => thoughts(locale), [locale]);

  // Visibility drives both the one-time start and pausing the 3D render loop.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // Touch devices use tap-to-toggle; mouse devices keep hover-to-preview.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Plays once: phases only ever move forward, so scrolling back never replays.
  useEffect(() => {
    if (!inView || phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setTyped(Number.POSITIVE_INFINITY);
      setThought(thoughtCount - 1);
      setStreamed(Number.POSITIVE_INFINITY);
      setPlaced(totalParts);
      setPhase("done");
      return;
    }
    setPhase("typing");
  }, [inView, phase]);

  useEffect(() => {
    let timer: number | undefined;
    if (phase === "typing") {
      timer = typed < prompt.length
        ? window.setTimeout(() => setTyped(count => count + 1), nextKeyDelay())
        : window.setTimeout(() => setPhase("thinking"), 380);
    } else if (phase === "thinking") {
      // Each thought streams in, then the next one starts; the last plans the takeoff.
      timer = streamed < plan[thought].length
        ? window.setTimeout(() => setStreamed(count => count + STREAM_CHARS[locale]), STREAM_MS)
        : window.setTimeout(() => {
          if (thought < thoughtCount - 1) {
            setThought(index => index + 1);
            setStreamed(0);
          } else setPhase("toast");
        }, THOUGHT_GAP_MS);
    } else if (phase === "toast") {
      timer = window.setTimeout(() => setPhase("building"), TOAST_MS);
    } else if (phase === "building") {
      // A pause at each step boundary lets the console announce the step first.
      timer = placed < totalParts
        ? window.setTimeout(() => setPlaced(count => count + 1), planeStepStarts.includes(placed) ? STEP_GAP_MS : PART_MS)
        : window.setTimeout(() => setPhase("flight"), SETTLE_MS);
    } else if (phase === "flight") {
      // Stage labels follow the same timeline the scene flies.
      const elapsed = flightStage === 0 ? 0 : flightStages[flightStage - 1].until;
      timer = window.setTimeout(
        () => (flightStage < flightStages.length - 1 ? setFlightStage(stage => stage + 1) : setPhase("done")),
        (flightStages[flightStage].until - elapsed) * 1000,
      );
    }
    return () => window.clearTimeout(timer);
  }, [phase, typed, thought, streamed, plan, locale, placed, flightStage, prompt.length]);

  const started = phase !== "idle";
  const sent = phase !== "idle" && phase !== "typing";
  const building = phase === "building";
  const airborne = !reduced && (phase === "flight" || phase === "done");
  const currentStep = stepAt(placed);
  const visibleSteps = building || phase === "flight" || phase === "done" ? currentStep + 1 : 0;
  const flightLabel = phase === "done"
    ? messages.homeScreens.genpiFlightCruise[locale]
    : flightStages[flightStage].label[locale];
  const currentLabel = airborne ? `${messages.homeScreens.genpiFlightRow[locale]} · ${flightLabel}` : planeSteps[currentStep].label[locale];
  const modules = tally(planeParts.slice(0, placed));
  const thinking = phase === "thinking";
  const thoughtsOpen = thinking || thoughtsExpanded;
  const pilot = airborne && hovering;
  const pilotHint = pilot
    ? (canHover ? messages.homeScreens.genpiPilotActive : messages.homeScreens.genpiPilotTapActive)[locale]
    : (canHover ? messages.homeScreens.genpiPilotHint : messages.homeScreens.genpiPilotTapHint)[locale];
  // Thinking has its own block in the console, so the header only tracks the build.
  const headerLabel = phase === "toast"
    ? messages.homeScreens.genpiBuildToast[locale]
    : airborne ? currentLabel : `${messages.homeScreens.genpiBuildWorking[locale]} · ${currentLabel}`;

  // Keep the newest console row in view as rows pile up.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [thought, visibleSteps, airborne, reduced]);

  // A long chain of thought scrolls inside its box: follow the newest text and
  // fade the top edge once earlier thoughts scroll out.
  useEffect(() => {
    const box = thoughtsRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
    box.toggleAttribute("data-overflow", box.scrollHeight > box.clientHeight + 1);
  }, [thought, streamed, plan]);

  return (
    <div ref={rootRef} data-home-genpi-demo className={`grid min-w-0 grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(6rem,0.4fr)_minmax(0,1fr)] ${className}`}>
      <Node step={messages.homeScreens.genpiIntentStep} text={messages.homeScreens.genpiIntent} column="md:col-start-1" panel="max-md:h-[clamp(20rem,calc(100svh-22rem),22rem)] bg-[#f4f5f1]">
        <div className="flex size-full flex-col gap-3 p-3! sm:p-4!">
          {/* A picture of a prompt box: it types by itself and can never take focus. */}
          <div
            role="textbox"
            aria-readonly="true"
            aria-label={messages.homeScreens.genpiPromptLabel[locale]}
            tabIndex={-1}
            data-home-genpi-prompt
            className="pointer-events-none flex min-h-13 shrink-0 items-center gap-3 rounded-2xl border border-black/10 bg-white py-1.5! pr-1.5! pl-4! shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]"
          >
            <span className="min-w-0 flex-1 truncate text-[15px] text-[#151816] sm:text-base">
              {prompt.slice(0, typed)}
              {!sent && <span aria-hidden="true" data-home-genpi-caret className="ml-px inline-block h-[1.1em] w-[1.5px] translate-y-[0.18em] bg-[#151816]" />}
              {typed === 0 && <span className="text-[#9a9e96]">{messages.homeScreens.genpiPromptPlaceholder[locale]}</span>}
            </span>
            <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${sent ? "bg-[#151816] text-white" : "bg-black/5 text-black/30"}`}>
              <ArrowUp size={18} />
            </span>
          </div>

          {/* Build console: every row and count follows the same counter as the 3D scene. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/8 bg-white">
            <div className="flex h-11 shrink-0 items-center border-b border-black/6 px-4!">
              {phase === "idle" || phase === "typing" || phase === "thinking" ? (
                <span className="flex items-center gap-2.5 text-sm text-[#8a8e86]">
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${thinking ? "bg-[#4f632b]" : "bg-black/20"}`} />
                  {(thinking ? messages.homeScreens.genpiBuildReceived : messages.homeScreens.genpiBuildWaiting)[locale]}
                </span>
              ) : (
                <ThoughtLine
                  working={phase !== "done"}
                  label={headerLabel}
                  doneLabel={(reduced ? messages.homeScreens.genpiBuildDoneShort : messages.homeScreens.genpiBuildDone)[locale]}
                  showTimer={!reduced}
                  glyph={buildGlyph}
                  color="#151816"
                  glyphColor="#4f632b"
                  fontSize={14}
                  collapsible={false}
                  collapseOnSettle={false}
                />
              )}
            </div>

            <ol ref={listRef} className="m-0! flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-1.5! [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:overscroll-contain max-md:[scrollbar-color:#c9ccc5_transparent] max-md:[scrollbar-gutter:stable] max-md:[scrollbar-width:thin] max-md:[&::-webkit-scrollbar]:block max-md:[&::-webkit-scrollbar]:w-1.5 max-md:[&::-webkit-scrollbar-thumb]:rounded-full max-md:[&::-webkit-scrollbar-thumb]:bg-[#c9ccc5] max-md:[&::-webkit-scrollbar-track]:bg-transparent">
              {/* One chain-of-thought block: it streams while thinking, then folds to "已思考 Xs" and can be reopened. */}
              {sent && (
                <li className="shrink-0 px-2! pt-1! pb-1.5! transition-[opacity,translate] duration-300 starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none">
                  <div className="relative flex h-7 items-center gap-1">
                    <ThoughtLine
                      working={thinking}
                      label={messages.homeScreens.genpiThinking[locale]}
                      doneLabel={messages.homeScreens.genpiThought[locale]}
                      showTimer={!reduced}
                      glyph="sparkle"
                      color="#151816"
                      glyphColor="#4f632b"
                      fontSize={13}
                      collapsible={false}
                      collapseOnSettle={false}
                    />
                    {!thinking && (
                      <button
                        type="button"
                        aria-expanded={thoughtsOpen}
                        aria-label={messages.homeScreens.genpiThoughtToggle[locale]}
                        onClick={() => setThoughtsExpanded(open => !open)}
                        className="flex size-5 items-center justify-center rounded text-[#9a9e96] after:absolute after:inset-0 after:content-['']"
                      >
                        <ChevronDown size={14} className={`transition-transform duration-300 motion-reduce:transition-none ${thoughtsOpen ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                  <div data-open={thoughtsOpen ? "" : undefined} className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out data-[open]:grid-rows-[1fr] motion-reduce:transition-none">
                    <div className="min-h-0 overflow-hidden">
                      <div className="mt-1.5! overflow-hidden rounded-xl bg-[#f4f5f1]">
                        <div
                          ref={thoughtsRef}
                          className="max-h-28 overflow-y-auto px-3! py-2.5! [scrollbar-width:none] data-[overflow]:[mask-image:linear-gradient(to_bottom,transparent,#000_1.25rem)] [&::-webkit-scrollbar]:hidden"
                        >
                          <ol className="m-0! list-none p-0!">
                            {plan.slice(0, thought + 1).map((text, index) => {
                              const live = thinking && index === thought;
                              return (
                                <li key={index} className="relative pb-2! pl-4! text-[12px] leading-[1.7] text-[#686860] last:pb-0!">
                                  <span aria-hidden="true" className={`absolute top-[0.6em] left-0 size-[7px] rounded-full border border-[#4f632b] ${live ? "animate-pulse bg-[#4f632b]" : "bg-white"}`} />
                                  {index < thought && <span aria-hidden="true" className="absolute top-[1.45em] bottom-[-0.6em] left-[3px] w-px bg-black/10" />}
                                  {live ? text.slice(0, streamed) : text}
                                  {live && <span aria-hidden="true" className="ml-px inline-block h-[1em] w-[1.5px] translate-y-[0.15em] bg-[#4f632b]" />}
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )}
              {planeSteps.slice(0, visibleSteps).map((planeStep, index) => {
                const size = planeStep.parts.length;
                const count = Math.min(size, Math.max(0, placed - planeStepStarts[index]));
                const done = count === size;
                const current = building && index === currentStep && !done;
                return (
                  <li
                    key={index}
                    data-current={current ? "" : undefined}
                    className={rowClass}
                  >
                    <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
                      {done ? <Check size={14} strokeWidth={2.5} className="text-[#4f632b]" /> : <span className="size-1.5 animate-pulse rounded-full bg-[#4f632b]" />}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[#9a9e96]">{String(index + 1).padStart(2, "0")}</span>
                    <span className={`shrink-0 font-medium ${done ? "text-[#686860]" : "text-[#151816]"}`}>{planeStep.label[locale]}</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-[#9a9e96]">{summary(planeStep.parts, locale)}</span>
                    <span className="shrink-0 font-mono text-[11px] text-[#686860] tabular-nums">{count}/{size}</span>
                    {current && (
                      <span aria-hidden="true" className="absolute inset-x-2 bottom-0.5 h-0.5 overflow-hidden rounded-full bg-black/6">
                        <span className="block h-full origin-left rounded-full bg-[#4f632b] transition-transform duration-150" style={{ transform: `scaleX(${count / size})` }} />
                      </span>
                    )}
                  </li>
                );
              })}
              {airborne && (
                <li
                  data-current={phase === "flight" ? "" : undefined}
                  className={rowClass}
                >
                  <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
                    {phase === "done" ? <Check size={14} strokeWidth={2.5} className="text-[#4f632b]" /> : <Plane size={13} className="text-[#4f632b]" />}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-[#9a9e96]">{String(planeSteps.length + 1).padStart(2, "0")}</span>
                  <span className="shrink-0 font-medium text-[#151816]">{messages.homeScreens.genpiFlightRow[locale]}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-[#9a9e96]">{flightLabel}</span>
                  <span className="shrink-0 font-mono text-[11px] text-[#686860] tabular-nums">{phase === "done" ? flightStages.length : flightStage}/{flightStages.length}</span>
                  {phase === "flight" && (
                    <span aria-hidden="true" className="absolute inset-x-2 bottom-0.5 h-0.5 overflow-hidden rounded-full bg-black/6">
                      <span className="block h-full origin-left rounded-full bg-[#4f632b] transition-transform duration-300" style={{ transform: `scaleX(${flightStage / flightStages.length})` }} />
                    </span>
                  )}
                </li>
              )}
            </ol>

            <div className="shrink-0 border-t border-black/6 px-4! py-3!">
              <div className="mb-2! flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-[#8a8e86]">
                <span>{messages.homeScreens.genpiBuildTally[locale]}</span>
                <span className="tabular-nums">{placed}/{totalParts}</span>
              </div>
              <ul className="m-0! flex min-h-6 list-none flex-wrap gap-1.5 p-0!">
                {modules.map(([module, count]) => (
                  <li key={module} className="flex items-center gap-1.5 rounded-md bg-[#f4f5f1] px-2! py-1! text-[11px] text-[#3a3f3c] transition-opacity duration-300 starting:opacity-0">
                    <Swatch module={module} />
                    {planeModules[module].label[locale]}
                    <span className="font-mono text-[#8a8e86] tabular-nums">×{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Node>

      <div aria-hidden="true" className="relative flex h-24 items-center justify-center md:col-start-2 md:row-start-1 md:h-auto">
        <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-linear-to-b from-black/5 via-[#4f632b]/70 to-black/5 md:top-1/2 md:left-0 md:h-px md:w-full md:translate-x-0 md:-translate-y-1/2 md:bg-linear-to-r" />
        <span data-home-genpi-dot className="absolute top-0 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4f632b] shadow-[0_0_10px_rgba(79,99,43,0.45)] motion-reduce:hidden md:top-1/2 md:left-0" />
        <span className="relative rounded-full border border-black/10 bg-white px-4! py-1.5! font-mono text-xs tracking-[0.2em] text-[#4f632b]">GenPI</span>
      </div>

      <Node step={messages.homeScreens.genpiArtifactStep} text={messages.homeScreens.genpiArtifact} column="md:col-start-3" panel="aspect-[4/3] md:aspect-auto">
        {/* Mouse hovers into the pilot view; touch taps in and taps again to leave. */}
        <div
          role="img"
          aria-label={messages.homeScreens.genpiBuildSceneLabel[locale]}
          onPointerEnter={event => { if (canHover && event.pointerType === "mouse") setHovering(true); }}
          onPointerLeave={event => { if (canHover && event.pointerType === "mouse") setHovering(false); }}
          onPointerDown={event => { pointerType.current = event.pointerType; }}
          onClick={() => {
            if (airborne && (!canHover || pointerType.current !== "mouse")) setHovering(value => !value);
          }}
          className={`absolute inset-0 touch-manipulation bg-linear-to-b from-white to-[#eceee8] ${airborne ? "cursor-crosshair" : ""}`}
        >
          {/* Sky fades in as the plane leaves the ground. */}
          <div aria-hidden="true" className={`absolute inset-0 bg-linear-to-b from-[#cfe3ee] via-[#e6f0f2] to-[#f3f5f0] transition-opacity duration-[2500ms] ${airborne ? "opacity-100" : "opacity-0"}`} />
          {started && <HomeGenpiBuildScene placed={placed} highlightStep={building ? currentStep : -1} instant={reduced} flying={airborne} pilot={pilot} compass={{ rose: roseRef, readout: readoutRef }} active={inView} />}
        </div>
        {/* Mirrors the console header so both sides name the same step. */}
        <span aria-hidden="true" className="pointer-events-none absolute top-4 right-24 left-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-[#686860]">
          <span className={`size-1.5 shrink-0 rounded-full ${building || airborne ? "animate-pulse bg-[#4f632b]" : "bg-black/20"}`} />
          <span className="truncate">
            {messages.homeScreens.genpiBuildLive[locale]}
            {visibleSteps > 0 && <span className="text-[#151816]"> · {String(airborne ? planeSteps.length + 1 : currentStep + 1).padStart(2, "0")} {currentLabel}</span>}
          </span>
          <span className="ml-auto shrink-0 text-black/40 tabular-nums">{placed}/{totalParts}</span>
        </span>
        {/* Compass dial: the card turns under a fixed index, so the top reads the plane's heading. */}
        <div aria-hidden="true" className="pointer-events-none absolute top-3 right-3 flex size-[4.5rem] flex-col items-center justify-center rounded-full border border-black/10 bg-white/80 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div ref={roseRef} className="absolute inset-1" style={{ transform: `rotate(${-Number(runwayBearing)}deg)` }}>
            <svg viewBox="0 0 100 100" className="size-full">
              {Array.from({ length: 24 }, (_, index) => (
                <line key={index} x1="50" y1="3" x2="50" y2={index % 6 === 0 ? 12 : 8} stroke={index === 0 ? "#4f632b" : "#151816"} strokeOpacity={index % 6 === 0 ? 0.7 : 0.25} strokeWidth={index % 6 === 0 ? 2 : 1.2} transform={`rotate(${index * 15} 50 50)`} />
              ))}
              {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([letter, angle]) => (
                <text key={letter} x="50" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill={letter === "N" ? "#4f632b" : "#686860"} style={{ fontFamily: "var(--font-geist-mono)" }} transform={`rotate(${angle} 50 50)`}>{letter}</text>
              ))}
            </svg>
          </div>
          <span className="absolute -top-px left-1/2 size-0 -translate-x-1/2 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#151816]" />
          <span ref={readoutRef} className="relative font-mono text-[12px] leading-none font-semibold text-[#151816] tabular-nums">{runwayBearing}</span>
          <span className="relative mt-0.5! font-mono text-[8px] leading-none tracking-[0.15em] text-[#8a8e86]">{messages.homeScreens.genpiCompassLabel[locale]}</span>
        </div>
        {airborne && (
          <span aria-hidden="true" className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#151816]/80 px-3! py-1.5! font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-white backdrop-blur-sm transition-opacity duration-500 starting:opacity-0">
            {pilotHint}
          </span>
        )}
        {/* "Start building" notice: shows once the prompt is sent, then clears for the build. */}
        <div
          aria-hidden={phase !== "toast"}
          data-open={phase === "toast" ? "" : undefined}
          className="pointer-events-none absolute inset-0 flex scale-95 items-center justify-center opacity-0 transition-[opacity,scale] duration-300 data-[open]:scale-100 data-[open]:opacity-100 motion-reduce:transition-none"
        >
          <div className="flex min-w-56 flex-col gap-3 rounded-2xl bg-[#151816] px-5! py-4! text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <Hammer size={16} aria-hidden="true" />
              {messages.homeScreens.genpiBuildToast[locale]}
            </span>
            <span className="truncate text-xs text-white/60">{locale === "zh" ? `「${prompt}」` : `“${prompt}”`}</span>
            <span className="h-0.5 overflow-hidden rounded-full bg-white/15">
              <span className={`block h-full origin-left bg-white/80 transition-transform ease-linear ${phase === "toast" ? "scale-x-100" : "scale-x-0"}`} style={{ transitionDuration: phase === "toast" ? `${TOAST_MS}ms` : "0ms" }} />
            </span>
          </div>
        </div>
      </Node>
    </div>
  );
}
