type Stop = {
  id: string;
  label: string;
  area: string;
};

const areaCoordinates: Record<string, { lat: number; lng: number }> = {
  "Dubai Marina": { lat: 25.0805, lng: 55.1403 },
  JLT: { lat: 25.0694, lng: 55.1413 },
  "Business Bay": { lat: 25.185, lng: 55.2644 },
  "Palm Jumeirah": { lat: 25.1124, lng: 55.139 },
  "Downtown Dubai": { lat: 25.1972, lng: 55.2744 },
};

function fallbackSort(stops: Stop[]) {
  return [...stops].sort((a, b) => a.area.localeCompare(b.area));
}

export async function optimizeProviderRoute(stops: Stop[]) {
  const key = process.env.EXPO_PUBLIC_GRAPHHOPPER_KEY;
  const withCoords = stops.filter((stop) => areaCoordinates[stop.area]);

  if (!key || withCoords.length < 2) {
    return {
      provider: "local-fallback",
      stops: fallbackSort(stops),
    };
  }

  try {
    const points = withCoords
      .map((stop) => {
        const point = areaCoordinates[stop.area];
        return `point=${point.lat},${point.lng}`;
      })
      .join("&");
    const url = `https://graphhopper.com/api/1/route?${points}&profile=car&locale=en&calc_points=false&key=${key}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("GraphHopper request failed");
    await response.json();
    return {
      provider: "graphhopper",
      stops: withCoords,
    };
  } catch {
    return {
      provider: "local-fallback",
      stops: fallbackSort(stops),
    };
  }
}
