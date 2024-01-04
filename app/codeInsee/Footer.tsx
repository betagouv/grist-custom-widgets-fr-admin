"use client";

import { Footer } from "../../components/Footer";

export const MyFooter = () => {
  const source = (
    <a
      title="Api Addok admin - ouvre une nouvelle fenêtre"
      href="https://recherche-entreprises.api.gouv.fr"
      target="_blank"
    >
      api addok admin
    </a>
  );
  return <Footer dataSource={source} />;
};
