import type { SearchResultEntry } from "@/types/event-search";
import type mapboxgl from "mapbox-gl";
import { getEventPinColor } from "@/lib/constants/eventColors";
import { getResultKey } from "@/lib/mapbox/search-map-utils";

export const EVENTS_SOURCE_ID = "events";
export const EVENT_CLUSTERS_LAYER_ID = "event-clusters";
export const EVENT_CLUSTER_COUNT_LAYER_ID = "event-cluster-count";
export const EVENT_POINTS_LAYER_ID = "event-unclustered-point";

const CLUSTER_LAYER_IDS = [
  EVENT_CLUSTERS_LAYER_ID,
  EVENT_CLUSTER_COUNT_LAYER_ID,
  EVENT_POINTS_LAYER_ID,
] as const;

export function buildEventsGeoJson(results: SearchResultEntry[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const entry of results) {
    if (entry.kind !== "event") {
      continue;
    }

    const { id, latitude, longitude, format, rodeoLevel, disciplines } = entry.item;
    if (latitude == null || longitude == null) {
      continue;
    }

    const pinColor = getEventPinColor({ format, rodeoLevel, disciplines });

    features.push({
      type: "Feature",
      id,
      properties: {
        resultKey: getResultKey(entry),
        format: format ?? "jackpot",
        pinColor,
      },
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export function ensureEventClusterLayers(map: mapboxgl.Map) {
  if (map.getSource(EVENTS_SOURCE_ID)) {
    return;
  }

  map.addSource(EVENTS_SOURCE_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    generateId: false,
  });

  map.addLayer({
    id: EVENT_CLUSTERS_LAYER_ID,
    type: "circle",
    source: EVENTS_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#b45309",
        10,
        "#92400e",
        25,
        "#78350f",
      ],
      "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 25, 28],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.92,
    },
  });

  map.addLayer({
    id: EVENT_CLUSTER_COUNT_LAYER_ID,
    type: "symbol",
    source: EVENTS_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
    paint: {
      "text-color": "#ffffff",
    },
  });

  map.addLayer({
    id: EVENT_POINTS_LAYER_ID,
    type: "circle",
    source: EVENTS_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["get", "pinColor"],
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        12,
        10,
      ],
      "circle-stroke-width": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        3,
        2,
      ],
      "circle-stroke-color": "#ffffff",
    },
  });
}

export function updateEventsGeoJsonSource(
  map: mapboxgl.Map,
  geojson: GeoJSON.FeatureCollection,
) {
  const source = map.getSource(EVENTS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!source) {
    return;
  }

  source.setData(geojson);
}

export function syncEventSelection(
  map: mapboxgl.Map,
  selectedKey: string | null,
  results: SearchResultEntry[],
) {
  for (const entry of results) {
    if (entry.kind !== "event") {
      continue;
    }

    const key = getResultKey(entry);
    map.setFeatureState(
      { source: EVENTS_SOURCE_ID, id: entry.item.id },
      { selected: key === selectedKey },
    );
  }
}

export function removeEventClusterLayers(map: mapboxgl.Map) {
  for (const layerId of CLUSTER_LAYER_IDS) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }

  if (map.getSource(EVENTS_SOURCE_ID)) {
    map.removeSource(EVENTS_SOURCE_ID);
  }
}

interface ClusterInteractionOptions {
  onSelect: (key: string) => void;
}

export function bindEventClusterInteractions(
  map: mapboxgl.Map,
  { onSelect }: ClusterInteractionOptions,
) {
  function handleClusterClick(event: mapboxgl.MapMouseEvent) {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [EVENT_CLUSTERS_LAYER_ID],
    });

    const clusterFeature = features[0];
    if (!clusterFeature?.geometry || clusterFeature.geometry.type !== "Point") {
      return;
    }

    const clusterId = clusterFeature.properties?.cluster_id;
    if (clusterId == null) {
      return;
    }

    const source = map.getSource(EVENTS_SOURCE_ID) as mapboxgl.GeoJSONSource;
    const coordinates = clusterFeature.geometry.coordinates as [number, number];

    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || zoom == null) {
        return;
      }

      map.easeTo({
        center: coordinates,
        zoom,
        duration: 500,
      });
    });
  }

  function handlePointClick(event: mapboxgl.MapMouseEvent) {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [EVENT_POINTS_LAYER_ID],
    });

    const feature = features[0];
    const resultKey = feature?.properties?.resultKey;
    if (typeof resultKey === "string") {
      onSelect(resultKey);
    }
  }

  function setPointerCursor() {
    map.getCanvas().style.cursor = "pointer";
  }

  function clearCursor() {
    map.getCanvas().style.cursor = "";
  }

  map.on("click", EVENT_CLUSTERS_LAYER_ID, handleClusterClick);
  map.on("click", EVENT_POINTS_LAYER_ID, handlePointClick);
  map.on("mouseenter", EVENT_CLUSTERS_LAYER_ID, setPointerCursor);
  map.on("mouseleave", EVENT_CLUSTERS_LAYER_ID, clearCursor);
  map.on("mouseenter", EVENT_POINTS_LAYER_ID, setPointerCursor);
  map.on("mouseleave", EVENT_POINTS_LAYER_ID, clearCursor);

  return () => {
    map.off("click", EVENT_CLUSTERS_LAYER_ID, handleClusterClick);
    map.off("click", EVENT_POINTS_LAYER_ID, handlePointClick);
    map.off("mouseenter", EVENT_CLUSTERS_LAYER_ID, setPointerCursor);
    map.off("mouseleave", EVENT_CLUSTERS_LAYER_ID, clearCursor);
    map.off("mouseenter", EVENT_POINTS_LAYER_ID, setPointerCursor);
    map.off("mouseleave", EVENT_POINTS_LAYER_ID, clearCursor);
  };
}
