"use client";

import { Accordion } from "../../components/Accordion";

export const Instructions = () => {
  const instructions = (
    <>
      Cette Vue a pour but de rajouter la valeur d'un indicateur présent dans le
      Catalogue d'indicateurs pour chaque territoire de la table. Une ligne
      égale un territoire. Fonctionnement :
      <ul>
        <li>
          Indiquer la colonne corespondant au code INSEE ainsi que la colonne
          correspondant à la maille de ce code INSEE. Les valeurs possibles dans
          la colonne maille sont "<b>commune</b>", "<b>epci</b>", "
          <b>departement</b>", "<b>region</b>" et "<b>pays</b>"
        </li>
        <li>
          Indiquer la colonne devant recevoir la valeur de l'indicateur. Il
          faudra ensuite aller dans le catalogue d'indicateurs afin de trouver
          l'identifiant qui vous intéresse. Nous vous conseillons de renseigner
          cet identifiant dans la description (ou le titre) de votre colonne
          pour ne pas perdre l'information.
        </li>
        <li>
          Lancer une recherche pour remplir la colonne dédiée à l'indicateur.
          Vous pouvez choisir de remplir que les valeurs vides ou bien faire une
          mise à jour globale
        </li>
        <li>
          Dans la définition de la Vue vous pouvez changer autant de fois que
          vous souhaitez la colonne de destination afin de lancer d'autres
          recherches
        </li>
      </ul>
    </>
  );

  return <Accordion label="Afficher les instructions" body={instructions} />;
};
