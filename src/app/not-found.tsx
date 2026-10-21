import type { Metadata } from "next";
import { messages } from "@/i18n/messages";
import { BilingualText as Bi } from "@/components/bilingual-text";
import { TextLink } from "@/components/text-link";
import { buttonVariants } from "@/components/ui/button";
import { NotFoundPegboard } from "@/features/not-found/components/not-found-pegboard";
import { NotFoundDocumentTitle } from "@/features/not-found/components/not-found-document-title";

const copy = messages.site.notFound;

export const metadata: Metadata = {
  title: { absolute: messages.pageTitles.notFoundQicore.zh },
  description: copy.description.zh,
  // A missing URL has no canonical of its own, so drop the root layout's "/".
  alternates: { canonical: null },
  robots: { index: false, follow: true }
};

const moreLinks = [
  { href: "/news", label: messages.marketingNav.news },
  { href: "/about", label: messages.marketingNav.aboutUs },
  { href: "/careers", label: messages.marketingNav.joinUs }
];

/**
 * Unmatched URLs render outside the cached route shell, like /careers, so every
 * link here is a plain document navigation. Static export writes it to 404.html.
 */
export default function NotFound() {
  return (
    <main className="marketing-page not-found-page">
      <NotFoundDocumentTitle />
      <div className="marketing-board">
        <section
          className="site-container grid min-h-[calc(100svh_-_var(--site-header-h)_-_var(--header-safe-top))] content-center items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16"
          aria-labelledby="not-found-title"
        >
          <div className="max-w-xl">
            <p className="eyebrow text-ink-3"><Bi zh={copy.eyebrow.zh} en={copy.eyebrow.en} /></p>
            <h1 id="not-found-title" className="mt-3 font-heading text-display font-semibold tracking-tight text-ink">
              <Bi zh={copy.title.zh} en={copy.title.en} />
            </h1>
            <p className="mt-5 max-w-lg text-lead text-ink-2">
              <Bi zh={copy.description.zh} en={copy.description.en} />
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/" className={buttonVariants({ variant: "pill", size: "pill" })}>
                <Bi zh={copy.backHome.zh} en={copy.backHome.en} />
              </a>
              <a href="/oyscat" className={buttonVariants({ variant: "pill-outline", size: "pill" })}>
                <Bi zh={copy.exploreOyscat.zh} en={copy.exploreOyscat.en} />
              </a>
            </div>
            <div className="mt-12 border-t border-line pt-6">
              <p className="font-mono text-[13px] text-ink-3"><Bi zh={copy.moreLinks.zh} en={copy.moreLinks.en} /></p>
              <ul className="mt-2 flex flex-wrap gap-x-8">
                {moreLinks.map((link) => (
                  <li key={link.href}>
                    <TextLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex max-lg:order-first lg:justify-end">
            <NotFoundPegboard />
          </div>
        </section>
      </div>
    </main>
  );
}
