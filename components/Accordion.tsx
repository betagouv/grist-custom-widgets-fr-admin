"use client";

import { FC, ReactNode, useState } from "react";
import "./accordion.css";

export const Accordion: FC<{
  label: string;
  body: ReactNode;
}> = ({ label, body }) => {
  const [isAccordionActive, setIsAccordionActive] = useState(false);
  return (
    <div>
      <div
        className="accordion-title"
        onClick={() => setIsAccordionActive(!isAccordionActive)}
      >
        <div>{label}</div>
        <div>{isAccordionActive ? "-" : "+"}</div>
      </div>
      {isAccordionActive && <div className="accordion-body">{body}</div>}
    </div>
  );
};
