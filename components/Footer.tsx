"use client";

import { FC, ReactNode } from "react";

export const Footer: FC<{
  dataSource: ReactNode;
}> = ({ dataSource }) => {
  return (
    <footer className="smaller">
      Source de la donnée : {dataSource}
      <br />
      Un retour à nous faire ? Créez une issue sur{" "}
      <a
        title="Lien github - ouvre une nouvelle fenêtre"
        href="https://github.com/betagouv/grist-custom-widgets-fr-admin"
        target="_blank"
      >
        Github
      </a>{" "}
      OU envoyez nous un mail sur{" "}
      <a href="mailto:donnees@anct.gouv.fr">donnees@anct.gouv.fr</a>
    </footer>
  );
};
