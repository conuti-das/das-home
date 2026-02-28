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
import { RadarCard } from "./RadarCard";
import { TrashCard } from "./TrashCard";
import { AreaCard, AreaCardSmall } from "./AreaCard";
import { VehicleCard } from "./VehicleCard";

// Group A: Display-only (Anzeige)
registerCard("sensor", SensorCard, {
  displayName: "Sensor",
  description: "Zeigt Sensorwerte wie Temperatur, Luftfeuchtigkeit oder Energie an",
  category: "anzeige",
  compatibleDomains: ["sensor", "binary_sensor", "number"],
  defaultSize: "1x1",
  iconName: "measurement-document",
});
registerCard("binary_sensor", BinarySensorCard, {
  displayName: "Binärsensor",
  description: "Zeigt An/Aus-Zustände wie Tür offen/geschlossen",
  category: "anzeige",
  compatibleDomains: ["binary_sensor", "sensor"],
  defaultSize: "1x1",
  iconName: "circle-task-2",
});
registerCard("weather", WeatherCard, {
  displayName: "Wetter",
  description: "Wettervorhersage mit Temperatur und Bedingungen",
  category: "anzeige",
  compatibleDomains: ["weather"],
  defaultSize: "2x2",
  iconName: "weather-proofing",
});
registerCard("person", PersonCard, {
  displayName: "Person",
  description: "Zeigt Standort und Anwesenheit einer Person",
  category: "anzeige",
  compatibleDomains: ["person", "device_tracker"],
  defaultSize: "1x1",
  iconName: "employee",
});
registerCard("calendar", CalendarCard, {
  displayName: "Kalender",
  description: "Zeigt anstehende Kalendertermine",
  category: "anzeige",
  compatibleDomains: ["calendar"],
  defaultSize: "2x1",
  iconName: "calendar",
});
registerCard("update", UpdateCard, {
  displayName: "Update",
  description: "Zeigt verfügbare Firmware- und Software-Updates",
  category: "anzeige",
  compatibleDomains: ["update"],
  defaultSize: "1x1",
  iconName: "download",
});

// Group B: Simple toggles / actions (Steuerung)
registerCard("switch", SwitchCard, {
  displayName: "Schalter",
  description: "Ein/Aus-Schalter für Geräte und Automationen",
  category: "steuerung",
  compatibleDomains: ["switch", "input_boolean"],
  defaultSize: "1x1",
  iconName: "switch-views",
});
registerCard("input_boolean", SwitchCard, {
  displayName: "Input Boolean",
  description: "Ein/Aus-Helfer für Automationen",
  category: "steuerung",
  compatibleDomains: ["input_boolean", "switch"],
  defaultSize: "1x1",
  iconName: "sys-enter-2",
});
registerCard("button", ButtonCard, {
  displayName: "Button",
  description: "Einmaliger Knopfdruck zum Auslösen von Aktionen",
  category: "steuerung",
  compatibleDomains: ["button", "input_button"],
  defaultSize: "1x1",
  iconName: "touch",
});
registerCard("automation", AutomationCard, {
  displayName: "Automation",
  description: "Automations-Status anzeigen und manuell auslösen",
  category: "steuerung",
  compatibleDomains: ["automation"],
  defaultSize: "1x1",
  iconName: "process",
});
registerCard("lock", LockCard, {
  displayName: "Schloss",
  description: "Türschloss verriegeln und entriegeln",
  category: "steuerung",
  compatibleDomains: ["lock"],
  defaultSize: "1x1",
  iconName: "locked",
});
registerCard("script", ScriptCard, {
  displayName: "Skript",
  description: "Skripte starten und deren Status sehen",
  category: "steuerung",
  compatibleDomains: ["script"],
  defaultSize: "1x1",
  iconName: "syntax",
});
registerCard("scene", SceneCard, {
  displayName: "Szene",
  description: "Szenen aktivieren für vordefinierte Zustände",
  category: "steuerung",
  compatibleDomains: ["scene"],
  defaultSize: "1x1",
  iconName: "palette",
});

// Group C: Slider-based (Steuerung)
registerCard("light", LightCard, {
  displayName: "Licht",
  description: "Licht dimmen, Farbe ändern und ein-/ausschalten",
  category: "steuerung",
  compatibleDomains: ["light"],
  defaultSize: "1x1",
  iconName: "lightbulb",
});
registerCard("cover", CoverCard, {
  displayName: "Abdeckung",
  description: "Rollläden, Jalousien und Garagentore steuern",
  category: "steuerung",
  compatibleDomains: ["cover"],
  defaultSize: "1x1",
  iconName: "open-command-field",
});
registerCard("fan", FanCard, {
  displayName: "Ventilator",
  description: "Ventilator-Geschwindigkeit und -Modus steuern",
  category: "steuerung",
  compatibleDomains: ["fan"],
  defaultSize: "1x1",
  iconName: "bbyd-active-sales",
});
registerCard("humidifier", HumidifierCard, {
  displayName: "Luftbefeuchter",
  description: "Luftbefeuchter und Ziel-Luftfeuchtigkeit steuern",
  category: "steuerung",
  compatibleDomains: ["humidifier"],
  defaultSize: "1x1",
  iconName: "general-leave-request",
});
registerCard("number", NumberCard, {
  displayName: "Zahlenwert",
  description: "Numerische Eingabe mit Slider oder Textfeld",
  category: "steuerung",
  compatibleDomains: ["number", "input_number"],
  defaultSize: "1x1",
  iconName: "number-sign",
});
registerCard("select", SelectCard, {
  displayName: "Auswahl",
  description: "Dropdown-Auswahl zwischen vordefinierten Optionen",
  category: "steuerung",
  compatibleDomains: ["select", "input_select"],
  defaultSize: "1x1",
  iconName: "dropdown",
});

