import { useState, useEffect, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { api } from "@/services/api";
import { useDashboardStore } from "@/stores/dashboardStore";
import { suggestDashboard } from "@/services/discovery";
import "./UpdateBanner.css";

export function UpdateBanner() {
  const [show, setShow] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const dashboard = useDashboardStore((s) => s.dashboard);
  const setDashboard = useDashboardStore((s) => s.setDashboard);

  useEffect(() => {
    if (!dashboard) return;
    api.getHealth().then((health) => {
      setAppVersion(health.version);
      const dashVersion = dashboard.generated_with_version || "";
      if (dashVersion && dashVersion !== health.version) {
        setShow(true);
      } else if (!dashVersion && dashboard.views.length > 0) {
        // Dashboard was generated before versioning existed
        setShow(true);
      }
    }).catch(() => {});
  }, [dashboard]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      const newDashboard = await suggestDashboard();
      await api.putDashboard(newDashboard);
      setDashboard(newDashboard);
      setShow(false);
    } catch (e) {
      console.error("Regenerate failed:", e);
    } finally {
      setRegenerating(false);
    }
  }, [setDashboard]);

  if (!show) return null;

  return (
    <div className="update-banner">
      <Icon name="hint" style={{ width: 18, height: 18, color: "var(--dh-blue)" }} />
      <div className="update-banner__text">
        <strong>Neue Version {appVersion}</strong> — Dashboard wurde mit einer aelteren Version erstellt.
        Neu generieren fuer alle neuen Karten-Typen und Verbesserungen.
      </div>
      <button
        className="update-banner__btn"
        onClick={handleRegenerate}
        disabled={regenerating}
      >
        {regenerating ? "Generiert..." : "Neu generieren"}
      </button>
      <button
        className="update-banner__dismiss"
        onClick={() => setShow(false)}
        title="Spaeter"
      >
        <Icon name="decline" style={{ width: 14, height: 14, color: "var(--dh-gray100)" }} />
      </button>
    </div>
  );
}
