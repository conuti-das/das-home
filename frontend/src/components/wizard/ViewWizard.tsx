import { useState } from "react";
import type { Key } from "react";
import { Modal, TextField, Select, SelectItem, Button } from "@/components/ui";
import type { ViewConfig } from "@/types";

interface ViewWizardProps {
  open: boolean;
  onSave: (view: ViewConfig) => void;
  onClose: () => void;
  editView?: ViewConfig;
}

const VIEW_TYPES = [
  { value: "grid", label: "Grid" },
  { value: "object_page", label: "Object Page" },
];

export function ViewWizard({ open, onSave, onClose, editView }: ViewWizardProps) {
  const [name, setName] = useState(editView?.name || "");
  const [icon, setIcon] = useState(editView?.icon || "mdi:home");
  const [type, setType] = useState<"grid" | "object_page">(editView?.type || "grid");

  const handleSave = () => {
    const view: ViewConfig = {
      id: editView?.id || `view_${Date.now()}`,
      name,
      icon,
      type,
      area: editView?.area || "",
      header: editView?.header || { show_badges: true, badges: [] },
      layout: editView?.layout || { columns: "auto", min_column_width: 280 },
      sections: editView?.sections || [],
    };
    onSave(view);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editView ? "Edit View" : "Add View"}
      className="view-wizard"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 4px" }}>
        <TextField
          label="View Name"
          value={name}
          onChange={setName}
          placeholder="e.g., Living Room"
        />
        <TextField
          label="Icon"
          value={icon}
          onChange={setIcon}
          placeholder="mdi:home"
        />
        <Select
          label="View Type"
          selectedKey={type}
          onSelectionChange={(key: Key | null) => {
            if (key === "grid" || key === "object_page") setType(key);
          }}
        >
          {VIEW_TYPES.map((t) => (
            <SelectItem key={t.value} id={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          paddingTop: "12px",
          marginTop: "8px",
          borderTop: "1px solid var(--prn-separator)",
        }}
      >
        <Button variant="plain" onPress={onClose}>
          Cancel
        </Button>
        <Button variant="filled" onPress={handleSave} isDisabled={!name}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
