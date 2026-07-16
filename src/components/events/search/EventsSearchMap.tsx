"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapDrawingToolbar, type DrawingTool } from "@/components/events/search/MapDrawingToolbar";
import { MapSelectionPanel } from "@/components/events/search/MapSelectionPanel";
import {
  createJackpotMarkerElement,
  createProRodeoMarkerElement,
  createRodeoMarkerElement,
} from "@/lib/mapbox/map-markers";
import { parseStoredRodeoLevels } from "@/lib/events/rodeo-levels";
import { getStateCentroid } from "@/lib/mapbox/state-centroids";
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
  viewMode?: "default" | "search";
  routeMeta?: RouteSearchResponse["route"] | null;
  origin?: RouteEndpoint | null;
  destination?: RouteEndpoint | null;
  searchCenter?: { lat: number; lng: number } | null;
  initialMapOverlay?: SavedMapOverlay | null;
  onMapOverlayChange?: (overlay: SavedMapOverlay) => void;
}

const US_MAP_CENTER: [number, number] = [-98.5795, 39.8283];
const US_MAP_ZOOM = 3.5;

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
  userLocation?: { lat: number; lng: number } | null,
) {
  const bounds = new mapboxgl.LngLatBounds();

  if (userLocation) {
    bounds.extend([userLocation.lng, userLocation.lat]);
  }

  if (origin) {
    bounds.extend([origin.lng, origin.lat]);
  }

  if (destination) {
    bounds.extend([destination.lng, destination.lat]);
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

function syncPreviewLayer(map: mapboxgl.Map, features: GeoJSON.Feature[]) {
  if (!map.isStyleLoaded()) {
    return;
  }

  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  if (map.getSource("draw-preview")) {
    (map.getSource("draw-preview") as mapboxgl.GeoJSONSource).setData(collection);
    return;
  }

  if (features.length === 0) {
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
}

function syncCompletedShapesLayer(map: mapboxgl.Map, features: GeoJSON.Feature[]) {
  if (!map.isStyleLoaded()) {
    return;
  }

  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  if (map.getSource("completed-shapes")) {
    (map.getSource("completed-shapes") as mapboxgl.GeoJSONSource).setData(collection);
    return;
  }

  if (features.length === 0) {
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
}

function createRectangleFeature(rectStart: mapboxgl.LngLat, rectEnd: mapboxgl.LngLat): GeoJSON.Feature {
  const west = Math.min(rectStart.lng, rectEnd.lng);
  const east = Math.max(rectStart.lng, rectEnd.lng);
  const south = Math.min(rectStart.lat, rectEnd.lat);
  const north = Math.max(rectStart.lat, rectEnd.lat);

  return {
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
  };
}

function createFreehandFeature(points: [number, number][]): GeoJSON.Feature | null {
  if (points.length < 3) {
    return null;
  }

  const ring = closeFreehandRing(points);

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
  };
}

function closeFreehandRing(points: [number, number][]): [number, number][] {
  const ring = [...points];
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push(first);
  }

  return ring;
}

function createFreehandPreviewFeature(points: [number, number][]): GeoJSON.Feature | null {
  if (points.length < 2) {
    return null;
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points,
    },
  };
}

function appendFreehandPoint(
  points: [number, number][],
  lng: number,
  lat: number,
): [number, number][] {
  const last = points[points.length - 1];
  if (!last) {
    return [[lng, lat]];
  }

  const dx = last[0] - lng;
  const dy = last[1] - lat;
  if (dx * dx + dy * dy < 0.000001) {
    return points;
  }

  return [...points, [lng, lat]];
}

function createEventMarkerElement(
  entry: Extract<SearchResultEntry, { kind: "event" }>,
  selected: boolean,
) {
  const format = entry.item.format?.trim().toLowerCase();

  if (format === "rodeo") {
    const [primaryLevel] = parseStoredRodeoLevels(entry.item.rodeoLevel);
    return createRodeoMarkerElement(getRodeoLevelBadge(primaryLevel ?? null), selected);
  }

  return createJackpotMarkerElement(selected);
}

function attachMarkerClick(element: HTMLElement, key: string, onSelect: (key: string) => void) {
  element.style.cursor = "pointer";
  element.addEventListener("click", (clickEvent) => {
    clickEvent.stopPropagation();
    onSelect(key);
  });
}

export function EventsSearchMap({
  mapboxToken,
  results,
  isSubscriber,
  selectedKey,
  onSelect,
  viewMode = "search",
  routeMeta,
  origin,
  destination,
  searchCenter,
  initialMapOverlay,
  onMapOverlayChange,
}: EventsSearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const freehandPointsRef = useRef<[number, number][]>([]);
  const activeToolRef = useRef<DrawingTool>("none");
  const pinRadiusMilesRef = useRef(25);
  const drawingRef = useRef(false);
  const rectangleStartRef = useRef<mapboxgl.LngLat | null>(null);
  const rectangleEndRef = useRef<mapboxgl.LngLat | null>(null);
  const completedShapesRef = useRef<GeoJSON.Feature[]>([]);
  const lastBoundsFitKeyRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  const overlayHydratedRef = useRef(false);
  const pinPlacedByTouchRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>("none");
  const [pinRadiusMiles, setPinRadiusMiles] = useState(25);
  const [pinRadiusDrawing, setPinRadiusDrawing] = useState<PinRadiusDrawing | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<[number, number][]>([]);
  const [rectangleStart, setRectangleStart] = useState<mapboxgl.LngLat | null>(null);
  const [rectangleEnd, setRectangleEnd] = useState<mapboxgl.LngLat | null>(null);
  const [completedShapes, setCompletedShapes] = useState<GeoJSON.Feature[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const selection = useMemo(() => selectionFromKey(selectedKey), [selectedKey]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  const handleToolChange = useCallback((tool: DrawingTool) => {
    activeToolRef.current = tool;
    setActiveTool(tool);
  }, []);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    pinRadiusMilesRef.current = pinRadiusMiles;
  }, [pinRadiusMiles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const canvas = map.getCanvas();
    if (activeTool !== "none") {
      canvas.style.cursor = "crosshair";
      canvas.style.touchAction = "none";
    } else {
      canvas.style.cursor = "";
      canvas.style.touchAction = "";
    }
  }, [activeTool, mapReady]);

  const clearMarkers = useCallback(() => {
    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];
  }, []);

  const clearDrawings = useCallback(() => {
    onSelect(null);
    setActiveTool("none");
    activeToolRef.current = "none";
    drawingRef.current = false;
    overlayHydratedRef.current = false;
    setPinRadiusDrawing(null);
    setFreehandPoints([]);
    setRectangleStart(null);
    setRectangleEnd(null);
    setCompletedShapes([]);
    completedShapesRef.current = [];
    rectangleStartRef.current = null;
    rectangleEndRef.current = null;
    freehandPointsRef.current = [];

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
  }, [onSelect]);

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

  const commitCompletedShape = useCallback((feature: GeoJSON.Feature) => {
    const map = mapRef.current;
    const nextShapes = [...completedShapesRef.current, feature];
    completedShapesRef.current = nextShapes;
    setCompletedShapes(nextShapes);

    if (map) {
      syncCompletedShapesLayer(map, nextShapes);
    }
  }, []);

  const clearPreviewLayer = useCallback(() => {
    const map = mapRef.current;
    setFreehandPoints([]);
    setRectangleStart(null);
    setRectangleEnd(null);
    freehandPointsRef.current = [];
    rectangleStartRef.current = null;
    rectangleEndRef.current = null;

    if (map) {
      syncPreviewLayer(map, []);
    }
  }, []);

  const commitCompletedShapeRef = useRef(commitCompletedShape);
  const clearPreviewLayerRef = useRef(clearPreviewLayer);
  const updatePinRadiusLayerRef = useRef(updatePinRadiusLayer);

  useEffect(() => {
    commitCompletedShapeRef.current = commitCompletedShape;
    clearPreviewLayerRef.current = clearPreviewLayer;
    updatePinRadiusLayerRef.current = updatePinRadiusLayer;
  }, [commitCompletedShape, clearPreviewLayer, updatePinRadiusLayer]);

  useEffect(() => {
    if (!containerRef.current || !mapboxToken || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: US_MAP_CENTER,
      zoom: US_MAP_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    function beginDrawAt(lngLat: mapboxgl.LngLat) {
      const tool = activeToolRef.current;
      if (tool === "none" || tool === "pin-radius") {
        return;
      }

      if (tool === "freehand") {
        drawingRef.current = true;
        map.dragPan.disable();
        const point: [number, number] = [lngLat.lng, lngLat.lat];
        freehandPointsRef.current = [point];
        setFreehandPoints([point]);
        return;
      }

      if (tool === "rectangle") {
        drawingRef.current = true;
        map.dragPan.disable();
        rectangleStartRef.current = lngLat;
        rectangleEndRef.current = lngLat;
        setRectangleStart(lngLat);
        setRectangleEnd(lngLat);
      }
    }

    function updateDrawAt(lngLat: mapboxgl.LngLat) {
      if (!drawingRef.current) {
        return;
      }

      const tool = activeToolRef.current;

      if (tool === "freehand") {
        const next = appendFreehandPoint(
          freehandPointsRef.current,
          lngLat.lng,
          lngLat.lat,
        );
        if (next !== freehandPointsRef.current) {
          freehandPointsRef.current = next;
          setFreehandPoints(next);
        }
        return;
      }

      if (tool === "rectangle") {
        rectangleEndRef.current = lngLat;
        setRectangleEnd(lngLat);
      }
    }

    function placePinRadius(lngLat: mapboxgl.LngLat) {
      const drawing = {
        lng: lngLat.lng,
        lat: lngLat.lat,
        radiusMiles: pinRadiusMilesRef.current,
      };
      setPinRadiusDrawing(drawing);
      updatePinRadiusLayerRef.current(drawing);
    }

    function finishDrawing() {
      if (!drawingRef.current) {
        return;
      }

      drawingRef.current = false;
      map.dragPan.enable();

      const tool = activeToolRef.current;

      if (tool === "freehand") {
        const feature = createFreehandFeature(freehandPointsRef.current);
        if (feature) {
          commitCompletedShapeRef.current(feature);
        }
        clearPreviewLayerRef.current();
        return;
      }

      if (tool === "rectangle") {
        const rectStart = rectangleStartRef.current;
        const rectEnd = rectangleEndRef.current;
        if (rectStart && rectEnd) {
          commitCompletedShapeRef.current(createRectangleFeature(rectStart, rectEnd));
        }
        clearPreviewLayerRef.current();
      }
    }

    function handleMapClick(event: mapboxgl.MapMouseEvent) {
      if (activeToolRef.current !== "pin-radius" || pinPlacedByTouchRef.current) {
        return;
      }

      event.preventDefault();
      placePinRadius(event.lngLat);
    }

    function handleMouseDown(event: mapboxgl.MapMouseEvent) {
      if (activeToolRef.current === "none" || activeToolRef.current === "pin-radius") {
        return;
      }

      event.preventDefault();
      beginDrawAt(event.lngLat);
    }

    function handleMouseMove(event: mapboxgl.MapMouseEvent) {
      if (activeToolRef.current !== "none") {
        map.getCanvas().style.cursor = "crosshair";
      }

      updateDrawAt(event.lngLat);
    }

    function handleMouseUp() {
      finishDrawing();
    }

    function handleWindowMouseUp() {
      finishDrawing();
    }

    function handleTouchStart(event: mapboxgl.MapTouchEvent) {
      const tool = activeToolRef.current;
      if (tool === "none") {
        return;
      }

      if (event.originalEvent.touches.length > 1) {
        return;
      }

      event.preventDefault();

      if (tool === "pin-radius") {
        pinPlacedByTouchRef.current = true;
        placePinRadius(event.lngLat);
        window.setTimeout(() => {
          pinPlacedByTouchRef.current = false;
        }, 400);
        return;
      }

      beginDrawAt(event.lngLat);
    }

    function handleTouchMove(event: mapboxgl.MapTouchEvent) {
      if (activeToolRef.current !== "none") {
        map.getCanvas().style.cursor = "crosshair";
      }

      if (!drawingRef.current) {
        return;
      }

      event.preventDefault();
      updateDrawAt(event.lngLat);
    }

    function handleTouchEnd() {
      finishDrawing();
    }

    function handleWindowTouchEnd() {
      finishDrawing();
    }

    map.on("click", handleMapClick);
    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    map.on("touchstart", handleTouchStart);
    map.on("touchmove", handleTouchMove);
    map.on("touchend", handleTouchEnd);
    map.on("touchcancel", handleTouchEnd);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("touchend", handleWindowTouchEnd);

    map.on("load", () => {
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener("touchend", handleWindowTouchEnd);
      map.off("click", handleMapClick);
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      map.off("touchstart", handleTouchStart);
      map.off("touchmove", handleTouchMove);
      map.off("touchend", handleTouchEnd);
      map.off("touchcancel", handleTouchEnd);
      clearMarkers();
      map.remove();
      mapRef.current = null;
      lastBoundsFitKeyRef.current = null;
      setMapReady(false);
    };
  }, [mapboxToken, clearMarkers]);

  useEffect(() => {
    if (!mapReady || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserLocation(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }, [mapReady]);

  const updatePreviewShapes = useCallback(
    (
      freehand: [number, number][],
      rectStart: mapboxgl.LngLat | null,
      rectEnd: mapboxgl.LngLat | null,
    ) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const features: GeoJSON.Feature[] = [];

      const freehandPreview = createFreehandPreviewFeature(freehand);
      if (freehandPreview) {
        features.push(freehandPreview);
      }

      if (rectStart && rectEnd) {
        features.push(createRectangleFeature(rectStart, rectEnd));
      }

      syncPreviewLayer(map, features);
    },
    [],
  );

  useEffect(() => {
    updatePreviewShapes(freehandPoints, rectangleStart, rectangleEnd);
  }, [freehandPoints, rectangleStart, rectangleEnd, updatePreviewShapes, mapReady]);

  useEffect(() => {
    completedShapesRef.current = completedShapes;

    const map = mapRef.current;
    if (!map?.isStyleLoaded()) {
      return;
    }

    syncCompletedShapesLayer(map, completedShapes);
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

    for (const entry of results) {
      if (entry.kind !== "event") {
        continue;
      }

      const { latitude, longitude } = entry.item;
      if (latitude == null || longitude == null) {
        continue;
      }

      const key = getResultKey(entry);
      const element = createEventMarkerElement(entry, selectedKey === key);
      attachMarkerClick(element, key, onSelect);

      const marker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat([longitude, latitude])
        .addTo(map);
      markersRef.current.push(marker);
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
      const element = createProRodeoMarkerElement(selectedKey === key);
      attachMarkerClick(element, key, onSelect);

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

    const boundsFitKey = JSON.stringify({
      viewMode,
      resultCount: results.length,
      routePointCount: routeMeta?.coordinates?.length ?? 0,
      originLat: origin?.lat ?? null,
      originLng: origin?.lng ?? null,
      destinationLat: destination?.lat ?? null,
      destinationLng: destination?.lng ?? null,
      userLat: userLocation?.lat ?? null,
      userLng: userLocation?.lng ?? null,
    });

    if (lastBoundsFitKeyRef.current === boundsFitKey) {
      return;
    }

    const bounds = getBounds(
      results,
      routeMeta?.coordinates,
      origin,
      destination,
      viewMode === "default" ? userLocation : null,
    );

    if (bounds.isEmpty()) {
      lastBoundsFitKeyRef.current = boundsFitKey;
      if (viewMode === "default") {
        if (userLocation) {
          map.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 5,
            duration: 0,
          });
        } else {
          map.flyTo({
            center: US_MAP_CENTER,
            zoom: US_MAP_ZOOM,
            duration: 0,
          });
        }
      }
      return;
    }

    lastBoundsFitKeyRef.current = boundsFitKey;
    map.fitBounds(bounds, {
      padding: 72,
      maxZoom: viewMode === "default" ? 5 : 10,
      duration: 0,
    });
  }, [results, routeMeta, origin, destination, mapReady, viewMode, userLocation]);

  useEffect(() => {
    if (!mapReady || overlayHydratedRef.current || !initialMapOverlay) {
      return;
    }

    if (!initialMapOverlay.pinRadius && initialMapOverlay.shapes.length === 0) {
      return;
    }

    overlayHydratedRef.current = true;

    if (initialMapOverlay.pinRadius) {
      setPinRadiusDrawing(initialMapOverlay.pinRadius);
      updatePinRadiusLayer(initialMapOverlay.pinRadius);
    }

    if (initialMapOverlay.shapes.length > 0) {
      const features: GeoJSON.Feature[] = initialMapOverlay.shapes.map((shape) => ({
        type: "Feature",
        properties: {},
        geometry: shape,
      }));
      completedShapesRef.current = features;
      setCompletedShapes(features);

      const map = mapRef.current;
      if (map) {
        syncCompletedShapesLayer(map, features);
      }
    }
  }, [initialMapOverlay, mapReady, updatePinRadiusLayer]);

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

  return (
    <div className="relative h-[min(480px,60vh)] min-h-[320px] w-full overflow-hidden rounded-2xl border border-amber-200 shadow-sm sm:h-[480px]">
      <div ref={containerRef} className="h-full w-full" />

      <MapDrawingToolbar
        activeTool={activeTool}
        pinRadiusMiles={pinRadiusMiles}
        onToolChange={handleToolChange}
        onPinRadiusChange={setPinRadiusMiles}
        onClear={clearDrawings}
      />

      {selection && (
        <MapSelectionPanel
          selection={selection}
          results={results}
          isSubscriber={isSubscriber}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  );
}
