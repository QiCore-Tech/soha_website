import { messages } from "@/i18n/messages";
import { BilingualText as Bi } from "@/components/bilingual-text";

const VIDEO_ID = "kXsAVhzLfh4";
const YOUTUBE_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
// A local copy of the YouTube thumbnail: i.ytimg.com is unreachable from some
// networks, and a hanging request never fires the fallback below.
const LOCAL_POSTER = "/media/web/film-poster.webp";

/**
 * Brand film on a light band. The player itself is injected by the route
 * shell through the data attributes below, which is why the poster stays a
 * plain button.
 */
export function QiCoreFilm({ posterFallback }: { posterFallback?: string }) {
  return (
    <section data-qicore-waterfall="2" data-qicore-film className="qicore-film-section border-t border-line bg-surface text-ink">
      <div className="site-container py-20 md:py-28">
        <header className="max-w-3xl">
          <p className="eyebrow text-ink-3"><Bi zh={messages.site.about.filmEyebrow.zh} en={messages.site.about.filmEyebrow.en} /></p>
          <h2 className="mt-3 text-title font-semibold tracking-tight text-ink">
            <span data-lang="zh">{messages.qicoreFilm.insideQicore.zh}</span>
            <span data-lang="en">{messages.qicoreFilm.insideQicore.en}</span>
          </h2>
          <dl className="mt-6 flex flex-wrap gap-x-12 gap-y-4 text-[13px] text-ink-3" aria-label={messages.qicoreFilm.filmInformation.zh} data-aria-label-zh={messages.qicoreFilm.filmInformation.zh} data-aria-label-en={messages.qicoreFilm.filmInformation.en}>
            <div>
              <dt><Bi zh={messages.qicoreFilm.film.zh} en={messages.qicoreFilm.film.en} /></dt>
              <dd className="mt-1 font-medium text-ink">{messages.qicoreFilm.makeSmart.zh}</dd>
            </div>
            <div>
              <dt><Bi zh={messages.qicoreFilm.year.zh} en={messages.qicoreFilm.year.en} /></dt>
              <dd className="mt-1 font-medium text-ink">{messages.qicoreFilm.value2026.zh}</dd>
            </div>
            <div>
              <dt><Bi zh={messages.qicoreFilm.length.zh} en={messages.qicoreFilm.length.en} /></dt>
              <dd className="mt-1 font-medium text-ink">{messages.qicoreFilm.value0101.zh}</dd>
            </div>
          </dl>
        </header>

        <div className="qicore-film-stage mt-12">
          <div className="qicore-film-screen" data-qicore-film-screen data-video-id={VIDEO_ID}>
            <button
              className="qicore-film-poster"
              type="button"
              aria-label={messages.qicoreFilm.playQicoreTechnologyMakeSmart.zh}
              data-aria-label-zh={messages.qicoreFilm.playQicoreTechnologyMakeSmart.zh}
              data-aria-label-en={messages.qicoreFilm.playQicoreTechnologyMakeSmart.en}
              data-qicore-film-play
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOCAL_POSTER} data-film-fallback={posterFallback} alt="" width={1280} height={720} loading="lazy" decoding="async" />
              <span className="qicore-film-play" aria-hidden="true"><i /></span>
              <span className="qicore-film-watch">
                <span data-lang="zh">{messages.qicoreFilm.playFilm.zh}</span>
                <span data-lang="en">{messages.qicoreFilm.playFilm.en}</span>
              </span>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-[13px] text-ink-3">
            <span aria-hidden="true"><Bi zh={messages.qicoreFilm.text169DigitalFilm.zh} en={messages.qicoreFilm.text169DigitalFilm.en} /></span>
            <span className="flex items-center gap-6">
              <a className="inline-flex min-h-11 items-center text-ink-2 no-underline hover:text-ink" href={YOUTUBE_URL} target="_blank" rel="noreferrer">
                <Bi zh={messages.qicoreFilm.watchOnYoutube.zh} en={messages.qicoreFilm.watchOnYoutube.en} />
              </a>
              <button className="qicore-film-close inline-flex min-h-11 items-center text-ink-2 hover:text-ink" type="button" data-qicore-film-close hidden>
                <Bi zh={messages.qicoreFilm.closeFilm.zh} en={messages.qicoreFilm.closeFilm.en} />
              </button>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
