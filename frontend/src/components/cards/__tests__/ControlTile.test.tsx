import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useEntityStore } from "@/stores/entityStore";
import type { EntityState } from "@/types";
import { ControlTile } from "../ControlTile";

function seed(entity: EntityState) {
  useEntityStore.setState({ entities: new Map([[entity.entity_id, entity]]) });
}

function ent(
  entity_id: string,
  state: string,
  attributes: Record<string, unknown> = {},
): EntityState {
  return { entity_id, state, attributes, last_changed: "", last_updated: "" };
}

describe("ControlTile", () => {
  beforeEach(() => {
    useEntityStore.setState({ entities: new Map() });
  });

  it("renders a light with brightness % and amber slider fill when on", () => {
    seed(ent("light.lamp", "on", { friendly_name: "Lampe", brightness: 128 }));
    const { container } = render(
      <ControlTile entityId="light.lamp" callService={vi.fn()} />,
    );
    expect(screen.getByText("Lampe")).toBeInTheDocument();
    // 128/255 ≈ 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
    const fill = container.querySelector(".control-tile__fill") as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.style.width).toBe("50%");
    expect(container.querySelector(".control-tile--light")).toBeTruthy();
  });

  it("light off shows no % and zero fill", () => {
    seed(ent("light.lamp", "off", { friendly_name: "Lampe" }));
    const { container } = render(
      <ControlTile entityId="light.lamp" callService={vi.fn()} />,
    );
    expect(screen.queryByText(/%$/)).toBeNull();
    const fill = container.querySelector(".control-tile__fill") as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("tapping the light name toggles via light.turn_off when on", () => {
    const callService = vi.fn();
    seed(ent("light.lamp", "on", { friendly_name: "Lampe", brightness: 200 }));
    render(<ControlTile entityId="light.lamp" callService={callService} />);
    fireEvent.click(screen.getByText("Lampe"));
    expect(callService).toHaveBeenCalledWith("light", "turn_off", {}, { entity_id: "light.lamp" });
  });

  it("gear button fires onCardAction('light-detail') with the entity id", () => {
    const onCardAction = vi.fn();
    seed(ent("light.lamp", "on", { friendly_name: "Lampe", brightness: 200 }));
    const { container } = render(
      <ControlTile entityId="light.lamp" callService={vi.fn()} onCardAction={onCardAction} />,
    );
    const gear = container.querySelector(".control-tile__settings") as HTMLElement;
    fireEvent.click(gear);
    expect(onCardAction).toHaveBeenCalledWith("light-detail", { entityId: "light.lamp" });
  });

  it("renders a switch as a toggle pill (no slider, no %)", () => {
    seed(ent("switch.plug", "on", { friendly_name: "Steckdose" }));
    const { container } = render(
      <ControlTile entityId="switch.plug" callService={vi.fn()} />,
    );
    expect(screen.getByText("Steckdose")).toBeInTheDocument();
    expect(container.querySelector(".control-tile--switch")).toBeTruthy();
    expect(container.querySelector(".control-tile__track")).toBeNull();
    expect(container.querySelector(".control-tile__toggle--on")).toBeTruthy();
  });

  it("switch off has neutral (non-on) toggle and tap turns it on", () => {
    const callService = vi.fn();
    seed(ent("switch.plug", "off", { friendly_name: "Steckdose" }));
    const { container } = render(
      <ControlTile entityId="switch.plug" callService={callService} />,
    );
    expect(container.querySelector(".control-tile__toggle--on")).toBeNull();
    fireEvent.click(screen.getByText("Steckdose"));
    expect(callService).toHaveBeenCalledWith("switch", "turn_on", {}, { entity_id: "switch.plug" });
  });

  it("input_boolean toggles via input_boolean domain", () => {
    const callService = vi.fn();
    seed(ent("input_boolean.guest", "off", { friendly_name: "Gast" }));
    render(<ControlTile entityId="input_boolean.guest" callService={callService} />);
    fireEvent.click(screen.getByText("Gast"));
    expect(callService).toHaveBeenCalledWith(
      "input_boolean",
      "turn_on",
      {},
      { entity_id: "input_boolean.guest" },
    );
  });

  it("unavailable entity is dimmed and does not call service on tap", () => {
    const callService = vi.fn();
    seed(ent("switch.plug", "unavailable", { friendly_name: "Steckdose" }));
    const { container } = render(
      <ControlTile entityId="switch.plug" callService={callService} />,
    );
    expect(container.querySelector(".control-tile--unavailable")).toBeTruthy();
    fireEvent.click(screen.getByText("Steckdose"));
    expect(callService).not.toHaveBeenCalled();
  });
});
