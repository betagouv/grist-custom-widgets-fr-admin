"use client";

import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { RowRecord } from "grist/GristData";
import { FC, useEffect, useState } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import { COLUMN_MAPPING_NAMES } from "./constants";

export const DynamicMarker: FC<{
  mappings: WidgetColumnMap | null;
  record: RowRecord;
}> = ({ mappings, record }) => {
  const [latColumnName, setLatColumnName] = useState<string>("");
  const [longColumnName, setLongColumnName] = useState<string>("");
  const [normAddressColumnName, setNormAddressColumnName] =
    useState<string>("");
  const map = useMap();
  useEffect(() => {
    if (record && mappings) {
      setLatColumnName(String(mappings[COLUMN_MAPPING_NAMES.LATITUDE.name]));
      setLongColumnName(String(mappings[COLUMN_MAPPING_NAMES.LONGITUDE.name]));
      setNormAddressColumnName(
        String(mappings[COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS.name]),
      );
      if (
        record[latColumnName] &&
        record[longColumnName] &&
        record[latColumnName] !== 0 &&
        record[longColumnName] !== 0
      ) {
        map.flyTo([
          Number(record[latColumnName]),
          Number(record[longColumnName]),
        ]);
      }
    }
  }, [record, map, mappings, latColumnName, longColumnName]);

  if (!record || !record[latColumnName] || !record[longColumnName]) {
    return null;
  }
  return (
    <Marker
      position={[Number(record[latColumnName]), Number(record[longColumnName])]}
    >
      <Tooltip>{String(record[normAddressColumnName])}</Tooltip>
    </Marker>
  );
};
