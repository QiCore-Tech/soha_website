import type { ReactNode } from "react";
import { HomeScreens } from "@/features/home/components/home-screens";
import { QiCoreRouteShell } from "@/components/qicore-route-shell";

export default function QiCoreLayout({ children }: { children: ReactNode }) {
  return <QiCoreRouteShell canvas={<HomeScreens />}>{children}</QiCoreRouteShell>;
}
