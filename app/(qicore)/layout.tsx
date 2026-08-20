import type { ReactNode } from "react";
import { LegacyHome } from "@/components/legacy-home";
import { QiCoreRouteShell } from "@/components/qicore-route-shell";

export default function QiCoreLayout({ children }: { children: ReactNode }) {
  return <QiCoreRouteShell canvas={<LegacyHome />}>{children}</QiCoreRouteShell>;
}
