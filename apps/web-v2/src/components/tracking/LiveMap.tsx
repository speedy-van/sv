"use client";

import { Box, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LngLatLike, Map as MapboxMap, Marker } from "mapbox-gl";
import { usePusherEvent } from "@/hooks/usePusher";

interface LiveMapProps {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverLat?: number | null;
  driverLng?: number | null;
  bookingId?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export function LiveMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  driverLat,
  driverLng,
  bookingId,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const driverMarkerRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [livePos, setLivePos] = useState<{ lat: number; lng: number } | null>(
    driverLat != null && driverLng != null ? { lat: driverLat, lng: driverLng } : null
  );

  // Sync prop driver location into local state (polling fallback)
  useEffect(() => {
    if (driverLat != null && driverLng != null) {
      setLivePos({ lat: driverLat, lng: driverLng });
    }
  }, [driverLat, driverLng]);

  // Pusher live updates
  usePusherEvent(
    bookingId ? `booking-${bookingId}` : null,
    "driver-location",
    (data: unknown) => {
      const d = data as { lat?: number; lng?: number };
      if (typeof d?.lat === "number" && typeof d?.lng === "number") {
        setLivePos({ lat: d.lat, lng: d.lng });
      }
    }
  );

  // Initialise the map
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      const mod = await import("mapbox-gl");
      if (cancelled) return;
      const mapboxgl = mod.default;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [(pickupLng + dropoffLng) / 2, (pickupLat + dropoffLat) / 2],
        zoom: 9,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on("load", async () => {
        // Pickup marker (gold)
        const pickupEl = makePinElement("#D4AF37", "P");
        new mapboxgl.Marker({ element: pickupEl })
          .setLngLat([pickupLng, pickupLat])
          .setPopup(new mapboxgl.Popup({ offset: 18 }).setText("Pickup"))
          .addTo(map);

        // Dropoff marker (pearl)
        const dropEl = makePinElement("#FAFAF9", "D");
        new mapboxgl.Marker({ element: dropEl })
          .setLngLat([dropoffLng, dropoffLat])
          .setPopup(new mapboxgl.Popup({ offset: 18 }).setText("Dropoff"))
          .addTo(map);

        // Fit bounds
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([pickupLng, pickupLat]);
        bounds.extend([dropoffLng, dropoffLat]);
        map.fitBounds(bounds, { padding: 60, duration: 0 });

        // Try fetching directions
        let routeCoords: [number, number][] | null = null;
        try {
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
          const res = await fetch(url);
          if (res.ok) {
            const j = await res.json();
            const coords = j?.routes?.[0]?.geometry?.coordinates;
            if (Array.isArray(coords)) routeCoords = coords as [number, number][];
          }
        } catch {
          /* fall through */
        }
        if (!routeCoords) {
          routeCoords = [
            [pickupLng, pickupLat],
            [dropoffLng, dropoffLat],
          ];
        }

        if (!map.getSource("route")) {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: routeCoords },
            },
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#D4AF37",
              "line-width": 3,
              "line-opacity": 0.85,
              "line-dasharray": [2, 2],
            },
          });
        }

        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

  // Update driver marker
  useEffect(() => {
    if (!ready || !mapRef.current || !livePos) return;

    (async () => {
      const mod = await import("mapbox-gl");
      const mapboxgl = mod.default;
      const lngLat: LngLatLike = [livePos.lng, livePos.lat];

      if (!driverMarkerRef.current) {
        const el = makeDriverElement();
        driverMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(lngLat)
          .addTo(mapRef.current!);
      } else {
        driverMarkerRef.current.setLngLat(lngLat);
      }
    })();
  }, [ready, livePos]);

  if (!MAPBOX_TOKEN) {
    return (
      <Box
        h={{ base: "250px", md: "350px" }}
        rounded="xl"
        bg="rgba(9,9,11,0.06)"
        border="1px dashed"
        borderColor="rgba(9,9,11,0.15)"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontFamily="body" color="muted" fontSize="sm">
          Live map — configure Mapbox to enable
        </Text>
      </Box>
    );
  }

  return (
    <Box position="relative" h={{ base: "250px", md: "350px" }} rounded="xl" overflow="hidden">
      {!ready && (
        <Box
          position="absolute"
          inset="0"
          bg="rgba(9,9,11,0.08)"
          animation="pulse 1.6s ease-in-out infinite"
        />
      )}
      <Box
        ref={containerRef}
        position="absolute"
        inset="0"
        css={{
          "& .mapboxgl-ctrl-bottom-left, & .mapboxgl-ctrl-bottom-right": {
            display: "none",
          },
        }}
      />
      <style jsx global>{`
        .sv-driver-pin {
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #2563eb;
          border: 3px solid #fff;
          box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6);
          transition: transform 1s ease;
          animation: sv-pulse 1.8s ease-out infinite;
        }
        @keyframes sv-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.55);
          }
          70% {
            box-shadow: 0 0 0 16px rgba(37, 99, 235, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
          }
        }
        .sv-pin {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #09090b;
          font-family: var(--font-jetbrains-mono), monospace;
          font-weight: 700;
          font-size: 13px;
          border: 2px solid rgba(9, 9, 11, 0.5);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </Box>
  );
}

function makePinElement(color: string, label: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "sv-pin";
  el.style.background = color;
  el.textContent = label;
  return el;
}

function makeDriverElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "sv-driver-pin";
  return el;
}
