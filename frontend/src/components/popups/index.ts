import { registerPopup } from "./PopupRegistry";
import { WeatherPopupV2 } from "./WeatherPopupV2";
import { TrashPopup } from "./TrashPopup";
import { AreaPopup } from "./AreaPopup";
import { LightsPopup } from "./LightsPopup";
import { LightDetailPopup } from "./LightDetailPopup";
import { MediaPlayerPopup } from "./MediaPlayerPopup";
import { VehiclePopup } from "./VehiclePopup";
import { SonosGroupPopup } from "./SonosGroupPopup";
import { CalendarPopup } from "./CalendarPopup";

registerPopup("weather", WeatherPopupV2);
registerPopup("trash", TrashPopup);
registerPopup("calendar", CalendarPopup);
registerPopup("area", AreaPopup);
registerPopup("lights", LightsPopup);
registerPopup("light-detail", LightDetailPopup);
registerPopup("media-detail", MediaPlayerPopup);
registerPopup("vehicle-detail", VehiclePopup);
registerPopup("sonos-group", SonosGroupPopup);

export { getPopupComponent } from "./PopupRegistry";
export type { PopupProps } from "./PopupRegistry";
