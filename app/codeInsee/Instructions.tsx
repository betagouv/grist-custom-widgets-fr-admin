"use client";

import { Accordion } from "../../components/Accordion";
import { NATURE_JURIDIQUE } from "./constants";

export const Instructions = () => {
  const instructions = (
    <>
      Cette Vue permet d'indiquer le code de la collectivité correspondant à
      chaque ligne.
      <br />
      Fonctionnement :
      <ul>
        <li>
          Indiquer la colonne respondant au nom de la collectivité ainsi que la
          colonne à remplir pour les code Insee (colonne de type Texte). Il est
          possible d'indiquer d'autre colonne pour aider à désambiguer.
        </li>
        <li>
          Faire une recherche globale afin de faire une première passe sur
          toutes vos lignes.
        </li>
        <li>
          Désanbiguer ligne par ligne. La raison de pourquoi la Vue n'a pas
          réussi à remplir le code Insee automatiquement vous sera indiqué.
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
      <br />
      Voici la liste des <b>natures juridiques</b> valides dans l'API interrogée
      et le type de code qui lui correspond. Si une nature juridique est
      indiquée mais ne correspond à aucune présente dans cette liste elle sera
      alors ignorée.
      <br />
      <table cellSpacing="0">
        <thead>
          <tr>
            <th>Identifiant</th>
            <th>Nom</th>
            <th>Type de Code</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(NATURE_JURIDIQUE).map((nature) => {
            return (
              <tr key={nature.key}>
                <th>{nature.key}</th>
                <td>{nature.label}</td>
                <td>{nature.typeCode}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );

  return <Accordion label="Afficher les instructions" body={instructions} />;
};
