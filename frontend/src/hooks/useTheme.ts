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
 * prince-ui kennt drei Modi: "light", "dark" und "cu" (CU/Brand). Hochkontrast-
 * Varianten (hcb/hcw) werden auf "cu" gelegt, da prince-ui keine eigenen
 * HC-Modi hat — "cu" ist der nächstliegende ausgeprägte Modus.
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

    // --- UI5-Horizon-Theme: weiterhin aus dashboard.theme (+ auto via Sonne). ---
    // Die UI5-Theme-Engine kennt kein „System" — hier bleibt eine konkrete ID.
    let resolvedUi5: string;
    if (dashboard.auto_theme && sunEntity) {
      const isDark = sunEntity.state === "below_horizon";
      resolvedUi5 = isDark ? "sap_horizon_dark" : "sap_horizon";
    } else {
      resolvedUi5 = dashboard.theme;
    }
    setTheme(resolvedUi5);

    // --- prince-ui-Kopplung: Default = System (null → @media prefers-color-scheme). ---
    // Nur im Apple-Design steuert prince-ui das Hell/Dunkel.
    //   • auto_theme an  → prince-ui folgt der Sonne (explizit dark/light).
    //   • auto_theme aus → prince-ui bleibt auf „System" (null), es sei denn der
    //     Nutzer hat im Theme-Switcher explizit eine Hell/Dunkel/HC-Variante
    //     gewählt (dashboard.theme weicht vom System-Default ab).
    try {
      if (designMode !== "apple") {
        setPrinceTheme(null);
        return;
      }
      if (dashboard.auto_theme && sunEntity) {
        setPrinceTheme(sunEntity.state === "below_horizon" ? "dark" : "light");
      } else if (dashboard.theme && dashboard.theme !== "system") {
        // Nutzer hat im Switcher eine konkrete Theme-Variante gewählt → übernehmen.
        setPrinceTheme(princeThemeFor(dashboard.theme));
      } else {
        // System-Default: kein data-theme erzwingen.
        setPrinceTheme(null);
      }
    } catch {
      /* prince-ui evtl. (in Tests) nicht geladen — ignorieren */
    }
  }, [dashboard?.theme, dashboard?.auto_theme, sunEntity?.state, designMode]);
}
