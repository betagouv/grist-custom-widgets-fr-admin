"use client";

import { FC } from "react";

export const Title: FC<{ title: string }> = ({ title }) => {
  return (
    <div className="title">
      <h1>{title}</h1>
    </div>
  );
};
