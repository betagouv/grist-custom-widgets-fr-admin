'use client';

import { useEffect, useState } from "react";
import { LatLngExpression } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import { useGristEffect } from "../../lib/grist/hooks";
import { gristReady, addObjectInRecord } from "../../lib/grist/plugin-api";
import { cleanRecordData, getGeoCodeDataFromApi } from "./lib";
import { DynamicMarker, MapRecord } from "./DynamicMarker";
import { ChoiceBanner, DirtyGeoCodeData, GeoCodeApiResult } from "./ChoiceBanner";
import './page.css'
import {COLUMN_MAPPING_NAMES} from "./constants";
import {RowRecord} from "grist/GristData";

const DEFAULT_MAP_CENTER: LatLngExpression = [48.864716, 2.349]; // Paris

const GeoCodeur = () => {
  const [record, setRecord] = useState<MapRecord>();
  const [results, setResults] = useState([]);
  const [cleanData, setCleanData] = useState<CleanGeoCodeData[]>([]);
  const [dirtyData, setDirtyData] = useState<DirtyGeoCodeData[]>([]);
  const [mappings, setMappings] = useState();

  useGristEffect(() => {
    gristReady("full", Object.values(COLUMN_MAPPING_NAMES));
    getGeoCodeDataFromApi(setResults, setMappings);
    grist.onRecord((rec: RowRecord|null) => {
      const data = grist.mapColumnNames(rec!); // FIXME rec can be null...
      const mapRecord: MapRecord = {
        Latitude: data[COLUMN_MAPPING_NAMES.LATITUDE],
        Longitude: data[COLUMN_MAPPING_NAMES.LONGITUDE],
        Adresse_Normalisee: data[COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS],
        id: rec!.id,
      };
      setRecord(mapRecord);
    });
  }, []);

  useEffect(() => {
    if (results && results.length > 0) {
      const { clean, dirty } = cleanRecordData(results);
      setCleanData(clean);
      setDirtyData(dirty);
    }
  }, [results]);

  useEffect(() => {
    if (cleanData && cleanData.length > 0) {
      cleanData.forEach((clean: CleanGeoCodeData) => {
        const data = {
          [COLUMN_MAPPING_NAMES.LATITUDE]: clean.lat,
          [COLUMN_MAPPING_NAMES.LONGITUDE]: clean.lng,
          [COLUMN_MAPPING_NAMES.NORMALIZED_ADDRESS]: clean.address_nomalized,
        };
        addObjectInRecord(clean.recordId, grist.mapColumnNamesBack(data));
      });
    }
  }, [cleanData]);

  const passDataFromDirtyToClean = (
    adressSelected: GeoCodeApiResult,
    initalData: DirtyGeoCodeData
  ) => {
    setDirtyData(
      dirtyData.filter((item) => item.recordId !== initalData.recordId)
    );
    setCleanData([
      ...cleanData,
      {
        lat: adressSelected.lat,
        lng: adressSelected.lng,
        address_nomalized: adressSelected.address_nomalized,
        recordId: initalData.recordId,
        address: initalData.address,
        score: adressSelected.score,
      },
    ]);
  };

  return (
    <div className="map__container">
      <MapContainer center={DEFAULT_MAP_CENTER} zoom={8}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {record && <DynamicMarker record={record} />}
      </MapContainer>
      {dirtyData && dirtyData.length > 0 && (
        <div className="absolute-banner">
          <ChoiceBanner
            dirtyData={dirtyData[0]}
            passDataFromDirtyToClean={passDataFromDirtyToClean}
          />
        </div>
      )}
    </div>
  );
};

type CleanGeoCodeData = {
  lat: number;
  lng: number;
  address_nomalized: string;
  recordId: number;
  address: string;
  score: number;
};

export default GeoCodeur
