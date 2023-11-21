"use client";

import { useState } from "react";

export const Title = () => {
  const [isInfoActive, setIsInfoActive] = useState(false);
  return (
    <div className="title">
      <h1>Ajouter les codes INSEE à partir d&apos;une localité</h1>
      <div
        className="accordion-title"
        onClick={() => setIsInfoActive(!isInfoActive)}
      >
        <div>Afficher les indications</div>
        <div>{isInfoActive ? "-" : "+"}</div>
      </div>
      {isInfoActive && (
        <p className="accordion-body">
          Cette Vue permet d'indiquer le code Insee correspondant à chaque
          ligne.
          <br />
          Fonctionnement :
          <ul>
            <li>
              Indiquer la colonne respondant au nom de la collectivité ainsi que
              la colonne à remplir pour les code Insee (colonne de type Texte).
              Il est possible d'indiquer d'autre colonne pour aider à
              désambiguer.
            </li>
            <li>
              Faire une recherche globale afin de faire une première passe sur
              toutes vos lignes.
            </li>
            <li>
              Désanbiguer ligne par ligne. La raison de pourquoi la Vue n'a pas
              réussi à remplir le code Insee automatiquement vous sera indiqué.
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
