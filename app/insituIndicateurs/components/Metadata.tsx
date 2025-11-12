"use client";

import {
  Metadata,
} from "../types";

export const MetadataComponent = ({metadata}: {metadata: Metadata}) => {
  return <div className="metadata">
    Meta données de l'indicateur :
    <ul>
      <li>Nom : {metadata?.nom}</li>
      <li>Description : {metadata?.description}</li>
      <li>Mailles disponibles : {metadata?.mailles?.join(", ")}</li>
      {metadata?.unite && <li>Unité : {metadata?.unite}</li>}
      {metadata?.returnType && (
        <li>Type d'indicateur : {metadata?.returnType}</li>
      )}
    </ul>
  </div>;
};
