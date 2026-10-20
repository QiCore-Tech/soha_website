import type { Metadata } from "next";
import { messages } from "@/i18n/messages";
import { FunHome } from "@/features/legacy-voxel/components/fun-home";

export const metadata: Metadata = {
  title: messages.pageTitles.relaxQicore.zh,
  description: messages.legacyHome.makeSmart.zh
};

export default function RelaxPage() {
  return (
    <div className="relax-page">
      <FunHome />
    </div>
  );
}
