"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapDrawingToolbar, type DrawingTool } from "@/components/events/search/MapDrawingToolbar";
import { MapSelectionPanel } from "@/components/events/search/MapSelectionPanel";
import {
  createJackpotMarkerElement,
  createProRodeoMarkerElement,
  createRodeoMarkerElement,
  createStateClusterElement,
} from "@/lib/mapbox/map-markers";
import {
  aggregateEventCountsByState,
  getStateCentroid,
  getStateLabel,
} from "@/lib/mapbox/state-centroids";
import {
  createCircleGeoJson,
  getResultKey,
  getRodeoLevelBadge,
  selectionFromKey,
  type MapSelection,
} from "@/lib/mapbox/search-map-utils";
import type { RouteSearchResponse, SearchResultEntry } from "@/types/event-search";
import type { SavedMapOverlay } from "@/types/saved-search";

interface RouteEndpoint {
  label: string;
  lat: number;
  lng: number;
}

interface EventsSearchMapProps {
  mapboxToken: string;
  results: SearchResultEntry[];
  isSubscriber: boolean;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  routeMeta?: RouteSearchResponse["route"] | null;
  origin?: RouteEndpoint | null;
  destination?: RouteEndpoint | null;
  searchCenter?: { lat: number; lng: number } | null;
  onMapOverlayChange?: (overlay: SavedMapOverlay) => void;
}

interface PinRadiusDrawing {
  lng: number;
  lat: number;
  radiusMiles: number;
}

function getBounds(
  results: SearchResultEntry[],
  routeCoordinates?: [number, number][],
  origin?: RouteEndpoint | null,
  destination?: RouteEndpoint | null,
  searchCenter?: { lat: number; lng: number } | null,
) {
  const bounds = new mapboxgl.LngLatBounds();

  if (origin) {
    bounds.extend([origin.lng, origin.lat]);
  }

  if (destination) {
    bounds.extend([destination.lng, destination.lat]);
  }

  if (searchCenter) {
    bounds.extend([searchCenter.lng, searchCenter.lat]);
  }

  for (const coordinate of routeCoordinates ?? []) {
    bounds.extend(coordinate);
  }

  for (const entry of results) {
    const { latitude, longitude } = entry.item;
    if (latitude != null && longitude != null) {
      bounds.extend([longitude, latitude]);
    }
  }

  return bounds;
}

