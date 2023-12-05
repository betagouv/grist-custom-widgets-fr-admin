import Image from "next/image";
import configurationSvg from "../../public/configuration.svg";
import { Instructions } from "./Instructions";

export const Configuration = () => {
  return (
    <div>
      <Image priority src={configurationSvg} alt="Configuration" />
      <p>
        Commencer par configurer les colonnes source et destination dans les
        options du widget
      </p>
      <Instructions />
    </div>
  );
};
