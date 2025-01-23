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
          colonne à remplir pour les codes INSEE ou SIREN (colonne de type
          Texte). Il est possible d'indiquer d'autre colonne pour aider à
          désambiguer.
        </li>
        <li>
          Indiquez si vous souhaitez accepter les codes SIREN en plus des codes
          INSEE.
        </li>
        <li>
          Si vous n'avez pas indiqué de colonne permettant de désanbiguer sur la
          nature juridique de la collectivité à rechercher, vous pouvez le
          définir globalement via la liste déroulante appropriée.
        </li>
        <li>
          Vérifiez que vous avez bien créer un lien entre la vue et la table :
          dans Données Source &gt; Sélectionner par : choisir la table qui
          contient vos communes.
        </li>
        <li>
          Faire une recherche globale afin de faire une première passe sur
          toutes vos lignes.
        </li>
        <li>
          Désambiguer ligne par ligne. La raison de pourquoi la Vue n'a pas
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
            <th>Echelon géo</th>
            <th>Type de Code</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(NATURE_JURIDIQUE).map((nature) => {
            return (
              <tr key={nature.key}>
                <th>{nature.key}</th>
                <td>{nature.label}</td>
                <td>{nature.echelonGeo}</td>
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