// Group D: Complex (Komplex)
registerCard("climate", ClimateCard, {
  displayName: "Klima",
  description: "Heizung und Klimaanlage mit Temperaturregelung",
  category: "komplex",
  compatibleDomains: ["climate"],
  defaultSize: "2x1",
  iconName: "temperature",
});
registerCard("media_player", MediaPlayerCard, {
  displayName: "Media Player",
  description: "Musik und Video abspielen, pausieren, Lautstärke regeln",
  category: "komplex",
  compatibleDomains: ["media_player"],
  defaultSize: "2x1",
  iconName: "play",
});
registerCard("vacuum", VacuumCard, {
  displayName: "Saugroboter",
  description: "Saugroboter starten, stoppen und Status anzeigen",
  category: "komplex",
  compatibleDomains: ["vacuum"],
  defaultSize: "2x1",
  iconName: "family-care",
});
registerCard("alarm", AlarmCard, {
  displayName: "Alarm",
  description: "Alarmanlage scharf/unscharf schalten",
  category: "komplex",
  compatibleDomains: ["alarm_control_panel"],
  defaultSize: "2x1",
  iconName: "alert",
});
registerCard("alarm_control_panel", AlarmCard, {
  displayName: "Alarmanlage",
  description: "Alarmanlage scharf/unscharf schalten",
  category: "komplex",
  compatibleDomains: ["alarm_control_panel"],
  defaultSize: "2x1",
  iconName: "alert",
});
registerCard("camera", CameraCard, {
  displayName: "Kamera",
  description: "Live-Kamerabild und Schnappschüsse anzeigen",
  category: "komplex",
  compatibleDomains: ["camera"],
  defaultSize: "2x2",
  iconName: "camera",
});
registerCard("timer", TimerCard, {
  displayName: "Timer",
  description: "Timer starten, pausieren und Restzeit anzeigen",
  category: "komplex",
  compatibleDomains: ["timer"],
  defaultSize: "1x1",
  iconName: "fob-watch",
});

// Group E: Special (Spezial)
registerCard("iframe", IframeCard, {
  displayName: "iFrame",
  description: "Externe Webseite oder Dashboard einbetten",
  category: "spezial",
  compatibleDomains: [],
  defaultSize: "2x2",
  iconName: "internet-browser",
});
registerCard("markdown", MarkdownCard, {
  displayName: "Markdown",
  description: "Freitext mit Markdown-Formatierung anzeigen",
  category: "spezial",
  compatibleDomains: [],
  defaultSize: "2x1",
  iconName: "document-text",
});
registerCard("group", GroupCard, {
  displayName: "Gruppe",
  description: "Mehrere Entities in einer Karte zusammenfassen",
  category: "spezial",
  compatibleDomains: ["group"],
  defaultSize: "2x1",
  iconName: "group",
});
registerCard("hacs", HacsCardBridge, {
  displayName: "HACS Karte",
  description: "Custom-Karte aus HACS-Integration laden",
  category: "spezial",
  compatibleDomains: [],
  defaultSize: "2x1",
  iconName: "add-product",
});

// Group F: New card types
registerCard("radar", RadarCard, {
  displayName: "Regenradar",
  description: "Niederschlagsradar für den aktuellen Standort",
  category: "spezial",
  compatibleDomains: [],
  defaultSize: "2x2",
  iconName: "radar-chart",
});
registerCard("trash", TrashCard, {
  displayName: "Müllabfuhr",
  description: "Nächste Müllabholtermine anzeigen",
  category: "spezial",
  compatibleDomains: ["calendar", "sensor"],
  defaultSize: "2x1",
  iconName: "delete",
});
registerCard("area", AreaCard, {
  displayName: "Bereich",
  description: "Bereichsübersicht mit Geräteanzahl und Schnellzugriff",
  category: "spezial",
  compatibleDomains: [],
  defaultSize: "2x2",
  iconName: "home",
});
registerCard("area_small", AreaCardSmall, {
  displayName: "Bereich (klein)",
  description: "Kompakte Bereichsanzeige mit Status",
  category: "spezial",
  compatibleDomains: [],
  defaultSize: "1x1",
  iconName: "home",
});
registerCard("vehicle", VehicleCard, {
  displayName: "Fahrzeug",
  description: "Fahrzeug-Status mit Batterie, Reichweite und Türen",
  category: "komplex",
  compatibleDomains: ["device_tracker", "sensor", "binary_sensor"],
  defaultSize: "2x3",
  iconName: "car-rental",
});

export { BaseCard } from "./BaseCard";
export { CardErrorBoundary } from "./CardErrorBoundary";
export { getCardComponent, getRegisteredTypes, getCardMetadata, getAllMetadata, getCardsByCategory } from "./CardRegistry";
export type { CardComponentProps, CardMetadata, CardCategory } from "./CardRegistry";
