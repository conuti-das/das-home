import { useEffect } from "react";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useEntity } from "@/hooks/useEntity";

export function useThemeSync() {
  const dashboard = useDashboardStore((s) => s.dashboard);
  const sunEntity = useEntity("sun.sun");

  useEffect(() => {
    if (!dashboard) return;

    if (dashboard.auto_theme && sunEntity) {
      const isDark = sunEntity.state === "below_horizon";
      setTheme(isDark ? "sap_horizon_dark" : "sap_horizon");
    } else {
      setTheme(dashboard.theme);
    }
  }, [dashboard?.theme, dashboard?.auto_theme, sunEntity?.state]);
}
