"use client";

import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { RowRecord } from "grist/GristData";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import { COLUMN_MAPPING_NAMES } from "./constants";

function DynamicMarker({
  mappings,
  record,
}: {
  mappings: WidgetColumnMap | null;
  record: RowRecord;
}) {
  const map = useMap();

  // Dériver les noms de colonnes directement depuis mappings
  const latColumnName = useMemo(
    () =>
      mappings ? String(mappings[COLUMN_MAPPING_NAMES.LATITUDE.name]) : "",
    [mappings],
  );

  const longColumnName = useMemo(
    () =>
      mappings ? String(mappings[COLUMN_MAPPING_NAMES.LONGITUDE.name]) : "",
    [mappings],
  );

  const normAddressColumnName = useMemo(
    () =>
      mappings
        ? String(mappings[COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS.name])
        : "",
    [mappings],
  );

  // Fonction helper pour convertir une valeur en coordonnée géographique
  const parseGeoCoordinate = useCallback(
    (columnName: string): number | null => {
      if (!columnName) {
        return null;
      }
      // Record may be null, use the optional chaining operator to access to the column value
      const value = record?.[columnName];
      if (!value) {
        return null;
      }
      // Grist in French version use "," as decimal separator, it could break geo api
      return typeof value === "number"
        ? value
        : Number(value.toString().replace(",", "."));
    },
    [record],
  );

  // Calculer lat/long directement depuis les noms de colonnes
  const lat = useMemo(
    () => parseGeoCoordinate(latColumnName),
    [parseGeoCoordinate, latColumnName],
  );

  const long = useMemo(
    () => parseGeoCoordinate(longColumnName),
    [parseGeoCoordinate, longColumnName],
  );

  // Utiliser un ref pour éviter les vols répétés vers les mêmes coordonnées
  const lastFlyToCoords = useRef<{ lat: number; long: number } | null>(null);

  // useEffect uniquement pour synchroniser avec Leaflet (système externe)
  useEffect(() => {
    if (
      lat &&
      long &&
      lat !== 0 &&
      long !== 0 &&
      (lastFlyToCoords.current?.lat !== lat ||
        lastFlyToCoords.current?.long !== long)
    ) {
      map.flyTo([lat, long]);
      lastFlyToCoords.current = { lat, long };
    }
  }, [lat, long, map]);

  if (!record || lat === null || long === null || (lat === 0 && long === 0)) {
    return null;
  }
  return (
    <Marker position={[lat, long]}>
      <Tooltip>{String(record[normAddressColumnName])}</Tooltip>
    </Marker>
  );
}

export default DynamicMarker;
