import { useState, useMemo, useEffect, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import { api } from "@/services/api";
import { PopupModal } from "@/components/layout/PopupModal";
import type { PopupProps } from "./PopupRegistry";
import "./CalendarPopup.css";

type ViewMode = "day" | "week" | "month";

const DAY_NAMES_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const DAY_NAMES_FULL = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONTH_NAMES = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const CAL_COLORS = [
  "var(--dh-blue)",
  "var(--dh-green)",
  "var(--dh-purple)",
  "var(--dh-orange)",
  "var(--dh-red)",
  "var(--dh-yellow)",
];

interface CalEvent {
  id: string;
  calendarName: string;
  title: string;
  start: Date;
  end?: Date;
  allDay: boolean;
  description?: string;
  location?: string;
  color: string;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function getWeekStart(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function formatDateHeader(d: Date): string {
  const now = new Date();
  if (isSameDay(d, now)) return "Heute";
  const tomorrow = addDays(now, 1);
  if (isSameDay(d, tomorrow)) return "Morgen";
  const yesterday = addDays(now, -1);
  if (isSameDay(d, yesterday)) return "Gestern";
  return `${DAY_NAMES_FULL[d.getDay()]}, ${d.getDate()}. ${MONTH_NAMES[d.getMonth()]}`;
}

export function CalendarPopup({ onClose }: PopupProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);

  const calEntities = useEntitiesByDomain("calendar");

  // Determine fetch range based on view mode
  const fetchRange = useMemo(() => {
    const d = selectedDate;
    if (viewMode === "day") {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = addDays(start, 1);
      return { start, end };
    } else if (viewMode === "week") {
      const start = getWeekStart(d);
      const end = addDays(start, 7);
      return { start, end };
    } else {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 7); // include overflow days
      // Start from the monday before month start
      const day = start.getDay();
      const offset = day === 0 ? 6 : day - 1;
      const gridStart = addDays(start, -offset);
      return { start: gridStart, end };
    }
  }, [selectedDate, viewMode]);

  const fetchEvents = useCallback(async () => {
    if (calEntities.length === 0) return;

    const startStr = fetchRange.start.toISOString();
    const endStr = fetchRange.end.toISOString();
    const allEvents: CalEvent[] = [];

    for (let i = 0; i < calEntities.length; i++) {
      const cal = calEntities[i];
      const calName = (cal.attributes?.friendly_name as string) || cal.entity_id;
      const color = CAL_COLORS[i % CAL_COLORS.length];

      try {
        const data = await api.getCalendarEvents(cal.entity_id, startStr, endStr);
        for (const ev of data) {
          const startDt = ev.start?.dateTime || ev.start?.date || "";
          const endDt = ev.end?.dateTime || ev.end?.date || "";
          allEvents.push({
            id: `${cal.entity_id}_${startDt}_${ev.summary}`,
            calendarName: calName,
            title: ev.summary,
            start: new Date(startDt),
            end: endDt ? new Date(endDt) : undefined,
            allDay: !ev.start?.dateTime,
            description: ev.description,
            location: ev.location,
            color,
          });
        }
      } catch {
        // Fallback: use entity state for current event
        const msg = cal.attributes?.message as string | undefined;
        const st = cal.attributes?.start_time as string | undefined;
        if (msg && st) {
          allEvents.push({
            id: cal.entity_id,
            calendarName: calName,
            title: msg,
            start: new Date(st),
            end: cal.attributes?.end_time ? new Date(cal.attributes.end_time as string) : undefined,
            allDay: !!(cal.attributes?.all_day),
            description: cal.attributes?.description as string | undefined,
            location: cal.attributes?.location as string | undefined,
            color,
          });
        }
      }
    }

    allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    setEvents(allEvents);
  }, [calEntities, fetchRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Events for a specific day
  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(e.start, day));

  const todayEvents = eventsForDay(selectedDate);

  // Navigate
  const navigate = (dir: number) => {
    if (viewMode === "day") setSelectedDate((d) => addDays(d, dir));
    else if (viewMode === "week") setSelectedDate((d) => addDays(d, dir * 7));
    else setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const goToday = () => setSelectedDate(new Date());

  const navTitle = viewMode === "day"
    ? formatDateHeader(selectedDate)
    : viewMode === "week"
      ? (() => {
          const ws = getWeekStart(selectedDate);
          const we = addDays(ws, 6);
          return `${ws.getDate()}.${ws.getMonth() + 1}. – ${we.getDate()}.${we.getMonth() + 1}.`;
        })()
      : `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  return (
    <PopupModal open title="Kalender" icon="calendar" onClose={onClose} className="calendar-popup-modal">
      {/* View tabs */}
      <div className="cal-popup__tabs">
        {(["day", "week", "month"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            className={`cal-popup__tab ${viewMode === mode ? "cal-popup__tab--active" : ""}`}
            onClick={() => setViewMode(mode)}
          >
            {mode === "day" ? "Tag" : mode === "week" ? "Woche" : "Monat"}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="cal-popup__nav">
        <button className="cal-popup__nav-btn" onClick={() => navigate(-1)}>
          <Icon name="navigation-left-arrow" style={{ width: 16, height: 16, color: "var(--dh-gray100)" }} />
        </button>
        <span className="cal-popup__nav-title">{navTitle}</span>
        {!isSameDay(selectedDate, new Date()) && (
          <button className="cal-popup__today-btn" onClick={goToday}>Heute</button>
        )}
        <button className="cal-popup__nav-btn" onClick={() => navigate(1)}>
          <Icon name="navigation-right-arrow" style={{ width: 16, height: 16, color: "var(--dh-gray100)" }} />
        </button>
      </div>

      {/* Week view */}
      {viewMode === "week" && <WeekStrip selectedDate={selectedDate} events={events} onSelectDay={(d) => { setSelectedDate(d); setViewMode("day"); }} />}

      {/* Month view */}
      {viewMode === "month" && <MonthGrid selectedDate={selectedDate} events={events} onSelectDay={(d) => { setSelectedDate(d); setViewMode("day"); }} />}

      {/* Events list */}
      {(viewMode === "day" || viewMode === "week") && (
        <div className="cal-popup__events">
          {todayEvents.length === 0 ? (
            <div className="cal-popup__empty">Keine Termine</div>
          ) : (
            todayEvents.map((ev) => (
              <div
                key={ev.id}
                className="cal-popup__event"
                onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
              >
                <div className="cal-popup__event-time-col">
                  {ev.allDay ? (
                    <span className="cal-popup__event-time" style={{ fontSize: 11 }}>Ganztag</span>
                  ) : (
                    <>
                      <span className="cal-popup__event-time">{formatTime(ev.start)}</span>
                      {ev.end && <span className="cal-popup__event-time-end">{formatTime(ev.end)}</span>}
                    </>
                  )}
                </div>
                <div className="cal-popup__event-dot" style={{ background: ev.color }} />
                <div className="cal-popup__event-body">
                  <div className="cal-popup__event-title">{ev.title}</div>
                  <div className="cal-popup__event-subtitle">{ev.calendarName}</div>
                  {expandedEvent === ev.id && (
                    <div className="cal-popup__event-details">
                      {ev.location && <div>Ort: {ev.location}</div>}
                      {ev.description && <div>{ev.description}</div>}
                      {!ev.location && !ev.description && <div>Keine weiteren Details</div>}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </PopupModal>
  );
}

function WeekStrip({ selectedDate, events, onSelectDay }: {
  selectedDate: Date;
  events: CalEvent[];
  onSelectDay: (d: Date) => void;
}) {
  const today = new Date();
  const weekStart = getWeekStart(selectedDate);

  return (
    <div className="cal-popup__week">
      {Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        const dayEvents = events.filter((e) => isSameDay(e.start, day));
        const isToday = isSameDay(day, today);
        const isActive = isSameDay(day, selectedDate);

        return (
          <div
            key={i}
            className={`cal-popup__week-day ${isActive ? "cal-popup__week-day--active" : ""} ${isToday ? "cal-popup__week-day--today" : ""}`}
            onClick={() => onSelectDay(day)}
          >
            <span className="cal-popup__week-day-name">{DAY_NAMES_SHORT[i]}</span>
            <span className="cal-popup__week-day-num">{day.getDate()}</span>
            <div className="cal-popup__week-day-dots">
              {dayEvents.slice(0, 3).map((e, j) => (
                <div key={j} className="cal-popup__week-day-dot" style={{ background: e.color }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthGrid({ selectedDate, events, onSelectDay }: {
  selectedDate: Date;
  events: CalEvent[];
  onSelectDay: (d: Date) => void;
}) {
  const today = new Date();
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const startDay = monthStart.getDay();
  const offset = startDay === 0 ? 6 : startDay - 1;
  const gridStart = addDays(monthStart, -offset);

  return (
    <div className="cal-popup__month">
      {DAY_NAMES_SHORT.map((name) => (
        <div key={name} className="cal-popup__month-header">{name}</div>
      ))}
      {Array.from({ length: 42 }, (_, i) => {
        const day = addDays(gridStart, i);
        const isThisMonth = day.getMonth() === selectedDate.getMonth();
        const isToday = isSameDay(day, today);
        const isActive = isSameDay(day, selectedDate);
        const dayEvents = events.filter((e) => isSameDay(e.start, day));

        return (
          <div
            key={i}
            className={`cal-popup__month-cell ${isToday ? "cal-popup__month-cell--today" : ""} ${isActive ? "cal-popup__month-cell--active" : ""} ${!isThisMonth ? "cal-popup__month-cell--other" : ""}`}
            onClick={() => onSelectDay(day)}
          >
            {day.getDate()}
            <div className="cal-popup__month-cell-dots">
              {dayEvents.slice(0, 3).map((e, j) => (
                <div key={j} className="cal-popup__month-cell-dot" style={{ background: e.color }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
