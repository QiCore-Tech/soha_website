import Script from "next/script";
import { MarketingNav } from "@/components/marketing-nav";

// Draw only into the canvas bitmap before hydration. Mutating React-owned DOM here
// used to make every saved voxel a hydration mismatch on content routes.
const voxelFirstPaintBootstrap = `(function(){try{
  var canvas=document.getElementById("voxel-presentation-canvas");
  var raw=window.localStorage.getItem("qicore-voxel-layout-v1");
  var parsed=raw?JSON.parse(raw):[];
  if(!canvas||!Array.isArray(parsed))return;
  var colors={top:"#C9857C",front:"#D2A06E",right:"#D8C27A",left:"#8FA892",back:"#7E98B7",bottom:"#A08FB5",white:"#F3F1EC",black:"#3A3D40"};
  var valid=new Set(Object.keys(colors));
  var number=function(value,fallback){var result=Number(value);return Number.isFinite(result)?result:fallback;};
  var layout=parsed.map(function(source,index){return{
    id:number(source.id,index+1),x:Math.max(0,Math.floor(number(source.x,0))),y:Math.max(0,Math.floor(number(source.y,0))),z:Math.max(0,Math.floor(number(source.z,0))),
    sx:Math.max(1,Math.floor(number(source.sx==null?source.w:source.sx,1))),sy:Math.max(1,Math.floor(number(source.sy==null?source.h:source.sy,1))),sz:Math.max(1,Math.floor(number(source.sz,1))),
    colorKey:valid.has(source.colorKey)?source.colorKey:"white"
  };});
  var shade=function(hex,amount){var value=parseInt(hex.slice(1),16);var channel=function(shift){return Math.max(0,Math.min(255,((value>>shift)&255)+amount));};return"rgb("+channel(16)+","+channel(8)+","+channel(0)+")";};
  var polygon=function(context,points,fill){context.beginPath();context.moveTo(points[0][0],points[0][1]);for(var i=1;i<points.length;i++)context.lineTo(points[i][0],points[i][1]);context.closePath();context.fillStyle=fill;context.fill();context.stroke();};
  var draw=function(){
    var context=canvas.getContext("2d");if(!context)return;
    var cssWidth=canvas.clientWidth||window.innerWidth*.9;var cssHeight=canvas.clientHeight||window.innerHeight*.9;
    var scaleX=canvas.width/cssWidth;var scaleY=canvas.height/cssHeight;var unit=40;var liftX=5;var liftY=-7;
    context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,canvas.width,canvas.height);context.scale(scaleX,scaleY);
    context.lineWidth=.75;context.strokeStyle="rgba(28,28,28,.42)";context.lineJoin="round";
    layout.slice().sort(function(a,b){return(a.y+a.sy+a.z)-(b.y+b.sy+b.z)||(a.x+a.sx)-(b.x+b.sx);}).forEach(function(voxel){
      var baseX=voxel.x*unit+voxel.z*liftX;var baseY=voxel.y*unit+voxel.z*liftY;var width=voxel.sx*unit;var height=voxel.sy*unit;
      var riseX=voxel.sz*liftX;var riseY=voxel.sz*liftY;var topX=baseX+riseX;var topY=baseY+riseY;var color=colors[voxel.colorKey]||colors.white;
      polygon(context,[[topX,topY+height],[topX+width,topY+height],[baseX+width,baseY+height],[baseX,baseY+height]],shade(color,-18));
      polygon(context,[[topX+width,topY],[topX+width,topY+height],[baseX+width,baseY+height],[baseX+width,baseY]],shade(color,-30));
      polygon(context,[[topX,topY],[topX+width,topY],[topX+width,topY+height],[topX,topY+height]],color);
    });
  };
  window.__QICORE_VOXEL_PRESENTATION__={layout:layout,draw:draw};draw();
}catch(error){}})();`;

