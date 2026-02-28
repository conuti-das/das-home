import { registerPopup } from "./PopupRegistry";
import { WeatherPopup } from "./WeatherPopup";
import { TrashPopup } from "./TrashPopup";
import { AreaPopup } from "./AreaPopup";
import { LightsPopup } from "./LightsPopup";
import { LightDetailPopup } from "./LightDetailPopup";
import { MediaPlayerPopup } from "./MediaPlayerPopup";
import { VehiclePopup } from "./VehiclePopup";

registerPopup("weather", WeatherPopup);
registerPopup("trash", TrashPopup);
registerPopup("area", AreaPopup);
registerPopup("lights", LightsPopup);
registerPopup("light-detail", LightDetailPopup);
registerPopup("media-detail", MediaPlayerPopup);
registerPopup("vehicle-detail", VehiclePopup);

export { getPopupComponent } from "./PopupRegistry";
export type { PopupProps } from "./PopupRegistry";
