import { NextRequest, NextResponse } from "next/server";
import {
  PlaceSuggestion,
  resolveNearestCity,
  searchPlacesLocal,
} from "@/lib/location/nearby";

interface GoogleAutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

/**
 * Location Search Route Handler:
 * - Uses Google Places Autocomplete + Details API when GOOGLE_MAPS_API_KEY
 *   (or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) is configured in environment variables.
 * - Falls back cleanly to our Indian Places, Towns & Villages directory in demo mode.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const fallbackCity = searchParams.get("city") ?? "Hyderabad";
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey && query.trim().length >= 2) {
    try {
      const autoUrl = new URL(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json"
      );
      autoUrl.searchParams.set("input", query.trim());
      autoUrl.searchParams.set("components", "country:in");
      autoUrl.searchParams.set("key", apiKey);

      const autoRes = await fetch(autoUrl.toString());
      const autoJson = (await autoRes.json()) as {
        status?: string;
        predictions?: GoogleAutocompletePrediction[];
      };

      if (autoJson.status === "OK" && Array.isArray(autoJson.predictions)) {
        const detailed: PlaceSuggestion[] = [];
        for (const pred of autoJson.predictions.slice(0, 5)) {
          const detUrl = new URL(
            "https://maps.googleapis.com/maps/api/place/details/json"
          );
          detUrl.searchParams.set("place_id", pred.place_id);
          detUrl.searchParams.set("fields", "geometry,address_components,name");
          detUrl.searchParams.set("key", apiKey);

          const detRes = await fetch(detUrl.toString());
          const detJson = (await detRes.json()) as {
            result?: {
              name?: string;
              geometry?: { location?: { lat: number; lng: number } };
              address_components?: Array<{
                long_name: string;
                types: string[];
              }>;
            };
          };
          const loc = detJson.result?.geometry?.location;
          if (!loc) continue;
          const nearest = resolveNearestCity(loc.lat, loc.lng);
          const localityComp = detJson.result?.address_components?.find((c) =>
            c.types.includes("locality")
          )?.long_name;
          const stateComp = detJson.result?.address_components?.find((c) =>
            c.types.includes("administrative_area_level_1")
          )?.long_name;

          detailed.push({
            id: pred.place_id,
            label:
              pred.structured_formatting?.main_text ||
              detJson.result?.name ||
              pred.description,
            secondaryText:
              pred.structured_formatting?.secondary_text || pred.description,
            city: localityComp || nearest.city,
            state: stateComp || "India",
            kind: "area",
            lat: loc.lat,
            lng: loc.lng,
            source: "GOOGLE_PLACES",
          });
        }
        if (detailed.length > 0) {
          return NextResponse.json({
            provider: "GOOGLE_PLACES",
            places: detailed,
          });
        }
      }
    } catch {
      // gracefully fall back to mock directory if Google API fails
    }
  }

  const places = searchPlacesLocal(query, fallbackCity);
  return NextResponse.json({
    provider: "MOCK_DIRECTORY_GOOGLE_READY",
    places,
  });
}
