"use client";
import { useEffect,useRef,useState } from "react";
export function DemoVideo(){const ref=useRef<HTMLVideoElement>(null);const [playing,setPlaying]=useState(false);
 useEffect(()=>{const v=ref.current;if(!v)return;const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!reduced){void v.play().catch(()=>{});}else{v.pause();}},{threshold:0.3});observer.observe(v);return()=>observer.disconnect();},[]);
 return <div style={{width:"100%"}}><video style={{width:"100%",display:"block"}} ref={ref} muted loop playsInline preload="none" poster="/media/v3/workspace-poster.jpg" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} aria-label="Oyscat Workspace demo"><source src="/media/v3/workspace-demo.mp4" type="video/mp4"/></video><button className="oyscat-system-link" type="button" onClick={()=>{const v=ref.current;if(v){if(v.paused)void v.play().catch(()=>{});else v.pause();}}} aria-label={playing?"Pause demo":"Play demo"}>{playing?"Ⅱ":"▷"}<span data-lang="zh">{playing?"暂停演示":"播放演示"}</span><span data-lang="en">{playing?"Pause":"Play"}</span></button></div>;
}
