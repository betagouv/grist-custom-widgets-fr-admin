"use client";

import { Footer } from "../../components/Footer";

export const MyFooter = () => {
  const source = (
    <a
      title="Api Adresse - ouvre une nouvelle fenêtre"
      href="https://adresse.data.gouv.fr/api-doc/adresse"
      target="_blank"
    >
      api Adresse
    </a>
  );
  return <Footer dataSource={source} />;
};
