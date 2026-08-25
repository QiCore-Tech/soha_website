const VIDEO_ID = "kXsAVhzLfh4";
const YOUTUBE_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

export function QiCoreFilm() {
  return (
    <section className="marketing-section qicore-film-section" data-qicore-waterfall="2" data-qicore-film>
      <div className="qicore-film-record">
        <p className="section-kicker">About us / Film 01</p>
        <h2>
          <span data-lang="zh">走进 QiCore</span>
          <span data-lang="en">Inside QiCore</span>
        </h2>
        <p className="qicore-film-description">
          <span data-lang="zh">用一分钟认识我们的团队、我们正在解决的问题，以及从第一款产品开始迈出的第一步。</span>
          <span data-lang="en">Meet the team, the problem we are working on, and the first product bringing our vision into the physical world.</span>
        </p>
        <dl className="qicore-film-meta" aria-label="Film information">
          <div><dt>Film</dt><dd>MAKE SMART</dd></div>
          <div><dt>Year</dt><dd>2026</dd></div>
          <div><dt>Length</dt><dd>01:01</dd></div>
        </dl>
        <a className="qicore-film-external" href={YOUTUBE_URL} target="_blank" rel="noreferrer">
          <span data-lang="zh">在 YouTube 观看</span>
          <span data-lang="en">Watch on YouTube</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="qicore-film-stage">
        <div className="qicore-film-screen" data-qicore-film-screen data-video-id={VIDEO_ID}>
          <button
            className="qicore-film-poster"
            type="button"
            aria-label="Play QiCore Technology: MAKE SMART"
            data-qicore-film-play
          >
            <img
              src={`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span className="qicore-film-play" aria-hidden="true"><i /></span>
            <span className="qicore-film-watch">
              <span data-lang="zh">播放影片</span>
              <span data-lang="en">Play film</span>
            </span>
          </button>
        </div>
        <div className="qicore-film-register">
          <span aria-hidden="true">16:9 / DIGITAL FILM</span>
          <span aria-hidden="true">QICORE TECHNOLOGY</span>
          <button className="qicore-film-close" type="button" data-qicore-film-close hidden>
            <span data-lang="zh">关闭影片</span>
            <span data-lang="en">Close film</span>
            <i aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
