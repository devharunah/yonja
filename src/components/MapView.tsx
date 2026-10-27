"use client";

import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  Map as GoogleMap,
  useApiLoadingStatus,
} from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import { SpotPin } from "@/components/SpotPin";
import { KAMPALA } from "@/lib/constants";
import { MAPS_API_KEY } from "@/lib/firebase/config";
import type { Spot } from "@/lib/types";

function FailureWatcher({ onFail }: { onFail: () => void }) {
  const status = useApiLoadingStatus();
  useEffect(() => {
    if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) onFail();
  }, [status, onFail]);
  return null;
}

export function MapView({
  spots,
  selectedId,
  onSelect,
  onFail,
}: {
  spots: Spot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onFail: () => void;
}) {
  return (
    <APIProvider apiKey={MAPS_API_KEY} onError={onFail}>
      <FailureWatcher onFail={onFail} />
      <GoogleMap
        mapId="DEMO_MAP_ID"
        defaultCenter={KAMPALA}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        onClick={() => onSelect(null)}
        className="h-full w-full"
      >
        {spots.map((spot) => (
          <AdvancedMarker
            key={spot.id}
            position={{ lat: spot.lat, lng: spot.lng }}
            onClick={() => onSelect(spot.id)}
            zIndex={spot.id === selectedId ? 1000 : spot.relapse ? 500 : undefined}
          >
            <SpotPin spot={spot} selected={spot.id === selectedId} />
          </AdvancedMarker>
        ))}
      </GoogleMap>
    </APIProvider>
  );
}
