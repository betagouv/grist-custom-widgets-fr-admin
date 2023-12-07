"use client";

import Image from "next/image";
import configurationSvg from "../public/configuration.svg";
import { FC, ReactNode } from "react";

export const Configuration: FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <div className="centered-column">
      <Image priority src={configurationSvg} alt="Configuration" />
      <p style={{ fontSize: "1.3em", lineHeight: "1.1em" }}>
        Commencer par configurer les colonnes source et destination dans les
        options du widget
      </p>

      {children}
    </div>
  );
};
