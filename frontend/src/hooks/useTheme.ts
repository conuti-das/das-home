import { useEffect } from "react";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js";
import { setTheme as setPrinceTheme } from "prince-ui";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useDesignStore } from "@/stores/designStore";
import { useEntity } from "@/hooks/useEntity";

type PrinceTheme = "light" | "dark" | "cu";

/**
 * Bildet eine aufgelöste UI5-Horizon-Theme-ID auf den prince-ui-Modus ab.
 *
 * prince-ui 0.4.0 kennt drei Modi: "light", "dark" und "cu" (CU/Brand).
 * Hochkontrast-Varianten (hcb/hcw) werden auf "cu" gelegt, da prince-ui
 * keine eigenen HC-Modi hat — "cu" ist der nächstliegende ausgeprägte Modus.
 */
function princeThemeFor(ui5Theme: string): PrinceTheme {
  if (ui5Theme.includes("hcb") || ui5Theme.includes("hcw")) return "cu";
  if (ui5Theme.includes("dark")) return "dark";
  return "light";
}

export function useThemeSync() {
  const dashboard = useDashboardStore((s) => s.dashboard);
  const designMode = useDesignStore((s) => s.mode);
  const sunEntity = useEntity("sun.sun");

  useEffect(() => {
    if (!dashboard) return;

    // Aufgelöste UI5-Horizon-Theme-ID bestimmen (auto via Sonnenstand oder fest).
    let resolved: string;
    if (dashboard.auto_theme && sunEntity) {
      const isDark = sunEntity.state === "below_horizon";
      resolved = isDark ? "sap_horizon_dark" : "sap_horizon";
    } else {
      resolved = dashboard.theme;
    }
    setTheme(resolved);

    // prince-ui-Kopplung (0.4.0, 3-Mode): nur im Apple-Design treibt prince-ui
    // Hell/Dunkel/CU. Im Fiori-Design bleibt prince-ui ungesteuert.
    try {
      if (designMode === "apple") {
        setPrinceTheme(princeThemeFor(resolved));
      } else {
        setPrinceTheme(null);
      }
    } catch {
      /* prince-ui evtl. (in Tests) nicht geladen — ignorieren */
    }
  }, [dashboard?.theme, dashboard?.auto_theme, sunEntity?.state, designMode]);
}
