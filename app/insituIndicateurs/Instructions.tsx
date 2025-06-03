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
          <b>département</b>", "<b>région</b>" et "<b>pays</b>"
        </li>
        <li>
          Indiquer la colonne devant recevoir la valeur de l'indicateur. Le nom
          de la colonne doit impérativement être l'identifiant de l'indicateur
          qui vous intéresse. Vous pouvez trouver cet identifiant dans le
          catalogue d'indicateurs lorsque vous êtes sur l'indicateur en question
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
