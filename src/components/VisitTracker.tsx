"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Tells the server each time a page of the site is opened, for "Статистика" in the
// administration. Sent from the browser, so robots that do not run scripts are not counted.
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // The panel's own pages are not visits to the site.
    if (pathname.startsWith("/admin")) return;
    if (!navigator.sendBeacon?.("/api/visits")) void fetch("/api/visits", { method: "POST", keepalive: true });
  }, [pathname]);

  return null;
}
