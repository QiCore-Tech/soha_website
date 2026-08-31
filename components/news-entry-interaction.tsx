"use client";

/** Keep the card passive and let only this control toggle its parent entry. */
export function NewsEntryInteraction() {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const entry = event.currentTarget.closest<HTMLDetailsElement>(".news-entry");
    if (entry) entry.open = !entry.open;
  };

  return (
    <button
      className="news-entry-toggle"
      type="button"
      aria-label="展开或收起正文"
      onClick={handleClick}
    >
      <span className="news-entry-toggle-closed">
        <span data-lang="zh">展开正文</span>
        <span data-lang="en">Read story</span>
      </span>
      <span className="news-entry-toggle-open">
        <span data-lang="zh">收起正文</span>
        <span data-lang="en">Close story</span>
      </span>
      <i aria-hidden="true" />
    </button>
  );
}
