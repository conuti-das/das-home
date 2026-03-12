import { useEffect, useState, useCallback, useMemo } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import { api } from "@/services/api";
import { CardErrorBoundary } from "./CardErrorBoundary";
import type { CardComponentProps } from "./CardRegistry";
import "./CalendarCard.css";

interface CalEvent {
  summary: string;
  startTime: Date;
  endTime?: Date;
  allDay: boolean;
}

function formatEventTime(d: Date, allDay?: boolean): string {
  if (allDay) return "Ganztägig";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  if (isTomorrow) return `Morgen ${time}`;
  return `${d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })} ${time}`;
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "Jetzt";
  if (minutes < 60) return `in ${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `in ${h} Std ${m} Min` : `in ${h} Std`;
}

export function CalendarCard({ card, onCardAction }: CardComponentProps) {
  const allCalEntities = useEntitiesByDomain("calendar");
  const [events, setEvents] = useState<CalEvent[]>([]);

  // Use the card's configured entity if set, otherwise use all calendar entities
  const calEntities = useMemo(() => {
    if (card.entity && card.entity.startsWith("calendar.")) {
      const match = allCalEntities.find((e) => e.entity_id === card.entity);
      return match ? [match] : [];
    }
    return allCalEntities;
  }, [card.entity, allCalEntities]);

  const fetchEvents = useCallback(async () => {
    if (calEntities.length === 0) return;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = startOfDay.toISOString();
    const end = endOfDay.toISOString();

    const allEvents: CalEvent[] = [];
    for (const cal of calEntities) {
      try {
        const data = await api.getCalendarEvents(cal.entity_id, start, end);
        for (const ev of data) {
          const startStr = ev.start?.dateTime || ev.start?.date || "";
          const endStr = ev.end?.dateTime || ev.end?.date || "";
          allEvents.push({
            summary: ev.summary,
            startTime: new Date(startStr),
            endTime: endStr ? new Date(endStr) : undefined,
            allDay: !ev.start?.dateTime,
          });
        }
      } catch {
        // Fallback: use entity state
        const msg = cal.attributes?.message as string | undefined;
        const st = cal.attributes?.start_time as string | undefined;
        if (msg && st) {
          allEvents.push({
            summary: msg,
            startTime: new Date(st),
            allDay: !!(cal.attributes?.all_day),
          });
        }
      }
    }
    allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    setEvents(allEvents);
  }, [calEntities]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Find first upcoming event for countdown
  const now = Date.now();
  const nextEvent = events.find((e) => !e.allDay && e.startTime.getTime() > now);
  const minutesUntil = nextEvent ? Math.round((nextEvent.startTime.getTime() - now) / 60000) : null;

  // Show card entity name or generic "Kalender"
  const calName = card.entity && calEntities.length === 1
    ? ((calEntities[0].attributes?.friendly_name as string) || "Kalender")
    : "Kalender";

  return (
    <CardErrorBoundary cardType="calendar">
      <div className="cal-card" onClick={() => onCardAction?.("calendar")}>
        <div className="cal-card__header">
          <span className="cal-card__name">{calName}</span>
          <Icon name="calendar" style={{ width: 20, height: 20, opacity: 0.4, color: "var(--dh-gray100)" }} />
        </div>

        {events.length === 0 ? (
          <div className="cal-card__empty">Keine anstehenden Termine</div>
        ) : (
          <div className="cal-card__events">
            {minutesUntil !== null && minutesUntil >= 0 && (
              <div className="cal-card__countdown">
                {formatCountdown(minutesUntil)}
              </div>
            )}

            {events.slice(0, 4).map((ev, i) => (
              <div key={i} className={`cal-card__event ${i === 0 ? "cal-card__event--next" : ""}`}>
                <div className="cal-card__event-dot" style={{ background: i === 0 ? "var(--dh-blue)" : "var(--dh-gray100)", opacity: i === 0 ? 1 : 0.3 }} />
                <div className="cal-card__event-content">
                  <div className="cal-card__event-title">{ev.summary}</div>
                  <div className="cal-card__event-time">
                    {formatEventTime(ev.startTime, ev.allDay)}
                  </div>
                </div>
              </div>
            ))}

            {events.length > 4 && (
              <div className="cal-card__event-time" style={{ paddingLeft: 16 }}>
                +{events.length - 4} weitere
              </div>
            )}
          </div>
        )}
      </div>
    </CardErrorBoundary>
  );
}
