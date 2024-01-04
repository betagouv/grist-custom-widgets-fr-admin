"use client";

import { Footer } from "../../components/Footer";

export const MyFooter = () => {
  const source = (
    <a
      title="Api Recherche d'entreprises - ouvre une nouvelle fenêtre"
      href="https://recherche-entreprises.api.gouv.fr"
      target="_blank"
    >
      api Recherche d'entreprises
    </a>
  );
  return <Footer dataSource={source} />;
};
