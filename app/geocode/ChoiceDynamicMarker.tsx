"use client";

import { FC, useEffect } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import { NormalizedGeocodeResult } from "./types";

export const ChoiceDynamicMarker: FC<{
  address: NormalizedGeocodeResult;
}> = ({ address }) => {
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
      <Tooltip>{String(address.address_nomalized)}</Tooltip>
    </Marker>
  );
};
