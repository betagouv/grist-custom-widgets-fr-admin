"use client";

import { FC } from "react";
import "./checkboxParams.css";

export const CheckboxParams: FC<{
  label: string;
  value: boolean;
  onChange: () => void;
}> = ({ label, value, onChange }) => {
  return (
    <label className="toggle">
      <input type="checkbox" checked={value} onChange={onChange} />
      <span className="slider"></span>
      <span className="legend">{label}</span>
    </label>
  );
};
