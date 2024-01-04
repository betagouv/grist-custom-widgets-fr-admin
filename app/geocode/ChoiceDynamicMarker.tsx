"use client";

import { useEffect } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import { NormalizedGeocodeResult } from "./types";

function ChoiceDynamicMarker({
  address,
}: {
  address: NormalizedGeocodeResult;
}) {
  const map = useMap();
  useEffect(() => {
    if (address) {
      map.flyTo([Number(address.lat), Number(address.lng)]);
    }
  }, [address, map]);

  if (!address) {
    return null;
  }
  return (
    <Marker position={[Number(address.lat), Number(address.lng)]}>
      <Tooltip>{String(address.address_normalized)}</Tooltip>
    </Marker>
  );
}

export default ChoiceDynamicMarker;
