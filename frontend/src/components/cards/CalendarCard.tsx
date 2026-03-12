import { Icon } from "@ui5/webcomponents-react";
import { useEntity, useEntitiesByDomain } from "@/hooks/useEntity";
import { CardErrorBoundary } from "./CardErrorBoundary";
import type { CardComponentProps } from "./CardRegistry";
import "./CalendarCard.css";

interface CalendarEvent {
  summary: string;
  start: string;
  end?: string;
  allDay?: boolean;
}

function formatEventTime(start: string, allDay?: boolean): string {
  if (allDay) return "Ganztägig";
  try {
    const d = new Date(start);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    if (isToday) return time;
    if (isTomorrow) return `Morgen ${time}`;

    const day = d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
    return `${day} ${time}`;
  } catch {
    return start;
  }
}

function isEventToday(start: string): boolean {
  try {
    return new Date(start).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

export function CalendarCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const calEntities = useEntitiesByDomain("calendar");

  // Use specific entity or first calendar
  const cal = entity || calEntities[0];
  if (!cal) {
    return (
      <CardErrorBoundary cardType="calendar">
        <div className="cal-card">
          <div className="cal-card__header">
            <span className="cal-card__name">Kalender</span>
            <Icon name="calendar" style={{ width: 20, height: 20, opacity: 0.4 }} />
          </div>
          <div className="cal-card__empty">Keine Termine</div>
        </div>
      </CardErrorBoundary>
    );
  }

  const name = (cal.attributes?.friendly_name as string) || cal.entity_id;

  // Try to extract events from attributes
  const events: CalendarEvent[] = [];

  // Primary event from entity state
  const message = cal.attributes?.message as string | undefined;
  const startTime = cal.attributes?.start_time as string | undefined;
  const endTime = cal.attributes?.end_time as string | undefined;
  const allDay = cal.attributes?.all_day as boolean | undefined;

  if (message && startTime) {
    events.push({ summary: message, start: startTime, end: endTime, allDay });
  } else if (message) {
    events.push({ summary: message, start: new Date().toISOString(), allDay: true });
  }

  // Check for additional scheduled events in attributes (some integrations provide this)
  const scheduled = cal.attributes?.scheduled_events as CalendarEvent[] | undefined;
  if (scheduled && Array.isArray(scheduled)) {
    for (const evt of scheduled) {
      if (events.length >= 4) break;
      if (!events.find((e) => e.summary === evt.summary && e.start === evt.start)) {
        events.push(evt);
      }
    }
  }

  const hasEvents = events.length > 0;

  return (
    <CardErrorBoundary cardType="calendar">
      <div className="cal-card">
        <div className="cal-card__header">
          <span className="cal-card__name">{name}</span>
          <Icon name="calendar" style={{ width: 20, height: 20, opacity: 0.4, color: "var(--dh-gray100)" }} />
        </div>

        {!hasEvents && (
          <div className="cal-card__empty">Keine anstehenden Termine</div>
        )}

        {hasEvents && (
          <div className="cal-card__events">
            {events.slice(0, 4).map((evt, i) => (
              <div key={i} className={`cal-card__event ${i === 0 ? "cal-card__event--next" : ""}`}>
                <div className="cal-card__event-dot" style={{
                  background: isEventToday(evt.start) ? "var(--dh-blue)" : "var(--dh-gray100)",
                  opacity: isEventToday(evt.start) ? 1 : 0.3,
                }} />
                <div className="cal-card__event-content">
                  <div className="cal-card__event-title">{evt.summary}</div>
                  <div className="cal-card__event-time">
                    {formatEventTime(evt.start, evt.allDay)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardErrorBoundary>
  );
}
