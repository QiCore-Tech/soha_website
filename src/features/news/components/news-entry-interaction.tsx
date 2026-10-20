"use client";

import { messages } from "@/i18n/messages";

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
      onClick={handleClick}
    >
      <span className="news-entry-toggle-closed">
        <span data-lang="zh">{messages.newsEntryInteraction.readStory.zh}</span>
        <span data-lang="en">{messages.newsEntryInteraction.readStory.en}</span>
      </span>
      <span className="news-entry-toggle-open">
        <span data-lang="zh">{messages.newsEntryInteraction.closeStory.zh}</span>
        <span data-lang="en">{messages.newsEntryInteraction.closeStory.en}</span>
      </span>
      <i aria-hidden="true" />
    </button>
  );
}
