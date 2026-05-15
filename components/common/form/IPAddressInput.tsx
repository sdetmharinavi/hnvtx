'use client';

import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle2, Globe } from 'lucide-react';

interface IPAddressInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowIPv4?: boolean;
  allowIPv6?: boolean;
  className?: string;
}

const IPAddressInput: React.FC<IPAddressInputProps> = ({
  value = '',
  onChange = () => {},
  placeholder = 'Enter IP address',
  allowIPv4 = true,
  allowIPv6 = true,
  className = '',
}) => {
  // Memoize validation logic to run only when value/props change
  const validationState = useMemo(() => {
    const ip = value.trim();

    if (!ip) {
      return { isValid: null, type: null, error: null };
    }

    // IPv4 Validation (Octets 0-255 + Optional CIDR 0-32)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/;
    const v4Match = ip.match(ipv4Regex);

    let isIPv4Valid = false;
    if (v4Match && allowIPv4) {
      const validOctets = v4Match.slice(1, 5).every((octet) => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255 && octet === num.toString();
      });

      const cidr = v4Match[5];
      const validCidr = cidr ? parseInt(cidr, 10) >= 0 && parseInt(cidr, 10) <= 32 : true;

      isIPv4Valid = validOctets && validCidr;
    }

    if (isIPv4Valid) return { isValid: true, type: 'IPv4', error: null };

    // IPv6 Validation (Basic Structure + CIDR 0-128)
    if (allowIPv6) {
      // Split address and CIDR
      const [addressPart, cidrPart] = ip.split('/');

      if (cidrPart) {
        const cidrNum = parseInt(cidrPart, 10);
        if (isNaN(cidrNum) || cidrNum < 0 || cidrNum > 128) {
          return { isValid: false, type: null, error: 'Invalid IPv6 CIDR' };
        }
      }

      // Check for IPv4-mapped IPv6
      const ipv4MappedRegex = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;
      if (ipv4MappedRegex.test(addressPart)) {
        return { isValid: true, type: 'IPv6', error: null };
      }

      // Basic Hex check
      // Allow :: compression (max one) and hex chars
      const parts = addressPart.split('::');
      if (parts.length <= 2) {
        const hexSections = addressPart.split(/::|:/).filter((s) => s !== '');
        const isValidHex = hexSections.every((s) => /^[0-9a-f]{1,4}$/i.test(s));
        // Max 8 sections
        if (isValidHex && hexSections.length <= 8) {
          return { isValid: true, type: 'IPv6', error: null };
        }
      }
    }

    return { isValid: false, type: null, error: 'Invalid IP address format' };
  }, [value, allowIPv4, allowIPv6]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const getInputClass = () => {
    let baseClass = `w-full px-4 py-3 border rounded-lg transition-all duration-200 font-mono text-sm ${className}`;

    if (validationState.isValid === true) {
      baseClass +=
        ' border-green-500 bg-green-50 focus:border-green-600 focus:ring-2 focus:ring-green-200 dark:bg-green-900/20 dark:border-green-600 dark:focus:border-green-500 dark:focus:ring-green-500/20';
    } else if (validationState.isValid === false) {
      baseClass +=
        ' border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-200 dark:bg-red-900/20 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-500/20';
    } else {
      baseClass +=
        ' border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/20';
    }

    return baseClass;
  };

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={getInputClass()}
          autoComplete="off"
          spellCheck="false"
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {validationState.isValid === true && (
            <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
          )}
          {validationState.isValid === false && (
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
          )}
          {validationState.isValid === null && (
            <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>
      {/* Optional: Show error message text below */}
      {/* {validationState.isValid === false && validationState.error && (
        <p className="mt-1 text-xs text-red-500">{validationState.error}</p>
      )} */}
    </div>
  );
};

export default IPAddressInput;
