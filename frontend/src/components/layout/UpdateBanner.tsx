import { useState, useEffect, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { api } from "@/services/api";
import { useDashboardStore } from "@/stores/dashboardStore";
import { suggestDashboard } from "@/services/discovery";
import type { DashboardConfig } from "@/types";
import "./UpdateBanner.css";

/**
 * Bump this version whenever a release includes changes that benefit from
 * regenerating the dashboard (new card types, new discovery logic, etc.).
 * Pure bug-fix or cosmetic releases should NOT bump this.
 */
const REGEN_REQUIRED_SINCE = "0.3.0";

/** Compare semver strings. Returns -1, 0, or 1. */
function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * Merge a freshly suggested dashboard with the existing one:
 * - Keep existing views (with their card arrangement, order, sizing)
 * - Add new views that don't exist yet
 * - Within existing views, add new sections/cards that were discovered
 * - Preserve theme, accent_color, badges, and other user settings
 */
function mergeDashboards(existing: DashboardConfig, suggested: DashboardConfig): DashboardConfig {
  const merged = structuredClone(existing);
  merged.generated_with_version = suggested.generated_with_version;
  merged.dismissed_version = "";

  const existingViewIds = new Set(merged.views.map((v) => v.id));

  for (const suggestedView of suggested.views) {
    if (!existingViewIds.has(suggestedView.id)) {
      // Entirely new view (e.g. new area discovered) — add it
      merged.views.push(suggestedView);
      continue;
    }

    // View exists — merge sections
    const existingView = merged.views.find((v) => v.id === suggestedView.id)!;
    const existingSectionIds = new Set(existingView.sections.map((s) => s.id));
    const existingEntityIds = new Set(
      existingView.sections.flatMap((s) => s.items.map((item) => item.entity))
    );

    for (const suggestedSection of suggestedView.sections) {
      if (!existingSectionIds.has(suggestedSection.id)) {
        // Filter out entities already present in this view under different sections
        const newItems = suggestedSection.items.filter(
          (item) => !existingEntityIds.has(item.entity)
        );
        if (newItems.length > 0) {
          existingView.sections.push({ ...suggestedSection, items: newItems });
        }
        continue;
      }

      // Section exists — add new entities only
      const existingSection = existingView.sections.find((s) => s.id === suggestedSection.id)!;
      const sectionEntityIds = new Set(existingSection.items.map((item) => item.entity));
      for (const item of suggestedSection.items) {
        if (!sectionEntityIds.has(item.entity) && !existingEntityIds.has(item.entity)) {
          existingSection.items.push(item);
        }
      }
    }
  }

  return merged;
}

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

      // Already dismissed this version?
      if (dashboard.dismissed_version && compareSemver(dashboard.dismissed_version, health.version) >= 0) {
        return;
      }

      const dashVersion = dashboard.generated_with_version || "";

      // Only show if dashboard was generated before the last regen-worthy release
      if (dashVersion && compareSemver(dashVersion, REGEN_REQUIRED_SINCE) >= 0) {
        // Dashboard is up-to-date with regen requirements
        return;
      }

      // Dashboard is older than REGEN_REQUIRED_SINCE, or has no version (legacy)
      if (dashVersion || dashboard.views.length > 0) {
        setShow(true);
      }
    }).catch(() => {});
  }, [dashboard]);

  const handleRegenerate = useCallback(async () => {
    if (!dashboard) return;
    setRegenerating(true);
    try {
      const suggested = await suggestDashboard();
      const merged = mergeDashboards(dashboard, suggested);
      await api.putDashboard(merged);
      setDashboard(merged);
      setShow(false);
    } catch (e) {
      console.error("Regenerate failed:", e);
    } finally {
      setRegenerating(false);
    }
  }, [dashboard, setDashboard]);

  const handleDismiss = useCallback(async () => {
    if (!dashboard || !appVersion) {
      setShow(false);
      return;
    }
    // Persist dismissal so it doesn't reappear
    const updated = structuredClone(dashboard);
    updated.dismissed_version = appVersion;
    try {
      await api.putDashboard(updated);
      setDashboard(updated);
    } catch {
      // At least hide it for this session
    }
    setShow(false);
  }, [dashboard, appVersion, setDashboard]);

  if (!show) return null;

  return (
    <div className="update-banner">
      <Icon name="hint" style={{ width: 18, height: 18, color: "var(--dh-blue)" }} />
      <div className="update-banner__text">
        <strong>Neue Version {appVersion}</strong> — Neue Entities und Karten-Typen verfuegbar.
        Dashboard aktualisieren? Deine Anordnung bleibt erhalten.
      </div>
      <button
        className="update-banner__btn"
        onClick={handleRegenerate}
        disabled={regenerating}
      >
        {regenerating ? "Aktualisiert..." : "Aktualisieren"}
      </button>
      <button
        className="update-banner__dismiss"
        onClick={handleDismiss}
        title="Nicht mehr anzeigen"
      >
        <Icon name="decline" style={{ width: 14, height: 14, color: "var(--dh-gray100)" }} />
      </button>
    </div>
  );
}
