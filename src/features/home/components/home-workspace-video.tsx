"use client";

import { messages } from "@/i18n/messages";

import { useEffect, useRef, useState } from "react";
import type Player from "xgplayer";
import { getWorkspaceFullscreenTarget, isHomeVideoFullscreen } from "../lib/home-video-fullscreen";
import "xgplayer/dist/index.min.css";
import styles from "./home-workspace-video.module.css";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BilingualText as Bi } from "@/components/marketing-page";
import { useLocale } from "@/hooks/use-locale";

export function HomeWorkspaceVideo({ autoplayAllowed, playbackEnabled = true, presentation = "card" }: { autoplayAllowed: boolean; playbackEnabled?: boolean; presentation?: "card" | "screen" }) {
  const { locale } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const playerSettled = useRef(false);
  const localeRef = useRef(locale);
  const [playerStatus, setPlayerStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const mounted = useRef(false);
  const allowed = useRef(autoplayAllowed);
  const playbackGate = useRef(playbackEnabled);
  const sourceReady = useRef(false);
  const visible = useRef(false);
  const fullscreenActive = useRef(false);
  const userPaused = useRef(false);
  const manualPlaying = useRef(false);
  const pendingManual = useRef(false);
  const autoplayBlocked = useRef(false);
  const programmaticPause = useRef(false);
  const pendingPlay = useRef(false);
  const generation = useRef(0);
  const syncRef = useRef<() => void>(() => {});
  const playRef = useRef<(manual: boolean) => void>(() => {});
  const pauseRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!root || !video) return;
    mounted.current = true;
    const pause = () => {
      generation.current++;
      pendingPlay.current = false;
      manualPlaying.current = false;
      if (!video.paused) {
        programmaticPause.current = true;
        if (playerRef.current) playerRef.current.pause();
        else video.pause();
      }
    };
    const isFullscreen = () => fullscreenActive.current || isHomeVideoFullscreen(video);
    const play = (manual: boolean) => {
      if (!playbackGate.current && !isFullscreen()) return;
      if (!sourceReady.current || !playerSettled.current) {
        pendingManual.current = manual;
        setReady(true);
        return;
      }
      if (pendingPlay.current || !video.paused) return;
      if (!manual && (autoplayBlocked.current || userPaused.current || !allowed.current)) return;
      if (manual) {
        userPaused.current = false;
        autoplayBlocked.current = false;
        manualPlaying.current = true;
        setBlocked(false);
      }
      pendingPlay.current = true;
      const ticket = ++generation.current;
      const attempt = playerRef.current ? playerRef.current.mediaPlay() : video.play();
      if (!attempt) { pendingPlay.current = false; return; }
      void attempt.then(() => {
        if (ticket !== generation.current) return;
        if (!mounted.current || document.hidden || (!visible.current && !isFullscreen()) || (!playbackGate.current && !isFullscreen())) {
          pause();
          return;
        }
        pendingPlay.current = false;
      }).catch((error: unknown) => {
        if (!mounted.current || ticket !== generation.current) return;
        pendingPlay.current = false;
        manualPlaying.current = false;
        if (error instanceof DOMException && error.name === "AbortError") return;
        autoplayBlocked.current = true;
        setBlocked(true);
        setPlaying(false);
      });
    };
    const sync = () => {
      if (document.hidden || (!visible.current && !isFullscreen()) || (!playbackGate.current && !isFullscreen())) pause();
      else if (allowed.current && !userPaused.current) play(false);
      else if (!manualPlaying.current) pause();
    };
    playRef.current = play;
    pauseRef.current = pause;
    syncRef.current = sync;
    const preparation = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setReady(true);
        preparation.disconnect();
      }
    }, { rootMargin: "300px" });
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.4) visible.current = true;
      else if (entry.intersectionRatio < 0.15) visible.current = false;
      sync();
    }, { threshold: [0, 0.15, 0.4, 1] });
    preparation.observe(root);
    visibility.observe(root);
    document.addEventListener("visibilitychange", sync);
    return () => {
      mounted.current = false;
      preparation.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", sync);
      pause();
      playRef.current = () => {};
      pauseRef.current = () => {};
      syncRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    playbackGate.current = playbackEnabled || isHomeVideoFullscreen(playerHostRef.current);
    syncRef.current();
  }, [playbackEnabled]);

  useEffect(() => {
    allowed.current = autoplayAllowed;
    syncRef.current();
  }, [autoplayAllowed]);

  useEffect(() => {
    sourceReady.current = ready;
    if (!ready) return;
    if (pendingManual.current) { pendingManual.current = false; playRef.current(true); }
    else syncRef.current();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const host = playerHostRef.current, video = videoRef.current;
    if (!host || !video) return;
    let cancelled = false;
    let instance: Player | null = null;
    let resize: ResizeObserver | undefined;
    let frame = 0;
    playerSettled.current = false;
    const resume = () => {
      if (pendingManual.current) { pendingManual.current = false; playRef.current(true); }
      else syncRef.current();
    };
    void import("xgplayer").then(async ({ default: XGPlayer }) => {
      if (cancelled || !mounted.current) return;
      instance = new XGPlayer({
        el: host,
        mediaEl: video,
        url: new URL("/media/v3/workspace-demo.mp4", window.location.href).href,
        poster: { poster: "/media/v3/workspace-poster.jpg", fillMode: presentation === "screen" ? "cover" : "contain", useVideoPoster: false },
        width: "100%", height: "100%", fluid: false,
        fitVideoSize: "fixed", videoFillMode: presentation === "screen" ? "cover" : "contain",
        autoplay: false, autoplayMuted: true, videoInit: false,
        loop: true, playsinline: true, preload: "none",
        lang: localeRef.current === "zh" ? "zh-cn" : "en",
        controls: { mode: "flex", autoHide: true, initShow: true },
        marginControls: false, cssFullscreen: false, remainMediaAfterDestroy: true,
        fullscreenTarget: getWorkspaceFullscreenTarget(host), needFullscreenScroll: true,
        seekedStatus: "auto", playbackRate: [0.5, 1, 1.5, 2],
        closePlayVideoFocus: true, closePauseVideoFocus: true, closeFocusVideoFocus: true,
        keyboard: { disableBodyTrigger: true, isGlobalTrigger: false },
        mobile: { disableGesture: true, gestureY: false },
        ignores: ["cssfullscreen", "download", "screenshot", "pip", "miniscreen", "testspeed", "fpsdetect", "stats", "logger"],
      });
      // Route every player play/replay control through the existing scroll and
      // autoplay policy. mediaPlay below bypasses these hooks without recursion.
      instance.useHooks("play", () => { playRef.current(true); return false; });
      instance.useHooks("replay", () => { playRef.current(true); return false; });
      await instance.start();
      if (cancelled || !mounted.current) return;
      playerRef.current = instance;
      video.controls = false;
      playerSettled.current = true;
      setPlayerStatus("ready");
      const updateSize = () => {
        if (cancelled || frame) return;
        frame = requestAnimationFrame(() => { frame = 0; if (!cancelled) instance?.resize(); });
      };
      resize = new ResizeObserver(updateSize);
      resize.observe(host);
      updateSize();
      resume();
    }).catch(() => {
      if (cancelled || !mounted.current) return;
      instance?.destroy();
      instance = null;
      playerRef.current = null;
      // Failed optional player code must leave the same native video usable.
      video.src = "/media/v3/workspace-demo.mp4";
      video.controls = playbackGate.current;
      playerSettled.current = true;
      setPlayerStatus("fallback");
      resume();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      playerRef.current = null;
      playerSettled.current = false;
      instance?.destroy();
    };
  }, [ready, presentation]);

  useEffect(() => {
    localeRef.current = locale;
    const player = playerRef.current, host = playerHostRef.current;
    if (player) player.lang = locale === "zh" ? "zh-cn" : "en";
    if (!host || playerStatus !== "ready") return;
    const controls = [
      { selector: ".xgplayer-play", ...(playing ? messages.runtime.pauseDemo : messages.runtime.playDemo) },
      { selector: ".xgplayer-volume", zh: messages.homeWorkspaceVideo.volume.zh, en: messages.homeWorkspaceVideo.volume.en },
      { selector: ".xgplayer-fullscreen", zh: messages.homeWorkspaceVideo.fullscreen.zh, en: messages.homeWorkspaceVideo.fullscreen.en },
      { selector: ".xgplayer-playbackrate", zh: messages.homeWorkspaceVideo.playbackSpeed.zh, en: messages.homeWorkspaceVideo.playbackSpeed.en },
    ];
    controls.forEach(({ selector, zh, en }) => {
      const control = host.querySelector<HTMLElement>(selector);
      if (!control) return;
      control.setAttribute("role", "button");
      control.setAttribute("aria-label", locale === "zh" ? zh : en);
      control.dataset.ariaLabelZh = zh;
      control.dataset.ariaLabelEn = en;
      control.tabIndex = playbackEnabled ? 0 : -1;
      if (selector === ".xgplayer-play") control.dataset.homeVideoToggle = "true";
    });
    const playControl = host.querySelector<HTMLElement>("[data-home-video-toggle]");
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      if (!playbackGate.current) return;
      if (videoRef.current?.paused) playRef.current(true);
      else { userPaused.current = true; pauseRef.current(); }
    };
    playControl?.addEventListener("keydown", onKey);
    return () => playControl?.removeEventListener("keydown", onKey);
  }, [locale, playerStatus, playing, playbackEnabled]);

  useEffect(() => {
    if (playerHostRef.current) playerHostRef.current.inert = !playbackEnabled && !isHomeVideoFullscreen(playerHostRef.current);
  }, [playbackEnabled]);

  useEffect(() => {
    const host = playerHostRef.current, video = videoRef.current;
    if (!host || !video) return;
    const target = getWorkspaceFullscreenTarget(host);
    let frame = 0;
    const setFullscreen = (active: boolean) => {
      const previous = fullscreenActive.current;
      fullscreenActive.current = active;
      if (active) target.dataset.homeVideoFullscreen = "true";
      else delete target.dataset.homeVideoFullscreen;
      host.inert = !playbackGate.current && !active;
      syncRef.current();
      if (!active && previous) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          window.dispatchEvent(new Event("qicore:laptop-refresh"));
          playerRef.current?.resize();
        });
      }
    };
    const syncFullscreen = () => {
      const element = document.fullscreenElement
        ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      const nativeVideo = (video as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean }).webkitDisplayingFullscreen;
      setFullscreen(Boolean(element && (element === target || element.contains(host)) || nativeVideo));
    };
    const beginNative = () => setFullscreen(true);
    const endNative = () => setFullscreen(false);
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    video.addEventListener("webkitbeginfullscreen", beginNative);
    video.addEventListener("webkitendfullscreen", endNative);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
      video.removeEventListener("webkitbeginfullscreen", beginNative);
      video.removeEventListener("webkitendfullscreen", endNative);
      fullscreenActive.current = false;
      delete target.dataset.homeVideoFullscreen;
    };
  }, []);

  const label = playing ? messages.homeWorkspaceVideo.pauseDemo : messages.homeWorkspaceVideo.playDemo;
  return (
    <div ref={rootRef} data-home-video-state={blocked ? "blocked" : playing ? "playing" : "paused"} data-home-video-presentation={presentation} data-home-player={playerStatus === "ready" ? "xgplayer" : playerStatus} className={presentation === "screen" ? styles.screenPresentation : "min-w-0"}>
      <div ref={playerHostRef} data-home-player-host tabIndex={playbackEnabled ? 0 : -1} onFocusCapture={() => playerRef.current?.focus({ autoHide: false })} data-playback-enabled={playbackEnabled ? "true" : "false"} className={`${styles.playerHost} ${presentation === "screen" ? styles.screenHost : styles.cardHost}`}>
        <video ref={videoRef} data-home-workspace-video src={ready ? "/media/v3/workspace-demo.mp4" : undefined}
          poster="/media/v3/workspace-poster.jpg" width={1440} height={810}
          muted playsInline loop controls={playerStatus === "fallback" && playbackEnabled} preload="none"
          aria-label={messages.runtime.workspaceDemo[locale]}
          data-aria-label-zh={messages.homeWorkspaceVideo.oyscatWorkspaceDemo.zh} data-aria-label-en={messages.homeWorkspaceVideo.oyscatWorkspaceDemo.en}
          onPlay={() => {
            if (!mounted.current) return;
            if (!playbackGate.current && !isHomeVideoFullscreen(videoRef.current)) { pauseRef.current(); return; }
            userPaused.current = false;
            autoplayBlocked.current = false;
            setBlocked(false);
            if (!pendingPlay.current) manualPlaying.current = true;
            setPlaying(true);
          }}
          onPause={() => {
            if (!mounted.current) return;
            if (programmaticPause.current) programmaticPause.current = false;
            else userPaused.current = true;
            setPlaying(false);
          }}
          onError={() => {
            if (!mounted.current) return;
            autoplayBlocked.current = true;
            setBlocked(true);
            setPlaying(false);
          }}
          className={presentation === "screen" ? "block h-full w-full object-cover" : "block aspect-video h-auto w-full object-contain"}
        />
      </div>
      {playerStatus !== "ready" && <div className={presentation === "screen" ? "absolute top-[max(6rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-10 flex min-h-11 items-center gap-3 rounded-full bg-black/40 px-2! backdrop-blur-sm" : "mt-4! flex min-h-11 shrink-0 items-center justify-between gap-3"}>
        {presentation !== "screen" && <span className="font-mono text-[10px] tracking-[0.18em] text-[#686860]"><span data-lang="zh">{messages.homeWorkspaceVideo.oyscatWorkspaceDemo2.zh}</span><span data-lang="en">{messages.homeWorkspaceVideo.oyscatWorkspaceDemo2.en}</span></span>}
        <Button variant="ghost" className={`min-h-11 h-auto! shrink-0 gap-2 rounded-full px-4! text-xs ${presentation === "screen" ? "text-white! hover:bg-white/15" : "text-[#1d1d1f] hover:bg-black/5"}`}
          data-home-video-toggle disabled={!playbackEnabled} aria-label={label[locale]} data-aria-label-zh={label.zh} data-aria-label-en={label.en}
          onClick={() => {
            if (playing) { userPaused.current = true; pauseRef.current(); }
            else playRef.current(true);
          }}>
          {playing ? <Pause className="size-3.5" aria-hidden="true" /> : <Play className="size-3.5" aria-hidden="true" />}
          <Bi zh={label.zh} en={label.en} />
        </Button>
      </div>}
    </div>
  );
}
