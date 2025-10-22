"use client";

import { Footer } from "../../components/Footer";

export const MyFooter = () => {
  const source = (
    <a
      title="Api Insitu - ouvre un nouvel onglet"
      href="https://servitu.donnees.incubateur.anct.gouv.fr/graphql"
      target="_blank"
    >
      api Insitu
    </a>
  );
  return <Footer dataSource={source} />;
};
