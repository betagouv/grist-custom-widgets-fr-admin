"use client";

import { Accordion } from "../../components/Accordion";

export const Instructions = () => {
  const instructions = (
    <>
      Cette Vue permet d'indiquer le code SIREN correspondant à chaque ligne.
      <br />
      Fonctionnement :
      <ul>
        <li>
          Indiquer la colonne respondant au nom de la société ainsi que la
          colonne à remplir pour le code SIREN (colonne de type Texte). Il est
          possible d'indiquer d'autre colonne pour aider à désambiguer.
        </li>
        <li>
          Vérifiez que vous avez bien créer un lien entre la vue et la table :
          dans Données Source &gt; Sélectionner par : choisir la table qui
          contient vos entités pour lesquels il faut définir le code SIREN.
        </li>
        <li>
          Faire une recherche globale afin de faire une première passe sur
          toutes vos lignes.
        </li>
        <li>
          Désambiguer ligne par ligne. La raison de pourquoi la Vue n'a pas
          réussi à remplir le code SIREN automatiquement vous sera indiqué.
          Attention: si la ligne selectionnée reste bloquée sur la première de
          votre table c'est que le lien entre la Vue et la table est manquant.
          Vous devez indiquer dans les données sources de la Vue le
          "Selectionner par".
        </li>
        <li>
          Une fois le nettoyage de la donnée effectuée vous pouvez supprimer
          cette vue.
        </li>
      </ul>
    </>
  );

  return <Accordion label="Afficher les instructions" body={instructions} />;
};
