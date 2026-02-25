import { useState } from "react";
import {
  Dialog,
  Wizard,
  WizardStep,
  Input,
  Select,
  Option,
  Button,
  FlexBox,
  FlexBoxDirection,
  Title,
  Text,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/add.js";
import "@ui5/webcomponents-icons/dist/hint.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import { getRegisteredTypes } from "@/components/cards";
import { useEntityStore } from "@/stores/entityStore";
import type { CardItem } from "@/types";

interface CardWizardProps {
  open: boolean;
  onSave: (card: CardItem) => void;
  onClose: () => void;
  editCard?: CardItem;
}

export function CardWizard({ open, onSave, onClose, editCard }: CardWizardProps) {
  const entities = useEntityStore((s) => s.entities);
  const [entityId, setEntityId] = useState(editCard?.entity || "");
  const [cardType, setCardType] = useState(editCard?.type || "");
  const [size, setSize] = useState(editCard?.size || "1x1");
  const [step, setStep] = useState(0);

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

  return (
    <Dialog
      open={open}
      headerText={editCard ? "Edit Card" : "Add Card"}
      style={{ width: "min(600px, 90vw)" }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "0.5rem" }}>
          <Button design="Transparent" onClick={onClose}>Cancel</Button>
          <Button design="Emphasized" onClick={handleSave} disabled={!entityId || !cardType}>Save</Button>
        </div>
      }
    >
      <Wizard>
        {/* Step 1: Select Entity */}
        <WizardStep icon="hint" titleText="Entity" selected={step === 0} data-step="0">
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <Title level="H5">Select Entity</Title>
            <Input
              value={entityId}
              onInput={(e) => {
                const val = (e.target as unknown as { value: string }).value;
                setEntityId(val);
                autoDetectType(val);
              }}
              placeholder="entity_id (e.g., light.living_room)"
              showSuggestions
              style={{ width: "100%" }}
            >
              {entityList
                .filter((id) => id.includes(entityId))
                .slice(0, 20)
                .map((id) => (
                  <Option key={id} value={id}>{id}</Option>
                ))}
            </Input>
            {entityId && (
              <Button design="Transparent" onClick={() => setStep(1)}>Next</Button>
            )}
          </FlexBox>
        </WizardStep>

        {/* Step 2: Card Type */}
        <WizardStep icon="add" titleText="Card Type" selected={step === 1} data-step="1">
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <Title level="H5">Card Type</Title>
            <Select
              onChange={(e) => setCardType(e.detail.selectedOption?.dataset?.value || "")}
              style={{ width: "100%" }}
            >
              {cardTypes.map((t) => (
                <Option key={t} data-value={t} selected={t === cardType}>{t}</Option>
              ))}
            </Select>
            <Title level="H5">Size</Title>
            <Select
              onChange={(e) => setSize(e.detail.selectedOption?.dataset?.value || "1x1")}
            >
              {["1x1", "2x1", "1x2", "2x2"].map((s) => (
                <Option key={s} data-value={s} selected={s === size}>{s}</Option>
              ))}
            </Select>
          </FlexBox>
        </WizardStep>

        {/* Step 3: Preview */}
        <WizardStep icon="accept" titleText="Preview" selected={step === 2} data-step="2">
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "0.5rem", padding: "1rem" }}>
            <Title level="H5">Card Summary</Title>
            <Text>Entity: {entityId}</Text>
            <Text>Type: {cardType}</Text>
            <Text>Size: {size}</Text>
          </FlexBox>
        </WizardStep>
      </Wizard>
    </Dialog>
  );
}
