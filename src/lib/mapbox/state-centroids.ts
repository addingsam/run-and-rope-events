import { US_STATES } from "@/lib/us-states";

/** Approximate geographic centroids for state-level map clusters. */
export const STATE_CENTROIDS: Record<string, { lng: number; lat: number }> = {
  AL: { lng: -86.9023, lat: 32.3182 },
  AK: { lng: -152.4044, lat: 61.3707 },
  AZ: { lng: -111.0937, lat: 34.0489 },
  AR: { lng: -92.3731, lat: 34.7465 },
  CA: { lng: -119.4179, lat: 36.7783 },
  CO: { lng: -105.7821, lat: 39.5501 },
  CT: { lng: -72.7554, lat: 41.6032 },
  DE: { lng: -75.5277, lat: 38.9108 },
  FL: { lng: -81.5158, lat: 27.6648 },
  GA: { lng: -83.6431, lat: 32.1656 },
  HI: { lng: -155.5828, lat: 19.8968 },
  ID: { lng: -114.742, lat: 44.0682 },
  IL: { lng: -89.3985, lat: 40.6331 },
  IN: { lng: -86.1349, lat: 40.2672 },
  IA: { lng: -93.0977, lat: 41.878 },
  KS: { lng: -98.4842, lat: 39.0119 },
  KY: { lng: -84.27, lat: 37.8393 },
  LA: { lng: -91.9623, lat: 30.9843 },
  ME: { lng: -69.4455, lat: 45.2538 },
  MD: { lng: -76.6413, lat: 39.0458 },
  MA: { lng: -71.3824, lat: 42.4072 },
  MI: { lng: -85.6024, lat: 44.3148 },
  MN: { lng: -94.6859, lat: 46.7296 },
  MS: { lng: -89.3985, lat: 32.3547 },
  MO: { lng: -92.6038, lat: 38.5739 },
  MT: { lng: -110.3626, lat: 46.8797 },
  NE: { lng: -99.9018, lat: 41.4925 },
  NV: { lng: -116.4194, lat: 38.8026 },
  NH: { lng: -71.5724, lat: 43.1939 },
  NJ: { lng: -74.4057, lat: 40.0583 },
  NM: { lng: -105.8701, lat: 34.5199 },
  NY: { lng: -74.9481, lat: 43.2994 },
  NC: { lng: -79.0193, lat: 35.7596 },
  ND: { lng: -101.002, lat: 47.5515 },
  OH: { lng: -82.9071, lat: 40.4173 },
  OK: { lng: -97.0929, lat: 35.0078 },
  OR: { lng: -120.5542, lat: 43.8041 },
  PA: { lng: -77.1945, lat: 41.2033 },
  RI: { lng: -71.4774, lat: 41.5801 },
  SC: { lng: -81.1637, lat: 33.8361 },
  SD: { lng: -99.9018, lat: 43.9695 },
  TN: { lng: -86.5804, lat: 35.5175 },
  TX: { lng: -99.9018, lat: 31.9686 },
  UT: { lng: -111.0937, lat: 39.321 },
  VT: { lng: -72.5778, lat: 44.5588 },
  VA: { lng: -78.6569, lat: 37.4316 },
  WA: { lng: -120.7401, lat: 47.7511 },
  WV: { lng: -80.4549, lat: 38.5976 },
  WI: { lng: -89.6165, lat: 43.7844 },
  WY: { lng: -107.2903, lat: 43.076 },
};

const stateLabelMap = Object.fromEntries(US_STATES.map((state) => [state.value, state.label]));

export function getStateLabel(stateCode: string) {
  return stateLabelMap[stateCode.toUpperCase()] ?? stateCode;
}

export function getStateCentroid(stateCode: string) {
  return STATE_CENTROIDS[stateCode.toUpperCase()] ?? null;
}

export function aggregateEventCountsByState(
  results: { kind: string; item: { state: string } }[],
) {
  const counts = new Map<string, number>();

  for (const entry of results) {
    if (entry.kind !== "event") {
      continue;
    }

    const state = entry.item.state.toUpperCase();
    counts.set(state, (counts.get(state) ?? 0) + 1);
  }

  return counts;
}
