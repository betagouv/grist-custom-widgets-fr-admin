"use client";

import { Accordion } from "../../components/Accordion";

export const Instructions = () => {
  const instructions = (
    <p>
      Ce widget vérifie si des adresses se trouvent dans des Quartiers
      Prioritaires de la Ville (QPV).
      {/* TODO : expliquer ici plutôt le fonctionnement et pas comment faire le paramétrage car plus util ici */}
      <br />
      Pour l'utiliser, configurez vos colonnes préalablement existantes via le
      panneau de création :
      <ul>
        <li>
          <strong>Latitude</strong> et <strong>Longitude</strong> : Indiquez les
          colonnes contenant les coordonnées à vérifier
        </li>
        <li>
          <strong>Est en QPV</strong> : Indiquez la colonne (de type booléen)
          qui affichera Vrai si l'adresse est en QPV, Faux sinon
        </li>
        <li>
          <strong>Nom du QPV</strong> : Indiquez la colonne qui affichera le nom
          du QPV, si l'adresse s'y trouve.
        </li>
        <li>
          <strong>Code du QPV</strong> : Sélectionnez la colonne qui affichera
          le code du QPV, si l'adresse s'y trouve.
        </li>
      </ul>
      Une fois configuré, cliquez sur "Analyser les coordonnées" pour lancer
      l'analyse et remplir les colonnes de résultats.
    </p>
  );

  return <Accordion label="Afficher les instructions" body={instructions} />;
};
