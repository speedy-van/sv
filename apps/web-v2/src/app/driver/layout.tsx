import type { ReactNode } from "react";
import { DriverShell } from "@/components/driver/DriverShell";

export default function DriverLayout({ children }: { children: ReactNode }) {
  return <DriverShell>{children}</DriverShell>;
}
