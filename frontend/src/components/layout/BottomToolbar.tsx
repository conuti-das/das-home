import { Icon } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import "./BottomToolbar.css";

interface BottomToolbarProps {
  onSettingsClick: () => void;
  onEditClick: () => void;
  onAddCardClick?: () => void;
}

export function BottomToolbar({ onSettingsClick, onEditClick, onAddCardClick }: BottomToolbarProps) {
  const { dashboard, activeViewId, setActiveViewId, editMode } = useDashboardStore();

  if (!dashboard) return null;

  const visibleViews = dashboard.views.slice(0, 6);

  return (
    <nav className="bottom-toolbar">
      {visibleViews.map((view) => (
        <button
          key={view.id}
          className={`bottom-toolbar__btn ${view.id === activeViewId ? "bottom-toolbar__btn--active" : ""}`}
          onClick={() => setActiveViewId(view.id)}
          title={view.name}
        >
          <Icon
            name={view.icon || (view.id === "overview" ? "home" : "building")}
            style={{ width: 20, height: 20 }}
          />
          <span className="bottom-toolbar__label">{view.name}</span>
        </button>
      ))}
      {editMode && onAddCardClick && (
        <button
          className="bottom-toolbar__btn"
          onClick={onAddCardClick}
          title="Karte hinzufügen"
        >
          <Icon name="add" style={{ width: 20, height: 20 }} />
          <span className="bottom-toolbar__label">Neu</span>
        </button>
      )}
      <button
        className={`bottom-toolbar__btn ${editMode ? "bottom-toolbar__btn--active" : ""}`}
        onClick={onEditClick}
        title={editMode ? "Fertig" : "Bearbeiten"}
      >
        <Icon name={editMode ? "accept" : "edit"} style={{ width: 20, height: 20 }} />
        <span className="bottom-toolbar__label">{editMode ? "Fertig" : "Edit"}</span>
      </button>
      <button
        className="bottom-toolbar__btn"
        onClick={onSettingsClick}
        title="Einstellungen"
      >
        <Icon name="settings" style={{ width: 20, height: 20 }} />
        <span className="bottom-toolbar__label">Settings</span>
      </button>
    </nav>
  );
}
