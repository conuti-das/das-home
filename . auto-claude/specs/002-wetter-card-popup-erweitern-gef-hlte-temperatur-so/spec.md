# Quick Spec: Weather Popup - Gefühlte Temperatur & Sonnenzeiten

## Task
Erweitere das Weather Card Popup um gefühlte Temperatur und Sonnenauf-/untergangszeiten.

## Files to Modify
- `frontend/src/components/dashboard/WeatherPopup.tsx` - Add feels_like display and sun times section

## Change Details

### 1. Gefühlte Temperatur (Feels Like)
- **Location**: Im Current Weather Header, direkt neben/unter der aktuellen Temperatur
- **Format**: `21° (gefühlt 23°)`
- **Data source**: `weather.attributes.feels_like` (already available)
- **Implementation**: Add conditional rendering after main temperature display

### 2. Sonnenauf-/untergang (Sun Times)
- **Location**: Unterhalb des Current Weather Headers, vor dem Stats Strip
- **Format**: `☀️ Auf: 06:42  |  🌙 Unter: 20:18`
- **Data source**: `weather.attributes.sun_rise` and `weather.attributes.sun_set` (already available)
- **Implementation**: New section with icon + time formatting (HH:mm)

### Styling Notes
- Follow existing WeatherPopup styling patterns
- Ensure mobile responsive layout
- Use existing icon/emoji approach for visual clarity
- Maintain consistency with current design system

## Verification
- [ ] Gefühlte Temperatur appears in popup header when available
- [ ] Sunrise/Sunset times display correctly formatted
- [ ] Layout remains mobile responsive
- [ ] No console errors
- [ ] Design consistent with existing styles

## Notes
- All data already available in entity attributes - no backend changes needed
- Pure frontend/UI implementation
- Graceful handling if attributes are missing/undefined
