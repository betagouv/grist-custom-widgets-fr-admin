"use client";

import { FC, useEffect } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";

export type MapRecord = grist.RowRecord & {
  Latitude: number;
  Longitude: number;
  Adresse_Normalisee: string;
};

export const DynamicMarker: FC<{
  record: MapRecord;
}> = ({ record }) => {
  const map = useMap();
  useEffect(() => {
    if (
      record &&
      record.Latitude &&
      record.Longitude &&
      record.Latitude !== 0 &&
      record.Longitude !== 0
    ) {
      map.flyTo([record.Latitude, record.Longitude]);
    }
  }, [record, map]);

  if (!record || !record.Latitude || !record.Longitude) {
    return null;
  }
  return (
    <Marker position={[record.Latitude, record.Longitude]}>
      <Tooltip>{record.Adresse_Normalisee}</Tooltip>
    </Marker>
  );
};
