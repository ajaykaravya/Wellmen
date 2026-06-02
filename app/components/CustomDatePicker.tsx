"use client";

import React, { useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";

interface CustomDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  disabled = false,
  minDate,
  maxDate,
}) => {
  const formatDate = (date: Date) =>
    `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;

  const parseDateValue = (value?: string) => {
    if (!value) return null;
    const trimmed = String(value).trim();

    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const date = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      );
      if (!isNaN(date.getTime())) return date;
    }

    const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      const date = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      );
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseDateValue(value);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formatted = formatDate(date);
      onChange(formatted);
    } else {
      onChange("");
    }
    setIsOpen(false);
  };

  const handleInputClick = () => {
    if (!disabled) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) {
        const estimatedCalendarHeight = 340;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        setOpenDirection(
          spaceBelow < estimatedCalendarHeight && spaceAbove > spaceBelow
            ? "up"
            : "down",
        );
      }
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
  };

  const displayValue = value || "";

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          className={`theme-input w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] focus:border-transparent pr-10 ${className} ${disabled ? "cursor-not-allowed opacity-70" : "cursor-text"}`}
        />
        <FaCalendarAlt
          className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--theme-text-muted)" }}
          size={16}
        />
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 ${openDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            onClickOutside={() => setIsOpen(false)}
            inline
            minDate={minDate}
            maxDate={maxDate}
            dateFormat="dd/MM/yyyy"
            calendarClassName="theme-surface shadow-lg rounded-md"
            className="hidden" // Hide the default input
          />
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
