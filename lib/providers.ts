import type { Place, TransportMode } from "./models";

export type DirectionsTravelMode = "walking" | "transit" | "driving";

export interface DirectionsRequest {
  destination: Place;
  origin?: Place;
  waypoints?: Place[];
  travelMode?: DirectionsTravelMode;
}

export interface MapProvider {
  openDirections(request: DirectionsRequest): void;
}

export interface PlaceProvider {
  search(query: string, places: Place[]): Promise<Place[]>;
}

export function toDirectionsMode(mode?: TransportMode): DirectionsTravelMode {
  if (mode === "대중교통") return "transit";
  if (mode === "택시") return "driving";
  return "walking";
}

function placeQuery(place: Place) {
  return `${place.name}, ${place.address}`;
}

export const googleMapsProvider: MapProvider = {
  openDirections({ origin, destination, waypoints, travelMode = "walking" }) {
    const params = new URLSearchParams({
      api: "1",
      destination: placeQuery(destination),
      travelmode: travelMode,
    });
    if (origin) params.set("origin", placeQuery(origin));
    if (waypoints?.length) params.set("waypoints", waypoints.map(placeQuery).join("|"));
    window.open(
      `https://www.google.com/maps/dir/?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  },
};

export const mockPlaceProvider: PlaceProvider = {
  async search(query, places) {
    const term = query.trim().toLowerCase();
    return term
      ? places.filter((place) =>
          `${place.name} ${place.category} ${place.address}`
            .toLowerCase()
            .includes(term),
        )
      : places;
  },
};
