import { ArrowUpRight, Mail } from "lucide-react";
import { messages, formatMessage } from "@/i18n/messages";
import { BilingualText as Bi } from "@/components/bilingual-text";
import { FooterSocialIcon } from "@/components/footer-social-icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import styles from "./marketing-footer.module.css";

const socialPlatforms = [
  { platform: "WeChat", label: messages.marketingFooter.weChat, href: "https://mp.weixin.qq.com/s/wSbBTSHUgdm0Ayuk601eRw" },
  { platform: "Bilibili", label: messages.marketingFooter.bilibili, href: "https://space.bilibili.com/3745036743215474" },
  { platform: "Xiaohongshu", label: messages.marketingFooter.xiaohongshu, href: "https://xhslink.cn/m/85xQ3j0HIh4" },
  { platform: "Facebook", label: messages.marketingFooter.facebook, href: "https://www.facebook.com/share/1baynW2wi6/" },
  { platform: "Instagram", label: messages.marketingFooter.instagram, href: "https://www.instagram.com/oyscat_official?srtk=MTJjcmYwOWozbDZqeQ==" },
  { platform: "Twitter / X", label: messages.marketingFooter.twitter, href: "https://x.com/Oyscat" },
  { platform: "YouTube", label: messages.marketingFooter.youTube, href: "https://www.youtube.com/@OyscatOfficial/videos" },
] as const;

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer data-site-footer data-scroll-reveal="off" className="relative w-full border-t border-zinc-200 bg-[#f4f4f5] text-[#202024] [&_a]:cursor-pointer [&_button]:cursor-pointer">
      <div className="mx-auto! w-full max-w-(--site-content-max) px-(--site-gutter)! pt-6! pb-[max(1rem,env(safe-area-inset-bottom))]! md:pt-8!">
        <div className="grid gap-6 pb-6! md:grid-cols-[1fr_1fr] md:gap-16">
          <div className="min-w-0">
            <a href="/" className="inline-flex min-h-11 items-center gap-3 text-xl font-semibold text-[#202024]! no-underline! focus-visible:outline-2 focus-visible:outline-offset-4">
              <img
                src="/logo/QiCore-English.svg"
                alt={messages.marketingFooter.qicoreTechnology.zh}
                data-alt-zh={messages.marketingFooter.qicoreTechnology.zh}
                data-alt-en={messages.marketingFooter.qicoreTechnology.en}
                width={3439}
                height={807}
                loading="lazy"
                decoding="async"
                className="block h-auto w-[140px] max-w-full"
              />
            </a>
            <p className="mt-1! font-mono text-xs font-medium text-zinc-500">{messages.about.makeSmart.zh}</p>
            {/* Temporarily hidden; remove `hidden` to restore the social links. */}
            <div className="mt-3! hidden">
              <p className="font-mono text-xs text-zinc-500"><Bi {...messages.marketingFooter.socialMedia} /></p>
              <TooltipProvider delay={150}>
                <ul className="mt-1! flex flex-wrap gap-1">
                  {socialPlatforms.map((item) => {
                    const { platform, label } = item;
                    const href = "href" in item ? item.href : undefined;
                    // Platforms without an account yet stay as disabled "coming soon" buttons.
                    const zh = href ? label.zh : `${label.zh} · ${messages.marketingFooter.comingSoon.zh}`;
                    const en = href ? label.en : `${label.en} · ${messages.marketingFooter.comingSoon.en}`;
                    return (
                      <li key={platform}>
                        <Tooltip>
                          <TooltipTrigger
                            {...(href
                              ? { render: <a href={href} target="_blank" rel="noopener noreferrer" /> }
                              : { type: "button" as const, "aria-disabled": true })}
                            aria-label={zh}
                            data-aria-label-zh={zh}
                            data-aria-label-en={en}
                            className={styles.socialButton}>
                            <FooterSocialIcon platform={platform} />
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            <span data-lang="zh">{zh}</span>
                            <span data-lang="en">{en}</span>
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </TooltipProvider>
            </div>
          </div>
          <section className="min-w-0 border-t border-zinc-300 pt-5! md:border-t-0 md:border-l md:pt-0! md:pl-12!">
            <h2 className="text-lg font-semibold"><Bi {...messages.marketingFooter.contactUs} /></h2>
            <address className="mt-2! flex flex-nowrap items-center justify-between gap-2 not-italic md:grid md:gap-1">
              {[messages.marketingFooter.infoQicoreAi, messages.marketingFooter.hrQicoreAi].map((email) => (
                <a key={email.zh} href={`mailto:${email.zh}`} className="group flex min-h-11 min-w-0 items-center gap-1.5 text-[13px] whitespace-nowrap text-[#202024]! no-underline! hover:text-[#4d6525]! focus-visible:outline-2 focus-visible:outline-offset-4 sm:gap-3 sm:text-base md:w-fit">
                  <Mail aria-hidden="true" className="size-3.5 shrink-0 text-zinc-500 sm:size-4" />
                  <span className="min-w-0">{email.zh}</span>
                  <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-[#4d6525] sm:size-4" />
                </a>
              ))}
            </address>
          </section>
        </div>
        <div className="border-t border-zinc-300 pt-3! font-mono text-xs leading-relaxed text-zinc-500">
          <Bi zh={formatMessage(messages.common.copyright, "zh", { year })} en={formatMessage(messages.common.copyright, "en", { year })} />
        </div>
      </div>
    </footer>
  );
}
