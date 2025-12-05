"use client";

import { Footer } from "../../components/Footer";

export const MyFooter = () => {
  const source = (
    <a
      title="API Découpage administratif - ouvre une nouvelle fenêtre"
      href="https://geo.api.gouv.fr/decoupage-administratif"
      target="_blank"
    >
      API Découpage administratif
    </a>
  );
  return <Footer dataSource={source} />;
};
