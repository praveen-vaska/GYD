import { DesignerProfile } from "@/types";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlaceSuggestion {
  id: string;
  label: string;
  secondaryText: string;
  city: string;
  state: string;
  kind: "city" | "area" | "town" | "village" | "custom";
  lat: number;
  lng: number;
  source: "MOCK_DIRECTORY" | "GOOGLE_PLACES";
}

export const CITY_COORDINATES: Record<string, Coordinates> = {
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  "New Delhi": { lat: 28.6139, lng: 77.209 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
};

/**
 * Comprehensive Indian Cities, Areas, Towns & Villages dataset used while
 * Google Maps Places API key is not configured. Ready to be superseded live
 * by Google Places Autocomplete & Geocoding API.
 */
export const INDIAN_PLACES_DIRECTORY: PlaceSuggestion[] = [
  // Telangana & Hyderabad belt (cities, suburbs, towns, villages)
  { id: "pl-hyd", label: "Hyderabad", secondaryText: "Telangana · Metro Hub", city: "Hyderabad", state: "Telangana", kind: "city", lat: 17.385, lng: 78.4867, source: "MOCK_DIRECTORY" },
  { id: "pl-jubilee", label: "Jubilee Hills", secondaryText: "Hyderabad, Telangana", city: "Hyderabad", state: "Telangana", kind: "area", lat: 17.4326, lng: 78.4071, source: "MOCK_DIRECTORY" },
  { id: "pl-banjara", label: "Banjara Hills", secondaryText: "Hyderabad, Telangana", city: "Hyderabad", state: "Telangana", kind: "area", lat: 17.4156, lng: 78.4347, source: "MOCK_DIRECTORY" },
  { id: "pl-madhapur", label: "Madhapur / HITEC City", secondaryText: "Hyderabad, Telangana", city: "Hyderabad", state: "Telangana", kind: "area", lat: 17.4483, lng: 78.3915, source: "MOCK_DIRECTORY" },
  { id: "pl-kukatpally", label: "Kukatpally", secondaryText: "Hyderabad, Telangana", city: "Hyderabad", state: "Telangana", kind: "area", lat: 17.4948, lng: 78.3996, source: "MOCK_DIRECTORY" },
  { id: "pl-secunderabad", label: "Secunderabad", secondaryText: "Telangana", city: "Hyderabad", state: "Telangana", kind: "city", lat: 17.4399, lng: 78.4983, source: "MOCK_DIRECTORY" },
  { id: "pl-kompally", label: "Kompally", secondaryText: "Medchal–Malkajgiri, Telangana", city: "Hyderabad", state: "Telangana", kind: "town", lat: 17.5403, lng: 78.4864, source: "MOCK_DIRECTORY" },
  { id: "pl-shamshabad", label: "Shamshabad", secondaryText: "Ranga Reddy Village/Town, Telangana", city: "Hyderabad", state: "Telangana", kind: "village", lat: 17.2564, lng: 78.3969, source: "MOCK_DIRECTORY" },
  { id: "pl-medchal", label: "Medchal", secondaryText: "Medchal Village/Mandal, Telangana", city: "Hyderabad", state: "Telangana", kind: "village", lat: 17.6297, lng: 78.4813, source: "MOCK_DIRECTORY" },
  { id: "pl-shadnagar", label: "Shadnagar", secondaryText: "Ranga Reddy Town/Village, Telangana", city: "Hyderabad", state: "Telangana", kind: "village", lat: 17.0715, lng: 78.2044, source: "MOCK_DIRECTORY" },
  { id: "pl-patancheru", label: "Patancheru", secondaryText: "Sangareddy, Telangana", city: "Hyderabad", state: "Telangana", kind: "town", lat: 17.5326, lng: 78.2644, source: "MOCK_DIRECTORY" },
  { id: "pl-chevella", label: "Chevella", secondaryText: "Ranga Reddy Village, Telangana", city: "Hyderabad", state: "Telangana", kind: "village", lat: 17.3065, lng: 78.1361, source: "MOCK_DIRECTORY" },
  { id: "pl-vikarabad", label: "Vikarabad", secondaryText: "Telangana", city: "Hyderabad", state: "Telangana", kind: "town", lat: 17.3364, lng: 77.9048, source: "MOCK_DIRECTORY" },
  { id: "pl-sangareddy", label: "Sangareddy", secondaryText: "Telangana", city: "Hyderabad", state: "Telangana", kind: "town", lat: 17.614, lng: 78.0816, source: "MOCK_DIRECTORY" },
  { id: "pl-siddipet", label: "Siddipet", secondaryText: "Telangana", city: "Hyderabad", state: "Telangana", kind: "town", lat: 18.1019, lng: 78.852, source: "MOCK_DIRECTORY" },
  { id: "pl-warangal", label: "Warangal", secondaryText: "Telangana", city: "Hyderabad", state: "Telangana", kind: "city", lat: 17.9689, lng: 79.5941, source: "MOCK_DIRECTORY" },
  { id: "pl-vijayawada", label: "Vijayawada", secondaryText: "Andhra Pradesh", city: "Hyderabad", state: "Andhra Pradesh", kind: "city", lat: 16.5062, lng: 80.648, source: "MOCK_DIRECTORY" },
  { id: "pl-tirupati", label: "Tirupati", secondaryText: "Andhra Pradesh", city: "Chennai", state: "Andhra Pradesh", kind: "city", lat: 13.6288, lng: 79.4192, source: "MOCK_DIRECTORY" },
  { id: "pl-visakhapatnam", label: "Visakhapatnam", secondaryText: "Andhra Pradesh", city: "Hyderabad", state: "Andhra Pradesh", kind: "city", lat: 17.6868, lng: 83.2185, source: "MOCK_DIRECTORY" },

  // Bengaluru & Karnataka belt
  { id: "pl-blr", label: "Bengaluru", secondaryText: "Karnataka · Metro Hub", city: "Bengaluru", state: "Karnataka", kind: "city", lat: 12.9716, lng: 77.5946, source: "MOCK_DIRECTORY" },
  { id: "pl-indiranagar", label: "Indiranagar", secondaryText: "Bengaluru, Karnataka", city: "Bengaluru", state: "Karnataka", kind: "area", lat: 12.9784, lng: 77.6408, source: "MOCK_DIRECTORY" },
  { id: "pl-koramangala", label: "Koramangala", secondaryText: "Bengaluru, Karnataka", city: "Bengaluru", state: "Karnataka", kind: "area", lat: 12.9352, lng: 77.6245, source: "MOCK_DIRECTORY" },
  { id: "pl-whitefield", label: "Whitefield", secondaryText: "Bengaluru, Karnataka", city: "Bengaluru", state: "Karnataka", kind: "area", lat: 12.9698, lng: 77.75, source: "MOCK_DIRECTORY" },
  { id: "pl-devanahalli", label: "Devanahalli", secondaryText: "Bengaluru Rural Village/Town, Karnataka", city: "Bengaluru", state: "Karnataka", kind: "village", lat: 13.2469, lng: 77.7118, source: "MOCK_DIRECTORY" },
  { id: "pl-hoskote", label: "Hoskote", secondaryText: "Bengaluru Rural Town/Village, Karnataka", city: "Bengaluru", state: "Karnataka", kind: "village", lat: 13.0706, lng: 77.7982, source: "MOCK_DIRECTORY" },
  { id: "pl-mysuru", label: "Mysuru", secondaryText: "Karnataka", city: "Bengaluru", state: "Karnataka", kind: "city", lat: 12.2958, lng: 76.6394, source: "MOCK_DIRECTORY" },

  // Mumbai & Maharashtra belt
  { id: "pl-bom", label: "Mumbai", secondaryText: "Maharashtra · Metro Hub", city: "Mumbai", state: "Maharashtra", kind: "city", lat: 19.076, lng: 72.8777, source: "MOCK_DIRECTORY" },
  { id: "pl-bandra", label: "Bandra West", secondaryText: "Mumbai, Maharashtra", city: "Mumbai", state: "Maharashtra", kind: "area", lat: 19.0596, lng: 72.8295, source: "MOCK_DIRECTORY" },
  { id: "pl-malabar", label: "Malabar Hill", secondaryText: "Mumbai, Maharashtra", city: "Mumbai", state: "Maharashtra", kind: "area", lat: 18.9548, lng: 72.7985, source: "MOCK_DIRECTORY" },
  { id: "pl-thane", label: "Thane", secondaryText: "Maharashtra", city: "Mumbai", state: "Maharashtra", kind: "city", lat: 19.2183, lng: 72.9781, source: "MOCK_DIRECTORY" },
  { id: "pl-navimumbai", label: "Navi Mumbai", secondaryText: "Maharashtra", city: "Mumbai", state: "Maharashtra", kind: "city", lat: 19.033, lng: 73.0297, source: "MOCK_DIRECTORY" },
  { id: "pl-alibaug", label: "Alibaug", secondaryText: "Raigad Coastal Town/Village, Maharashtra", city: "Mumbai", state: "Maharashtra", kind: "village", lat: 18.6414, lng: 72.8722, source: "MOCK_DIRECTORY" },
  { id: "pl-pune", label: "Pune", secondaryText: "Maharashtra · Metro Hub", city: "Pune", state: "Maharashtra", kind: "city", lat: 18.5204, lng: 73.8567, source: "MOCK_DIRECTORY" },
  { id: "pl-koregaon", label: "Koregaon Park", secondaryText: "Pune, Maharashtra", city: "Pune", state: "Maharashtra", kind: "area", lat: 18.5362, lng: 73.8939, source: "MOCK_DIRECTORY" },
  { id: "pl-lonavala", label: "Lonavala", secondaryText: "Pune District Town, Maharashtra", city: "Pune", state: "Maharashtra", kind: "town", lat: 18.7557, lng: 73.4091, source: "MOCK_DIRECTORY" },

  // Chennai & Tamil Nadu belt
  { id: "pl-maa", label: "Chennai", secondaryText: "Tamil Nadu · Metro Hub", city: "Chennai", state: "Tamil Nadu", kind: "city", lat: 13.0827, lng: 80.2707, source: "MOCK_DIRECTORY" },
  { id: "pl-mylapore", label: "Mylapore", secondaryText: "Chennai, Tamil Nadu", city: "Chennai", state: "Tamil Nadu", kind: "area", lat: 13.0338, lng: 80.2688, source: "MOCK_DIRECTORY" },
  { id: "pl-adyar", label: "Adyar", secondaryText: "Chennai, Tamil Nadu", city: "Chennai", state: "Tamil Nadu", kind: "area", lat: 13.0068, lng: 80.2574, source: "MOCK_DIRECTORY" },
  { id: "pl-tambaram", label: "Tambaram", secondaryText: "Chengalpattu, Tamil Nadu", city: "Chennai", state: "Tamil Nadu", kind: "town", lat: 12.9249, lng: 80.1, source: "MOCK_DIRECTORY" },
  { id: "pl-sriperumbudur", label: "Sriperumbudur", secondaryText: "Kancheepuram Village/Town, Tamil Nadu", city: "Chennai", state: "Tamil Nadu", kind: "village", lat: 12.9674, lng: 79.9419, source: "MOCK_DIRECTORY" },
  { id: "pl-mahabalipuram", label: "Mahabalipuram", secondaryText: "Coastal Town/Village, Tamil Nadu", city: "Chennai", state: "Tamil Nadu", kind: "village", lat: 12.6208, lng: 80.1945, source: "MOCK_DIRECTORY" },

  // NCR, Jaipur, Kochi, Kolkata
  { id: "pl-del", label: "New Delhi", secondaryText: "Delhi NCR · Metro Hub", city: "New Delhi", state: "Delhi", kind: "city", lat: 28.6139, lng: 77.209, source: "MOCK_DIRECTORY" },
  { id: "pl-gurugram", label: "Gurugram", secondaryText: "Haryana, NCR", city: "New Delhi", state: "Haryana", kind: "city", lat: 28.4595, lng: 77.0266, source: "MOCK_DIRECTORY" },
  { id: "pl-noida", label: "Noida", secondaryText: "Uttar Pradesh, NCR", city: "New Delhi", state: "Uttar Pradesh", kind: "city", lat: 28.5355, lng: 77.391, source: "MOCK_DIRECTORY" },
  { id: "pl-jaipur", label: "Jaipur", secondaryText: "Rajasthan · Hub", city: "Jaipur", state: "Rajasthan", kind: "city", lat: 26.9124, lng: 75.7873, source: "MOCK_DIRECTORY" },
  { id: "pl-kochi", label: "Kochi", secondaryText: "Kerala · Hub", city: "Kochi", state: "Kerala", kind: "city", lat: 9.9312, lng: 76.2673, source: "MOCK_DIRECTORY" },
  { id: "pl-aluva", label: "Aluva", secondaryText: "Ernakulam Town/Village, Kerala", city: "Kochi", state: "Kerala", kind: "village", lat: 10.1004, lng: 76.357, source: "MOCK_DIRECTORY" },
  { id: "pl-kolkata", label: "Kolkata", secondaryText: "West Bengal · Hub", city: "Kolkata", state: "West Bengal", kind: "city", lat: 22.5726, lng: 88.3639, source: "MOCK_DIRECTORY" },
];

/**
 * Distinct studio neighborhood offsets per designer so Haversine distances
 * reflect realistic intra-city proximity.
 */
export const DESIGNER_STUDIO_COORDINATES: Record<
  string,
  Coordinates & { neighborhood: string }
> = {
  "des-1": { lat: 17.4326, lng: 78.4071, neighborhood: "Jubilee Hills" },
  "des-2": { lat: 19.0596, lng: 72.8295, neighborhood: "Bandra West" },
  "des-3": { lat: 12.9784, lng: 77.6408, neighborhood: "Indiranagar" },
  "des-4": { lat: 28.5921, lng: 77.229, neighborhood: "Khan Market" },
  "des-5": { lat: 12.9352, lng: 77.6245, neighborhood: "Koramangala" },
  "des-6": { lat: 18.9548, lng: 72.7985, neighborhood: "Malabar Hill" },
  "des-7": { lat: 19.0176, lng: 72.8562, neighborhood: "Lower Parel" },
  "des-8": { lat: 13.0338, lng: 80.2688, neighborhood: "Mylapore" },
  "des-9": { lat: 13.0068, lng: 80.2574, neighborhood: "Adyar" },
  "des-10": { lat: 17.4156, lng: 78.4347, neighborhood: "Banjara Hills" },
  "des-11": { lat: 17.4483, lng: 78.3915, neighborhood: "Madhapur" },
  "des-12": { lat: 26.9025, lng: 75.7924, neighborhood: "C-Scheme" },
  "des-13": { lat: 18.5362, lng: 73.8939, neighborhood: "Koregaon Park" },
  "des-14": { lat: 12.9982, lng: 77.5718, neighborhood: "Sadashivanagar" },
  "des-15": { lat: 9.9672, lng: 76.2454, neighborhood: "Fort Kochi" },
  "des-16": { lat: 22.5396, lng: 88.3638, neighborhood: "Ballygunge" },
};

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function getDesignerCoordinates(designer: DesignerProfile): Coordinates {
  if (
    typeof designer.latitude === "number" &&
    typeof designer.longitude === "number"
  ) {
    return { lat: designer.latitude, lng: designer.longitude };
  }
  const studio = DESIGNER_STUDIO_COORDINATES[designer.id];
  if (studio) return { lat: studio.lat, lng: studio.lng };
  const matchedPlace = INDIAN_PLACES_DIRECTORY.find(
    (p) => p.label.toLowerCase() === designer.city.toLowerCase()
  );
  if (matchedPlace) return { lat: matchedPlace.lat, lng: matchedPlace.lng };
  return CITY_COORDINATES[designer.city] ?? CITY_COORDINATES.Hyderabad;
}

export function getDesignerNeighborhood(designer: DesignerProfile): string {
  return (
    designer.neighborhood ??
    DESIGNER_STUDIO_COORDINATES[designer.id]?.neighborhood ??
    designer.city
  );
}

export function resolveNearestCity(
  lat: number,
  lng: number
): { city: string; distanceToHubKm: number } {
  let closestCity = "Hyderabad";
  let minDistance = Number.POSITIVE_INFINITY;

  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    const dist = calculateDistanceKm(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestCity = city;
    }
  }

  return { city: closestCity, distanceToHubKm: minDistance };
}

