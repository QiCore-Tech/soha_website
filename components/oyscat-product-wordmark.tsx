type OysCatProductWordmarkProps = {
  className?: string;
  decorative?: boolean;
};

export function OysCatProductWordmark({
  className = "",
  decorative = false
}: OysCatProductWordmarkProps) {
  return (
    <img
      className={`oyscat-product-wordmark qicore-oyscat-product-wordmark${className ? ` ${className}` : ""}`}
      src="/brand/oyscat-wordmark.png"
      width={845}
      height={302}
      alt={decorative ? "" : "OysCat"}
      aria-hidden={decorative || undefined}
    />
  );
}
