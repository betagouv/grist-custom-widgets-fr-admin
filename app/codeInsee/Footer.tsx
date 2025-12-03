"use client";

import { Footer } from "../../components/Footer";

export const MyFooter = () => {
  const source = (
    <a
      title="Api Découpage administratif - ouvre une nouvelle fenêtre"
      href="https://geo.api.gouv.fr/decoupage-administratif"
      target="_blank"
    >
      api addok admin
    </a>
  );
  return <Footer dataSource={source} />;
};
