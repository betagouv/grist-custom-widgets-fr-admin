"use client";

import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { RowRecord } from "grist/GristData";
import { useCallback, useEffect, useState } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import { COLUMN_MAPPING_NAMES } from "./constants";

function DynamicMarker({
  mappings,
  record,
}: {
  mappings: WidgetColumnMap | null;
  record: RowRecord;
}) {
  const [latColumnName, setLatColumnName] = useState<string>("");
  const [longColumnName, setLongColumnName] = useState<string>("");
  const [normAddressColumnName, setNormAddressColumnName] =
    useState<string>("");
  const map = useMap();

  const getGeoAsNumber = useCallback(
    (lat: boolean, long: boolean): number | null => {
      const columnName = lat ? latColumnName : long ? longColumnName : "";
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
    [record, latColumnName, longColumnName],
  );

  const [lat, setLat] = useState<number | null>(getGeoAsNumber(true, false));
  const [long, setLong] = useState<number | null>(getGeoAsNumber(false, true));

  useEffect(() => {
    if (record && mappings) {
      setLatColumnName(String(mappings[COLUMN_MAPPING_NAMES.LATITUDE.name]));
      setLongColumnName(String(mappings[COLUMN_MAPPING_NAMES.LONGITUDE.name]));
      setNormAddressColumnName(
        String(mappings[COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS.name]),
      );
      setLat(getGeoAsNumber(true, false));
      setLong(getGeoAsNumber(false, true));
      if (lat && long && lat !== 0 && long !== 0) {
        map.flyTo([lat, long]);
      }
    }
  }, [
    record,
    map,
    mappings,
    latColumnName,
    longColumnName,
    getGeoAsNumber,
    lat,
    long,
  ]);

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