export function LegacyHome() {
  return (
    <>
      <MarketingNav />
      <div className="transition-overlay" id="transition-overlay" />
      <div className="emp-flash" id="emp-flash" />
      <div className="ambient-glow" id="ambient-glow" />

      <div className="paper-canvas" id="canvas-area">
        <div id="grid-plane">
          <div className="axis-h" id="axis-h" />
          <div className="axis-v" id="axis-v" />
          <div className="coord-tracker" id="coord-tracker">
            X: 0 | Y: 0 | Z: 0
          </div>
        </div>

        <canvas id="voxel-presentation-canvas" width={1800} height={1000} aria-hidden="true" />
        <div id="voxels-container" />
        <script dangerouslySetInnerHTML={{ __html: voxelFirstPaintBootstrap }} />
        <div id="magnetic-container" />
        <div id="preview-container" />
        <div className="projection-layer" id="projection-layer">
          <div className="projection-shadow projection-title" id="title-shadow">
            <span className="qi">Qi</span>
            <span className="core">Core</span>
          </div>
          <div className="projection-shadow projection-slogan" id="slogan-shadow">
            <p>
              Make Smart <span className="slogan-separator" /> 气造万物
            </p>
          </div>
          <div className="projection-shadow projection-footer" id="footer-shadow">
            <div className="icon-indicator" />
            <div className="slot-machine">
              <div className="slot-track" id="footer-shadow-track">
                <span>info</span>
                <span>hr</span>
                <span>info</span>
              </div>
            </div>
            <span className="domain">@qicore.ai</span>
          </div>
        </div>

        <div className="content-layer">
          <h1 className="brand-title" id="plx-title">
            <span className="qi">Qi</span>
            <span className="core">Core</span>
          </h1>
          <div className="slogan-shell">
            <div className="slogan-card">
              <div className="slogan-bar" id="plx-slogan">
                <p>
                  Make Smart <span className="slogan-separator" /> 气造万物
                </p>
              </div>
              <div className="slogan-drawer">
                <div className="slogan-detail">
                  <p className="company-note">
                    <span data-lang="zh">
                      <span className="brand">气核科技（QiCore）</span> 专注于智能硬件创造与新一代平台研发，欢迎了解公司业务，
                      <span className="hiring">WE ARE HIRING</span>。
                    </span>
                    <span data-lang="en">
                      <span className="brand">QiCore Technology</span> creates next-generation platforms for intelligent hardware. Discover our work and grow with us —{" "}
                      <span className="hiring">WE ARE HIRING</span>.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-signature" id="plx-footer">
          <div className="terminal-footer">
            <a className="terminal-footer-link" href="mailto:info@qicore.ai" aria-label="Email info@qicore.ai">
              <div className="icon-indicator" />
              <div className="slot-machine">
                <div className="slot-track" id="footer-slot-track">
                  <span>info</span>
                  <span>hr</span>
                  <span>info</span>
                </div>
              </div>
              <span className="domain">@qicore.ai</span>
            </a>
          </div>
        </div>

      </div>

      <button className="luon-gateway oyscat-gateway" id="btn-trigger" type="button" aria-label="Meet OysCat">
        <img className="oyscat-gateway-art" src="/brand/oyscat-default-cover.png" alt="" />
        <span className="gateway-copy">
          <small>QiCore Workspace</small>
          <span className="gateway-text">
            <img src="/brand/oyscat-wordmark.png" alt="OysCat" />
          </span>
        </span>
        <span className="gateway-arrow" aria-hidden="true">↗</span>
      </button>

      <section className="scene-luon" id="scene-luon" aria-hidden="true">
        <button className="return-cmd" id="btn-return" type="button">
          <span data-lang="zh">返回创造场</span>
          <span data-lang="en">Back to canvas</span>
        </button>

        <div className="macro-environment" id="macro-environment" aria-hidden="true">
          <div className="oyscat-orbit orbit-a" />
          <div className="oyscat-orbit orbit-b" />
          <div className="oyscat-dot-field" />
        </div>

        <div className="tesseract-wrapper" id="tesseract-wrapper" aria-hidden="true">
          <div className="luon-tesseract oyscat-figure" id="luon-tesseract">
            <img
              data-src="/brand/oyscat-workspace-loading-320-12fps.webp"
              alt=""
              decoding="async"
              fetchPriority="low"
            />
          </div>
        </div>

        <div className="luon-text-group" id="luon-text-group">
          <img className="oyscat-wordmark" src="/brand/oyscat-wordmark.png" alt="OysCat" />
          <p className="luon-subtitle" id="luon-typewriter" />
          <h1 className="luon-title">
            <span data-lang="zh">让创造，自然发生。</span>
            <span data-lang="en">Where creation begins.</span>
          </h1>
          <p className="luon-slogan">
            <span data-lang="zh">面向智能硬件创造者的全链路工作空间</span>
            <span data-lang="en">The end-to-end workspace for intelligent hardware creators</span>
          </p>
          <div className="oyscat-scene-actions" data-home-interactive-control>
            <a className="oyscat-primary-action" href="/oyscat">
              <span data-lang="zh">了解 OysCat</span>
              <span data-lang="en">Discover OysCat</span>
            </a>
            <a className="oyscat-secondary-action" href="https://oyscat.com">
              <span data-lang="zh">进入 Workspace</span>
              <span data-lang="en">Open Workspace</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <div className="palette-overlay" id="palette-overlay" aria-hidden="true">
        <div className="palette-backdrop" id="palette-backdrop" />
      </div>

      <div id="cursor-wrapper">
        <div className="cursor-dot" />
        <div className="shockwave" id="shockwave" />
        <div className="cube-wrapper" id="cube-wrapper">
          <div className="cursor-cube-container is-spinning" id="cursor-cube" role="menu" aria-label="Voxel color palette">
            <div className="cursor-cube-face face front" data-color-key="front" />
            <div className="cursor-cube-face face back" data-color-key="back" />
            <div className="cursor-cube-face face right" data-color-key="right" />
            <div className="cursor-cube-face face left" data-color-key="left" />
            <div className="cursor-cube-face face top" data-color-key="top" />
            <div className="cursor-cube-face face bottom" data-color-key="bottom" />
            <button className="extra-face multi" type="button" data-color-key="multicolor" aria-label="Multicolor" />
            <button className="extra-face white" type="button" data-color-key="white" aria-label="White" />
            <button className="extra-face black" type="button" data-color-key="black" aria-label="Black" />
          </div>
          <div className="charge-hint" id="charge-hint">
            <div className="charge-text">HOLD TO CLEAR</div>
            <div className="charge-bar-container">
              <div className="charge-bar" />
            </div>
          </div>
        </div>
      </div>

      <Script id="legacy-home-script" src="/legacy-home.js" strategy="afterInteractive" />
    </>
  );
}
