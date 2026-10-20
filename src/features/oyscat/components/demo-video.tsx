"use client";

import { messages } from "@/i18n/messages";
import { useEffect,useRef,useState } from "react";
import { useLocale } from "@/hooks/use-locale";
export function DemoVideo(){const {locale}=useLocale();const ref=useRef<HTMLVideoElement>(null);const [playing,setPlaying]=useState(false);
 useEffect(()=>{const v=ref.current;if(!v)return;const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!reduced){void v.play().catch(()=>{});}else{v.pause();}},{threshold:0.3});observer.observe(v);return()=>observer.disconnect();},[]);
 return <div style={{width:"100%"}}><video style={{width:"100%",display:"block"}} ref={ref} muted loop playsInline preload="none" poster="/media/v3/workspace-poster.jpg" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} aria-label={messages.demoVideo.oyscatWorkspaceDemo.zh} data-aria-label-zh={messages.demoVideo.oyscatWorkspaceDemo.zh} data-aria-label-en={messages.demoVideo.oyscatWorkspaceDemo.en}><source src="/media/v3/workspace-demo.mp4" type="video/mp4"/></video><button className="oyscat-system-link" type="button" onClick={()=>{const v=ref.current;if(v){if(v.paused)void v.play().catch(()=>{});else v.pause();}}} aria-label={(playing ? messages.runtime.pauseDemo : messages.runtime.playDemo)[locale]} data-aria-label-zh={(playing ? messages.runtime.pauseDemo : messages.runtime.playDemo).zh} data-aria-label-en={(playing ? messages.runtime.pauseDemo : messages.runtime.playDemo).en}>{playing?"Ⅱ":"▷"}<span data-lang="zh">{playing?messages.demoVideo.pauseDemo.zh:messages.demoVideo.playDemo.zh}</span><span data-lang="en">{playing?messages.demoVideo.pause.en:messages.demoVideo.play.en}</span></button></div>;
}
