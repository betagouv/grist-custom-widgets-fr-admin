"use client";

import { Accordion } from "../../components/Accordion";
import { DECOUPAGE_ADMIN } from "./constants";
import { MAILLE_ACCEPTED_VALUES } from "./types";

export const Instructions = () => {
  const instructions = (
    <>
      Cette Vue permet d'indiquer le code INSEE de la collectivité correspondant à
      chaque ligne.
      <br />
      Fonctionnement :
      <ul>
        <li>
          Indiquer la colonne correspondant au nom de la collectivité ainsi que la
          colonne à remplir pour les codes INSEE ou SIREN (colonne de type
          Texte). Il est possible d'indiquer d'autres colonnes pour aider à
          désambiguïser. Si la collectivité est un EPCI, c'est un code SIREN qui sera renseigné.
        </li>
        <li>
          Si vous n'avez pas indiqué de colonne permettant de désambiguïser sur la
          maille de la collectivité à rechercher, vous pouvez la
          définir globalement via la liste déroulante appropriée.
        </li>
        <li>
          Vérifiez que vous avez bien créé un lien entre la vue et la table :
          dans Données Source &gt; Sélectionner par : choisir la table qui
          contient vos communes.
        </li>
        <li>
          Faire une recherche globale afin de faire une première passe sur
          toutes vos lignes.
        </li>
        <li>
          Désambiguïser ligne par ligne. La raison pour laquelle la Vue n'a pas
          réussi à remplir le code INSEE automatiquement vous sera indiquée.
          Attention : si la ligne sélectionnée reste bloquée sur la première de
          votre table, c'est que le lien entre la Vue et la table est manquant.
          Vous devez indiquer dans les données sources de la Vue le
          "Sélectionner par".
        </li>
        <li>
          Une fois le nettoyage de la donnée effectué, vous pouvez supprimer
          cette vue.
        </li>
      </ul>
      <br />
      Voici la liste des <b>mailles</b> valides dans l'API interrogée
      et le type de code qui lui correspond. Si une maille est
      indiquée mais ne correspond à aucune présente dans cette liste elle sera
      alors ignorée.
      <br />
      <table cellSpacing="0">
        <thead>
          <tr>
            <th>Identifiant</th>
            <th>Nom</th>
            <th>Valeurs acceptées</th>
            <th>Type de Code</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(DECOUPAGE_ADMIN).map((maille) => {
            const acceptedValues = maille.key in MAILLE_ACCEPTED_VALUES 
              ? MAILLE_ACCEPTED_VALUES[maille.key as keyof typeof MAILLE_ACCEPTED_VALUES]
              : [];
            return (
              <tr key={maille.key}>
                <th>{maille.key}</th>
                <td>{maille.label}</td>
                <td>{acceptedValues.join(", ")}</td>
                <td>{maille.typeCode}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );

  return <Accordion label="Afficher les instructions" body={instructions} />;
};
