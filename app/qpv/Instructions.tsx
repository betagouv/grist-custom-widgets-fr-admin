"use client";

import { Accordion } from "../../components/Accordion";

export const Instructions = () => {
  const instructions = (
    <p>
      Ce widget vérifie si des adresses se trouvent dans des Quartiers
      Prioritaires de la Ville (QPV).
      {/* TODO : expliquer ici plutôt le fonctionnement et pas comment faire le paramétrage car plus util ici */}
      <br />
      Fonctionnement:
      <ul>
        <li>
          Assurez-vous que vos adresses ont été géocodées. Si ce n'est pas le
          cas, utilisez d'abord le widget géocodeur pour remplir les colonnes de
          latitude et longitude.
        </li>
        <li>
          Vérifiez que vous avez correctement désigné les trois colonnes qui
          seront automatiquement remplies (statut en QPV ou hors QPV, le nom du
          QPV et le code du QPV).
        </li>
        <li>
          Lancez l'analyse et constatez les résultats. Attention : si aucune de
          vos adresses ne se trouve dans un QPV, les colonnes resteront vides.
        </li>
        <li>Une fois l'analyse effectuée, vous pouvez supprimer cette Vue.</li>
      </ul>
    </p>
  );

  return <Accordion label="Afficher les instructions" body={instructions} />;
};
