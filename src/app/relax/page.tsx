import type { Metadata } from "next";
import { messages } from "@/i18n/messages";
import { createPageMetadata } from "@/configs/seo";
import { FunHome } from "@/features/legacy-voxel/components/fun-home";

export const metadata: Metadata = createPageMetadata({
  title: messages.pageTitles.relaxQicore.zh,
  description: messages.legacyHome.makeSmart.zh,
  path: "/relax",
  noIndex: true
});

export default function RelaxPage() {
  return (
    <div className="relax-page">
      <FunHome />
    </div>
  );
}
