"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (value) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return null;
  });

  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<DatePicker>(null);

  useEffect(() => {
    if (value) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const newDate = new Date(year, month, day);
        if (!isNaN(newDate.getTime())) {
          setSelectedDate(newDate);
        }
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      onChange(`${day}/${month}/${year}`);
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    const parts = inputValue.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const newDate = new Date(year, month, day);
      if (!isNaN(newDate.getTime())) {
        setSelectedDate(newDate);
      }
    }
  };

  const displayValue = selectedDate
    ? `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`
    : value || '';

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
        />
        <FaCalendarAlt
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={16}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1">
          <DatePicker
            ref={datePickerRef}
            selected={selectedDate}
            onChange={handleDateChange}
            onClickOutside={() => setIsOpen(false)}
            inline
            minDate={minDate}
            maxDate={maxDate}
            dateFormat="dd/MM/yyyy"
            calendarClassName="shadow-lg border border-gray-300 rounded-md"
            className="hidden" // Hide the default input
          />
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;