import { registerCard } from "./CardRegistry";
import { SwitchCard } from "./SwitchCard";
import { SensorCard } from "./SensorCard";
import { LightCard } from "./LightCard";
import { ClimateCard } from "./ClimateCard";
import { MediaPlayerCard } from "./MediaPlayerCard";
import { SceneCard } from "./SceneCard";
import { HacsCardBridge } from "./HacsCardBridge";
import { BinarySensorCard } from "./BinarySensorCard";
import { WeatherCard } from "./WeatherCard";
import { PersonCard } from "./PersonCard";
import { CalendarCard } from "./CalendarCard";
import { UpdateCard } from "./UpdateCard";
import { ButtonCard } from "./ButtonCard";
import { AutomationCard } from "./AutomationCard";
import { LockCard } from "./LockCard";
import { ScriptCard } from "./ScriptCard";
import { CoverCard } from "./CoverCard";
import { FanCard } from "./FanCard";
import { HumidifierCard } from "./HumidifierCard";
import { NumberCard } from "./NumberCard";
import { SelectCard } from "./SelectCard";
import { VacuumCard } from "./VacuumCard";
import { AlarmCard } from "./AlarmCard";
import { CameraCard } from "./CameraCard";
import { TimerCard } from "./TimerCard";
import { IframeCard } from "./IframeCard";
import { MarkdownCard } from "./MarkdownCard";
import { GroupCard } from "./GroupCard";

// Group A: Display-only
registerCard("sensor", SensorCard);
registerCard("binary_sensor", BinarySensorCard);
registerCard("weather", WeatherCard);
registerCard("person", PersonCard);
registerCard("calendar", CalendarCard);
registerCard("update", UpdateCard);

// Group B: Simple toggles / actions
registerCard("switch", SwitchCard);
registerCard("input_boolean", SwitchCard);
registerCard("button", ButtonCard);
registerCard("automation", AutomationCard);
registerCard("lock", LockCard);
registerCard("script", ScriptCard);
registerCard("scene", SceneCard);

// Group C: Slider-based
registerCard("light", LightCard);
registerCard("cover", CoverCard);
registerCard("fan", FanCard);
registerCard("humidifier", HumidifierCard);
registerCard("number", NumberCard);
registerCard("select", SelectCard);

// Group D: Complex
registerCard("climate", ClimateCard);
registerCard("media_player", MediaPlayerCard);
registerCard("vacuum", VacuumCard);
registerCard("alarm", AlarmCard);
registerCard("alarm_control_panel", AlarmCard);
registerCard("camera", CameraCard);
registerCard("timer", TimerCard);

// Group E: Special
registerCard("iframe", IframeCard);
registerCard("markdown", MarkdownCard);
registerCard("group", GroupCard);
registerCard("hacs", HacsCardBridge);

export { BaseCard } from "./BaseCard";
export { CardErrorBoundary } from "./CardErrorBoundary";
export { getCardComponent, getRegisteredTypes } from "./CardRegistry";
export type { CardComponentProps } from "./CardRegistry";
