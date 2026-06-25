import { useState } from "react";
import type { Key } from "react";
import {
  Modal,
  Tabs,
  TabBar,
  Tab,
  TabPanel,
  ComboBox,
  ComboBoxItem,
  Select,
  SelectItem,
  Button,
} from "@/components/ui";
import { getRegisteredTypes } from "@/components/cards";
import { useEntityStore } from "@/stores/entityStore";
import type { CardItem } from "@/types";

interface CardWizardProps {
  open: boolean;
  onSave: (card: CardItem) => void;
  onClose: () => void;
  editCard?: CardItem;
}

const SIZES = ["1x1", "2x1", "1x2", "2x2"];

export function CardWizard({ open, onSave, onClose, editCard }: CardWizardProps) {
  const entities = useEntityStore((s) => s.entities);
  const [entityId, setEntityId] = useState(editCard?.entity || "");
  const [cardType, setCardType] = useState(editCard?.type || "");
  const [size, setSize] = useState(editCard?.size || "1x1");
  const [step, setStep] = useState<string>("entity");

  const entityList = Array.from(entities.keys()).sort();
  const cardTypes = getRegisteredTypes();

  const autoDetectType = (eid: string) => {
    const domain = eid.split(".")[0];
    if (cardTypes.includes(domain)) {
      setCardType(domain);
    }
  };

  const handleSave = () => {
    const card: CardItem = {
      id: editCard?.id || `card_${Date.now()}`,
      type: cardType,
      entity: entityId,
      size,
      config: editCard?.config || {},
    };
    onSave(card);
    onClose();
  };

  const suggestions = entityList.filter((id) => id.includes(entityId)).slice(0, 20);

  return (
    <Modal
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editCard ? "Edit Card" : "Add Card"}
      className="card-wizard"
    >
      <Tabs
        selectedKey={step}
        onSelectionChange={(key: Key) => setStep(String(key))}
        className="card-wizard__tabs"
      >
        <TabBar aria-label="Karten-Assistent">
          <Tab id="entity">Entity</Tab>
          <Tab id="type">Card Type</Tab>
          <Tab id="preview">Preview</Tab>
        </TabBar>

        <TabPanel id="entity">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 4px" }}>
            <ComboBox
              label="Select Entity"
              placeholder="entity_id (e.g., light.living_room)"
              allowsCustomValue
              inputValue={entityId}
              onInputChange={(val: string) => {
                setEntityId(val);
                autoDetectType(val);
              }}
              onSelectionChange={(key: Key | null) => {
                if (key != null) {
                  const val = String(key);
                  setEntityId(val);
                  autoDetectType(val);
                }
              }}
            >
              {suggestions.map((id) => (
                <ComboBoxItem key={id} id={id}>
                  {id}
                </ComboBoxItem>
              ))}
            </ComboBox>
            {entityId && (
              <Button variant="plain" onPress={() => setStep("type")}>
                Next
              </Button>
            )}
          </div>
        </TabPanel>

        <TabPanel id="type">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 4px" }}>
            <Select
              label="Card Type"
              selectedKey={cardType || null}
              onSelectionChange={(key: Key | null) => key != null && setCardType(String(key))}
            >
              {cardTypes.map((t) => (
                <SelectItem key={t} id={t}>
                  {t}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Size"
              selectedKey={size}
              onSelectionChange={(key: Key | null) => key != null && setSize(String(key))}
            >
              {SIZES.map((s) => (
                <SelectItem key={s} id={s}>
                  {s}
                </SelectItem>
              ))}
            </Select>
          </div>
        </TabPanel>

        <TabPanel id="preview">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "8px 4px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--prn-label)" }}>Card Summary</div>
            <div style={{ color: "var(--prn-label-2)" }}>Entity: {entityId}</div>
            <div style={{ color: "var(--prn-label-2)" }}>Type: {cardType}</div>
            <div style={{ color: "var(--prn-label-2)" }}>Size: {size}</div>
          </div>
        </TabPanel>
      </Tabs>

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
        <Button variant="filled" onPress={handleSave} isDisabled={!entityId || !cardType}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
