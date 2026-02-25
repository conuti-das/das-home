import { registerCard } from "./CardRegistry";
import { SwitchCard } from "./SwitchCard";
import { SensorCard } from "./SensorCard";
import { LightCard } from "./LightCard";
import { ClimateCard } from "./ClimateCard";
import { MediaPlayerCard } from "./MediaPlayerCard";
import { SceneCard } from "./SceneCard";
import { HacsCardBridge } from "./HacsCardBridge";

// Register all built-in card types
registerCard("switch", SwitchCard);
registerCard("input_boolean", SwitchCard);
registerCard("sensor", SensorCard);
registerCard("light", LightCard);
registerCard("climate", ClimateCard);
registerCard("media_player", MediaPlayerCard);
registerCard("scene", SceneCard);
registerCard("hacs", HacsCardBridge);

export { BaseCard } from "./BaseCard";
export { CardErrorBoundary } from "./CardErrorBoundary";
export { getCardComponent, getRegisteredTypes } from "./CardRegistry";
export type { CardComponentProps } from "./CardRegistry";
