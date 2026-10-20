import type { Metadata } from "next";
import { createPageMetadata, seoCopy } from "@/configs/seo";
import AboutPage from "../about/page";

export const metadata: Metadata = createPageMetadata({
  title: seoCopy.teamTitle.zh,
  description: seoCopy.aboutDescription.zh,
  path: "/about",
  noIndex: true
});

export default AboutPage;
