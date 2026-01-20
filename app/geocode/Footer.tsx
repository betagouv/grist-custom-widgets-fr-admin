"use client";

import { Footer } from "../../components/Footer";
import { GEOCODE_DOC_URL } from "./lib";

export const MyFooter = () => {
  const source = (
    <a
      title="Api Adresse - ouvre une nouvelle fenêtre"
      href={GEOCODE_DOC_URL}
      target="_blank"
    >
      api Adresse
    </a>
  );
  return <Footer dataSource={source} />;
};