export function EventsSearchMap({
  mapboxToken,
  results,
  isSubscriber,
  selectedKey,
  onSelect,
  routeMeta,
  origin,
  destination,
  searchCenter,
  onMapOverlayChange,
}: EventsSearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const drawRef = useRef<MapboxDraw | null>(null);
  const freehandPointsRef = useRef<[number, number][]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>("none");
  const [pinRadiusMiles, setPinRadiusMiles] = useState(25);
  const [pinRadiusDrawing, setPinRadiusDrawing] = useState<PinRadiusDrawing | null>(null);
  const [showSubscribePrompt, setShowSubscribePrompt] = useState(false);
  const [freehandPoints, setFreehandPoints] = useState<[number, number][]>([]);
  const [rectangleStart, setRectangleStart] = useState<mapboxgl.LngLat | null>(null);
  const [rectangleEnd, setRectangleEnd] = useState<mapboxgl.LngLat | null>(null);
  const [completedShapes, setCompletedShapes] = useState<GeoJSON.Feature[]>([]);

  const selection = useMemo(() => selectionFromKey(selectedKey), [selectedKey]);

  const clearMarkers = useCallback(() => {
    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];
  }, []);

  const clearDrawings = useCallback(() => {
    setPinRadiusDrawing(null);
    setFreehandPoints([]);
    setRectangleStart(null);
    setRectangleEnd(null);
    setCompletedShapes([]);
    drawRef.current?.deleteAll();
    setActiveTool("none");

    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    for (const layerId of [
      "pin-radius-fill",
      "pin-radius-outline",
      "draw-preview-fill",
      "draw-preview-outline",
      "completed-shapes-fill",
      "completed-shapes-outline",
    ]) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    }

    for (const sourceId of ["pin-radius", "draw-preview", "completed-shapes"]) {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }
  }, []);

  const updatePinRadiusLayer = useCallback((drawing: PinRadiusDrawing | null) => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    if (map.getLayer("pin-radius-fill")) {
      map.removeLayer("pin-radius-fill");
    }
    if (map.getLayer("pin-radius-outline")) {
      map.removeLayer("pin-radius-outline");
    }
    if (map.getSource("pin-radius")) {
      map.removeSource("pin-radius");
    }

    if (!drawing) {
      return;
    }

    const feature = createCircleGeoJson(drawing.lng, drawing.lat, drawing.radiusMiles);
    map.addSource("pin-radius", {
      type: "geojson",
      data: feature,
    });
    map.addLayer({
      id: "pin-radius-fill",
      type: "fill",
      source: "pin-radius",
      paint: {
        "fill-color": "#d97706",
        "fill-opacity": 0.15,
      },
    });
    map.addLayer({
      id: "pin-radius-outline",
      type: "line",
      source: "pin-radius",
      paint: {
        "line-color": "#b45309",
        "line-width": 2,
      },
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mapboxToken || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [-98.5795, 39.8283],
      zoom: 3.5,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
    });

    map.addControl(draw);
    drawRef.current = draw;

    map.on("load", () => {
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      clearMarkers();
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
      setMapReady(false);
    };
  }, [mapboxToken, clearMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw || !mapReady) {
      return;
    }

    draw.changeMode("simple_select");
  }, [activeTool, mapReady]);

  const updatePreviewShapes = useCallback(
    (
      freehand: [number, number][],
      rectStart: mapboxgl.LngLat | null,
      rectEnd: mapboxgl.LngLat | null,
    ) => {
      const map = mapRef.current;
      if (!map?.isStyleLoaded()) {
        return;
      }

      const features: GeoJSON.Feature[] = [];

      if (freehand.length >= 3) {
        features.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[...freehand, freehand[0]]],
          },
        });
      }

      if (rectStart && rectEnd) {
        const west = Math.min(rectStart.lng, rectEnd.lng);
        const east = Math.max(rectStart.lng, rectEnd.lng);
        const south = Math.min(rectStart.lat, rectEnd.lat);
        const north = Math.max(rectStart.lat, rectEnd.lat);
        features.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [west, south],
                [east, south],
                [east, north],
                [west, north],
                [west, south],
              ],
            ],
          },
        });
      }

      const collection: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
      };

      if (map.getSource("draw-preview")) {
        (map.getSource("draw-preview") as mapboxgl.GeoJSONSource).setData(collection);
        return;
      }

      map.addSource("draw-preview", { type: "geojson", data: collection });
      map.addLayer({
        id: "draw-preview-fill",
        type: "fill",
        source: "draw-preview",
        paint: { "fill-color": "#2563eb", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "draw-preview-outline",
        type: "line",
        source: "draw-preview",
        paint: { "line-color": "#1d4ed8", "line-width": 2 },
      });
    },
    [],
  );

  useEffect(() => {
    updatePreviewShapes(freehandPoints, rectangleStart, rectangleEnd);
  }, [freehandPoints, rectangleStart, rectangleEnd, updatePreviewShapes, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    const collection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: completedShapes,
    };

    if (map.getSource("completed-shapes")) {
      (map.getSource("completed-shapes") as mapboxgl.GeoJSONSource).setData(collection);
      return;
    }

    if (completedShapes.length === 0) {
      return;
    }

    map.addSource("completed-shapes", { type: "geojson", data: collection });
    map.addLayer({
      id: "completed-shapes-fill",
      type: "fill",
      source: "completed-shapes",
      paint: { "fill-color": "#2563eb", "fill-opacity": 0.15 },
    });
    map.addLayer({
      id: "completed-shapes-outline",
      type: "line",
      source: "completed-shapes",
      paint: { "line-color": "#1d4ed8", "line-width": 2 },
    });
  }, [completedShapes, mapReady]);

  useEffect(() => {
    updatePinRadiusLayer(pinRadiusDrawing);
  }, [pinRadiusDrawing, updatePinRadiusLayer, mapReady]);

  useEffect(() => {
    if (pinRadiusDrawing) {
      setPinRadiusDrawing((current) =>
        current ? { ...current, radiusMiles: pinRadiusMiles } : current,
      );
    }
  }, [pinRadiusMiles]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }

    const mapInstance = mapRef.current;

    let drawing = false;

    function handleMouseDown(event: mapboxgl.MapMouseEvent) {
      if (!isSubscriber) {
        return;
      }

      if (activeTool === "freehand") {
        drawing = true;
        mapInstance.dragPan.disable();
        const point: [number, number] = [event.lngLat.lng, event.lngLat.lat];
        freehandPointsRef.current = [point];
        setFreehandPoints([point]);
        return;
      }

      if (activeTool === "rectangle") {
        drawing = true;
        mapInstance.dragPan.disable();
        setRectangleStart(event.lngLat);
        setRectangleEnd(event.lngLat);
      }
    }

    function handleMouseMove(event: mapboxgl.MapMouseEvent) {
      if (!drawing || !isSubscriber) {
        return;
      }

      if (activeTool === "freehand") {
        setFreehandPoints((current) => {
          const last = current[current.length - 1];
          if (!last) {
            return current;
          }

          const dx = last[0] - event.lngLat.lng;
          const dy = last[1] - event.lngLat.lat;
          if (dx * dx + dy * dy < 0.000001) {
            return current;
          }

          const next = [...current, [event.lngLat.lng, event.lngLat.lat] as [number, number]];
          freehandPointsRef.current = next;
          return next;
        });
        return;
      }

      if (activeTool === "rectangle") {
        setRectangleEnd(event.lngLat);
      }
    }

    function handleMouseUp() {
      if (!drawing || !isSubscriber) {
        return;
      }

      drawing = false;
      mapInstance.dragPan.enable();

      if (activeTool === "freehand" && freehandPointsRef.current.length >= 3) {
        const points = freehandPointsRef.current;
        setCompletedShapes((current) => [
          ...current,
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[...points, points[0]]],
            },
          },
        ]);
        setFreehandPoints([]);
        freehandPointsRef.current = [];
      }

      if (activeTool === "rectangle" && rectangleStart && rectangleEnd) {
        const west = Math.min(rectangleStart.lng, rectangleEnd.lng);
        const east = Math.max(rectangleStart.lng, rectangleEnd.lng);
        const south = Math.min(rectangleStart.lat, rectangleEnd.lat);
        const north = Math.max(rectangleStart.lat, rectangleEnd.lat);
        setCompletedShapes((current) => [
          ...current,
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [west, south],
                  [east, south],
                  [east, north],
                  [west, north],
                  [west, south],
                ],
              ],
            },
          },
        ]);
        setRectangleStart(null);
        setRectangleEnd(null);
      }
    }

    function handleMapClick(event: mapboxgl.MapMouseEvent) {
      if (activeTool === "pin-radius" && isSubscriber) {
        setPinRadiusDrawing({
          lng: event.lngLat.lng,
          lat: event.lngLat.lat,
          radiusMiles: pinRadiusMiles,
        });
      }
    }

    mapInstance.on("mousedown", handleMouseDown);
    mapInstance.on("mousemove", handleMouseMove);
    mapInstance.on("mouseup", handleMouseUp);
    mapInstance.on("click", handleMapClick);

    return () => {
      mapInstance.off("mousedown", handleMouseDown);
      mapInstance.off("mousemove", handleMouseMove);
      mapInstance.off("mouseup", handleMouseUp);
      mapInstance.off("click", handleMapClick);
    };
  }, [activeTool, isSubscriber, pinRadiusMiles, mapReady, rectangleStart, rectangleEnd]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    if (map.getLayer("route-line")) {
      map.removeLayer("route-line");
    }
    if (map.getSource("route")) {
      map.removeSource("route");
    }

    if (routeMeta?.coordinates?.length) {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeMeta.coordinates,
          },
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#b45309",
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });
    }
  }, [routeMeta, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    clearMarkers();

    if (!isSubscriber) {
      const stateCounts = aggregateEventCountsByState(results);

      for (const [stateCode, count] of stateCounts) {
        const centroid = getStateCentroid(stateCode);
        if (!centroid) {
          continue;
        }

        const key = `state:${stateCode}`;
        const selected = selectedKey === key;
        const element = createStateClusterElement(
          stateCode,
          getStateLabel(stateCode),
          count,
          selected,
        );

        element.addEventListener("click", (clickEvent) => {
          clickEvent.stopPropagation();
          onSelect(key);
        });

        const marker = new mapboxgl.Marker({ element })
          .setLngLat([centroid.lng, centroid.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    } else {
      for (const entry of results) {
        if (entry.kind !== "event") {
          continue;
        }

        const { latitude, longitude, format, rodeoLevel } = entry.item;
        if (latitude == null || longitude == null) {
          continue;
        }

        const key = getResultKey(entry);
        const selected = selectedKey === key;
        const element =
          format === "rodeo"
            ? createRodeoMarkerElement(getRodeoLevelBadge(rodeoLevel), selected)
            : createJackpotMarkerElement(selected);

        element.style.cursor = "pointer";
        element.addEventListener("click", (clickEvent) => {
          clickEvent.stopPropagation();
          onSelect(key);
        });

        const marker = new mapboxgl.Marker({ element, anchor: "center" })
          .setLngLat([longitude, latitude])
          .addTo(map);
        markersRef.current.push(marker);
      }
    }

    for (const entry of results) {
      if (entry.kind !== "pro_rodeo") {
        continue;
      }

      const { latitude, longitude } = entry.item;
      if (latitude == null || longitude == null) {
        continue;
      }

      const key = getResultKey(entry);
      const selected = selectedKey === key;
      const element = createProRodeoMarkerElement(selected);
      element.style.cursor = "pointer";
      element.addEventListener("click", (clickEvent) => {
        clickEvent.stopPropagation();
        onSelect(key);
      });

      const marker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat([longitude, latitude])
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (origin) {
      const marker = new mapboxgl.Marker({ color: "#15803d" })
        .setLngLat([origin.lng, origin.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(`Start: ${origin.label}`))
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (destination) {
      const marker = new mapboxgl.Marker({ color: "#b91c1c" })
        .setLngLat([destination.lng, destination.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(`End: ${destination.label}`))
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (searchCenter && !origin) {
      const marker = new mapboxgl.Marker({ color: "#7c2d12" })
        .setLngLat([searchCenter.lng, searchCenter.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [
    results,
    isSubscriber,
    selectedKey,
    onSelect,
    clearMarkers,
    mapReady,
    origin,
    destination,
    searchCenter,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedKey) {
      return;
    }

    const selected = selectionFromKey(selectedKey);
    if (!selected) {
      return;
    }

    if (selected.type === "state_cluster") {
      const centroid = getStateCentroid(selected.state);
      if (centroid) {
        map.flyTo({ center: [centroid.lng, centroid.lat], zoom: 6, duration: 800 });
      }
      return;
    }

    const entry = results.find((item) => getResultKey(item) === selectedKey);
    const { latitude, longitude } = entry?.item ?? {};
    if (latitude != null && longitude != null) {
      map.flyTo({ center: [longitude, latitude], zoom: 9, duration: 800 });
    }
  }, [selectedKey, results, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const bounds = getBounds(
      results,
      routeMeta?.coordinates,
      origin,
      destination,
      searchCenter,
    );

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 72, maxZoom: 10, duration: 0 });
    }
  }, [results, routeMeta, origin, destination, searchCenter, mapReady]);

  useEffect(() => {
    if (!onMapOverlayChange) {
      return;
    }

    const shapes = completedShapes
      .filter(
        (feature): feature is GeoJSON.Feature<GeoJSON.Polygon> =>
          feature.geometry?.type === "Polygon",
      )
      .map((feature) => ({
        type: "Polygon" as const,
        coordinates: feature.geometry.coordinates,
      }));

    onMapOverlayChange({
      pinRadius: pinRadiusDrawing,
      shapes,
    });
  }, [completedShapes, pinRadiusDrawing, onMapOverlayChange]);

  const hasDrawings =
    Boolean(pinRadiusDrawing) ||
    completedShapes.length > 0 ||
    freehandPoints.length > 0 ||
    Boolean(rectangleStart);

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-amber-200 shadow-sm">
      <div ref={containerRef} className="h-full w-full" />

      <MapDrawingToolbar
        activeTool={activeTool}
        isSubscriber={isSubscriber}
        pinRadiusMiles={pinRadiusMiles}
        hasDrawings={hasDrawings}
        onToolChange={setActiveTool}
        onPinRadiusChange={setPinRadiusMiles}
        onClear={clearDrawings}
        onLockedClick={() => setShowSubscribePrompt(true)}
      />

      {selection && (
        <MapSelectionPanel
          selection={selection}
          results={results}
          isSubscriber={isSubscriber}
          onClose={() => onSelect(null)}
        />
      )}

      {showSubscribePrompt && !isSubscriber && (
        <div className="absolute bottom-3 left-3 right-3 z-10 rounded-2xl border border-amber-200 bg-white p-4 shadow-lg sm:left-auto sm:right-3 sm:max-w-sm">
          <button
            type="button"
            onClick={() => setShowSubscribePrompt(false)}
            className="absolute right-3 top-3 text-sm text-amber-700 hover:text-amber-950"
          >
            ✕
          </button>
          <h3 className="pr-8 text-lg font-semibold text-amber-950">Subscribe to draw on the map</h3>
          <p className="mt-2 text-sm text-amber-900/75">
            Pin radius, freehand, and box drawing tools unlock with a subscription.
          </p>
          <a
            href="/subscribe"
            className="mt-4 inline-flex rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            View plans
          </a>
        </div>
      )}
    </div>
  );
}
