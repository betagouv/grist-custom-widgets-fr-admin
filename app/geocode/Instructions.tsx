"use client";

import { useState } from "react";

export const Instructions = () => {
  const [isInfoActive, setIsInfoActive] = useState(false);
  return (
    <div>
      <div
        className="accordion-title"
        onClick={() => setIsInfoActive(!isInfoActive)}
      >
        <div>Afficher les instructions</div>
        <div>{isInfoActive ? "-" : "+"}</div>
      </div>
      {isInfoActive && (
        <p className="accordion-body">
          Cette Vue permet d'indiquer le Geocodage (longitude et latitude)
          correspondant à chaque ligne.
          <br />
          Fonctionnement :
          <ul>
            <li>
              Indiquer la colonne respondant à l'adresse ainsi que les colonnes
              de longitude et latitude (colonne de type Numérique). Il est
              possible d'ajouter la colonne Adresse Normalisée pour indiquer le
              nom officiel du géocodage trouvé.
            </li>
            <li>
              Faire une recherche globale afin de faire une première passe sur
              toutes vos lignes.
            </li>
            <li>
              Désanbiguer ligne par ligne. La raison de pourquoi la Vue n'a pas
              réussi à remplir le géocodage automatiquement vous sera indiqué.
              Attention: si la ligne selectionnée reste bloquée sur la première
              de votre table c'est que le lien entre la Vue et la table est
              manquant. Vous devez indiquer dans les données sources de la Vue
              le "Selectionner par".
            </li>
            <li>
              Une fois le nettoyage de la donnée effectuée vous pouvez supprimer
              cette vue.
            </li>
          </ul>
        </p>
      )}
    </div>
  );
};