/**
 * Search mock Indian cities, suburbs, towns, and villages, with an automatic
 * custom village/town fallback option so nearby designers in adjacent towns/cities
 * can always be resolved.
 */
export function searchPlacesLocal(
  query: string,
  fallbackHubCity = "Hyderabad"
): PlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return INDIAN_PLACES_DIRECTORY.slice(0, 10);
  }
  const matches = INDIAN_PLACES_DIRECTORY.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.secondaryText.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q)
  ).slice(0, 8);

  const exactMatch = matches.some(
    (m) => m.label.toLowerCase() === q
  );
  if (!exactMatch && q.length >= 2) {
    const hubCoords =
      CITY_COORDINATES[fallbackHubCity] ?? CITY_COORDINATES.Hyderabad;
    const cleanName = query.trim();
    matches.push({
      id: `custom-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      label: cleanName,
      secondaryText: `Search nearby designers around ${cleanName} (adjacent towns & cities)`,
      city: fallbackHubCity,
      state: "India",
      kind: "custom",
      // Slight deterministic offset around hub so nearby studios resolve sensibly
      lat: Number((hubCoords.lat + 0.14).toFixed(4)),
      lng: Number((hubCoords.lng - 0.11).toFixed(4)),
      source: "MOCK_DIRECTORY",
    });
  }
  return matches;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return "< 1 km away";
  if (km < 20) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}
