"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { SITE_LOCALE } from "../../lib/site";

export function ContaActions() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element) || event.defaultPrevented) return;
      const link = event.target.closest<HTMLAnchorElement>("a[data-conta-action]");
      if (!link) return;
      const action = link.dataset.contaAction;
      const location = link.dataset.contaLocation;
      if (!action || !["report", "demo", "video", "pilot", "source", "guide"].includes(action)) return;
      if (!location || !["hero", "resources", "closing"].includes(location)) return;
      // Measure link intent only; never treat a click as a download or a booking.
      track("conta_asset_click", { action, location, locale: SITE_LOCALE });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
