"use client";

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { COUNTRIES, Country } from "@/constants/countries";

interface PhoneInputWithCountryProps {
  value: string | null;
  onChange: (value: string) => void;
}

export default function PhoneInputWithCountry({
  value,
  onChange,
}: PhoneInputWithCountryProps) {
  // Use a stable initial country (India or default to first in list)
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === "IN") || COUNTRIES[0]
  );

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digit characters to keep phone number clean
    const number = e.target.value.replace(/\D/g, "");
    onChange(`${selectedCountry.dialCode}${number}`);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = COUNTRIES.find((c) => c.code === e.target.value);
    if (country) {
      setSelectedCountry(country);
      // Strip previous dial code from current value
      const currentNumber = (value ?? "").replace(/^\+\d+/, "");
      const newValue = `${country.dialCode}${currentNumber}`;
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Phone Number
      </label>
      <div className="flex gap-2">
        <div className="relative w-44">
          <select
            value={selectedCountry.code}
            onChange={handleCountryChange}
            className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-8 pl-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.dialCode}
              </option>
            ))}
          </select>
          <FaChevronDown className="pointer-events-none absolute top-3 right-2 text-gray-500" />
        </div>

        <input
          type="tel"
          placeholder="Enter phone number"
          // Show only the number part to the user
          value={(value ?? "").replace(selectedCountry.dialCode, "")}
          onChange={handleNumberChange}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      {/* Show full formatted number as hint */}
      {value && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Full Contact Number: <span className="font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}