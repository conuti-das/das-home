export interface DomainStyle {
  color: string;
  tint: string;
  iconBg: string;
}

const DOMAIN_COLORS: Record<string, DomainStyle> = {
  light:               { color: "var(--dh-yellow)",  tint: "var(--dh-yellow-tint)",  iconBg: "rgba(242,201,76,0.15)" },
  switch:              { color: "var(--dh-yellow)",  tint: "var(--dh-yellow-tint)",  iconBg: "rgba(242,201,76,0.15)" },
  input_boolean:       { color: "var(--dh-yellow)",  tint: "var(--dh-yellow-tint)",  iconBg: "rgba(242,201,76,0.15)" },
  climate:             { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  fan:                 { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  humidifier:          { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  sensor:              { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  binary_sensor:       { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  media_player:        { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  cover:               { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  automation:          { color: "var(--dh-purple)",  tint: "var(--dh-purple-tint)",  iconBg: "rgba(187,107,217,0.15)" },
  script:              { color: "var(--dh-purple)",  tint: "var(--dh-purple-tint)",  iconBg: "rgba(187,107,217,0.15)" },
  alarm:               { color: "var(--dh-red)",     tint: "var(--dh-red-tint)",     iconBg: "rgba(235,87,87,0.15)" },
  alarm_control_panel: { color: "var(--dh-red)",     tint: "var(--dh-red-tint)",     iconBg: "rgba(235,87,87,0.15)" },
  lock:                { color: "var(--dh-red)",     tint: "var(--dh-red-tint)",     iconBg: "rgba(235,87,87,0.15)" },
  person:              { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  weather:             { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  scene:               { color: "var(--dh-orange)",  tint: "var(--dh-orange-tint)",  iconBg: "rgba(242,153,74,0.15)" },
  button:              { color: "var(--dh-orange)",  tint: "var(--dh-orange-tint)",  iconBg: "rgba(242,153,74,0.15)" },
  vacuum:              { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  camera:              { color: "var(--dh-gray100)", tint: "var(--dh-gray200)",      iconBg: "rgba(250,251,252,0.1)" },
  timer:               { color: "var(--dh-orange)",  tint: "var(--dh-orange-tint)",  iconBg: "rgba(242,153,74,0.15)" },
  update:              { color: "var(--dh-pink)",    tint: "var(--dh-pink-tint)",    iconBg: "rgba(242,160,183,0.15)" },
  number:              { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  select:              { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
};

const DEFAULT_STYLE: DomainStyle = {
  color: "var(--dh-gray100)",
  tint: "var(--dh-gray200)",
  iconBg: "rgba(250,251,252,0.1)",
};

export function getDomainStyle(entityIdOrDomain: string): DomainStyle {
  const domain = entityIdOrDomain.includes(".") ? entityIdOrDomain.split(".")[0] : entityIdOrDomain;
  return DOMAIN_COLORS[domain] || DEFAULT_STYLE;
}

export function getDomainFromEntity(entityId: string): string {
  return entityId.split(".")[0];
}
