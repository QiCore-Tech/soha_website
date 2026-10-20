import { messages } from "@/i18n/messages";

type OyscatProductWordmarkProps = {
  className?: string;
  decorative?: boolean;
};

export function OyscatProductWordmark({
  className = "",
  decorative = false
}: OyscatProductWordmarkProps) {
  return (
    <img
      className={`oyscat-product-wordmark qicore-oyscat-product-wordmark${className ? ` ${className}` : ""}`}
      src="/brand/oyscat-wordmark.png"
      width={845}
      height={302}
      alt={decorative ? "" : messages.common.productName.zh}
      data-alt-zh={decorative ? "" : messages.common.productName.zh}
      data-alt-en={decorative ? "" : messages.common.productName.en}
      aria-hidden={decorative || undefined}
    />
  );
}
