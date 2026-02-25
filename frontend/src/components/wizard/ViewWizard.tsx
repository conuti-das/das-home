import { useState } from "react";
import {
  Dialog,
  Input,
  Select,
  Option,
  Button,
  FlexBox,
  FlexBoxDirection,
  Title,
} from "@ui5/webcomponents-react";
import type { ViewConfig } from "@/types";

interface ViewWizardProps {
  open: boolean;
  onSave: (view: ViewConfig) => void;
  onClose: () => void;
  editView?: ViewConfig;
}

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
    <Dialog
      open={open}
      headerText={editView ? "Edit View" : "Add View"}
      style={{ width: "min(500px, 90vw)" }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "0.5rem" }}>
          <Button design="Transparent" onClick={onClose}>Cancel</Button>
          <Button design="Emphasized" onClick={handleSave} disabled={!name}>Save</Button>
        </div>
      }
    >
      <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
        <Title level="H5">View Name</Title>
        <Input
          value={name}
          onInput={(e) => setName((e.target as unknown as { value: string }).value)}
          placeholder="e.g., Living Room"
          style={{ width: "100%" }}
        />
        <Title level="H5">Icon</Title>
        <Input
          value={icon}
          onInput={(e) => setIcon((e.target as unknown as { value: string }).value)}
          placeholder="mdi:home"
          style={{ width: "100%" }}
        />
        <Title level="H5">View Type</Title>
        <Select
          onChange={(e) => {
            const val = e.detail.selectedOption?.dataset?.value;
            if (val === "grid" || val === "object_page") setType(val);
          }}
        >
          <Option data-value="grid" selected={type === "grid"}>Grid</Option>
          <Option data-value="object_page" selected={type === "object_page"}>Object Page</Option>
        </Select>
      </FlexBox>
    </Dialog>
  );
}
