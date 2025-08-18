"use client";

import { Footer } from "../../components/Footer";

export const MyFooter = () => {
  const source = (
    <a
      title="GeoJson QPV - ouvre un nouvel onglet"
      href="https://www.data.gouv.fr/fr/datasets/r/942d4ee8-8142-4556-8ea1-335537ce1119"
      target="_blank"
    >
      GeoJson QPV
    </a>
  );
  return <Footer dataSource={source} />;
};
