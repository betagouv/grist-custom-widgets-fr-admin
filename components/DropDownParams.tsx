"use client";

import { FC, useState } from "react";
import "./dropDownParams.css";

type DropDownItem = {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export const DropDownParams: FC<{
  label: string;
  list: DropDownItem[];
  selected: DropDownItem | null;
  onChange: (elem: DropDownItem | null) => void;
}> = ({ label, list, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = (elem: DropDownItem | null) => {
    onChange(elem);
    setIsOpen(false);
  };
  return (
    <div>
      {label}
      <div className="dropdown">
        <button type="button" className="secondary" onClick={toggleDropdown}>
          <span>{selected ? selected.label : "Selectionner un choix"} </span>
          <span className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              {isOpen ? (
                <path
                  d="M11.9999 10.8284L7.0502 15.7782L5.63599 14.364L11.9999 8L18.3639 14.364L16.9497 15.7782L11.9999 10.8284Z"
                  fill="currentColor"
                ></path>
              ) : (
                <path
                  d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"
                  fill="currentColor"
                ></path>
              )}
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="dropdown-list">
            <ul
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              <li>
                <a
                  href="#"
                  className="dropdown-elem dropdown-no-selected"
                  onClick={() => closeDropdown(null)}
                >
                  Selectionner un choix
                </a>
              </li>
              {list.map((elem, index) => {
                return (
                  <li key={index}>
                    <a
                      href="#"
                      className="dropdown-elem"
                      onClick={() => closeDropdown(elem)}
                    >
                      {elem.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
