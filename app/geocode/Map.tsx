"use client";

import { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { DEFAULT_MAP_CENTER } from "./constants";

function Map({ children }: { children?: ReactNode }) {
  return (
    <div style={{ width: "100%", height: "300px" }}>
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={8}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </div>
  );
}

export default Map;
