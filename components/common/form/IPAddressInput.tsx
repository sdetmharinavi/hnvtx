import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Globe } from 'lucide-react';
// import { Label } from '@/components/common/ui';

// The ValidationState type remains useful for internal logic
interface ValidationState {
  isValid: boolean | null;
  type: 'IPv4' | 'IPv6' | null;
  error: string | null;
}

// Props are simplified. We now only expect a simple onChange.
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
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: null,
    type: null,
    error: null,
  });

  // IPv4 validation
  const isValidIPv4 = useCallback((ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);
    if (!match) return false;

    return match.slice(1).every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255 && octet === num.toString();
    });
  }, []);

  const isValidIPv6Basic = useCallback((ip: string): boolean => {
    // Normalize the IPv6 address
    const normalized = ip.toLowerCase();

    // Handle :: compression
    if (normalized.includes('::')) {
      const parts = normalized.split('::');
      if (parts.length > 2) return false; // More than one ::

      const leftParts = parts[0] ? parts[0].split(':') : [];
      const rightParts = parts[1] ? parts[1].split(':') : [];
      const totalParts = leftParts.length + rightParts.length;

      if (totalParts > 8) return false;
    } else {
      // No compression, should have exactly 8 parts
      const parts = normalized.split(':');
      if (parts.length !== 8) return false;
    }

    // Validate each hexadecimal group
    const hexGroups = normalized
      .split('::')
      .join(':')
      .split(':')
      .filter((part) => part !== '');
    return hexGroups.every((group) => {
      if (group.length === 0 || group.length > 4) return false;
      return /^[0-9a-f]+$/i.test(group);
    });
  }, []);

  // IPv6 validation
  const isValidIPv6 = useCallback(
    (ip: string): boolean => {
      // Handle IPv6 with embedded IPv4
      const ipv6WithIPv4Regex =
        /^([0-9a-fA-F:]+):(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;
      if (ipv6WithIPv4Regex.test(ip)) {
        const parts = ip.split(':');
        const ipv4Part = parts[parts.length - 1];
        const ipv6Part = parts.slice(0, -1).join(':') + ':';
        return isValidIPv4(ipv4Part) && isValidIPv6Basic(ipv6Part.slice(0, -1));
      }

      return isValidIPv6Basic(ip);
    },
    [isValidIPv4, isValidIPv6Basic]
  );

  const validateIP = useCallback(
    (ip: string): ValidationState => {
      if (!ip.trim()) {
        return { isValid: null, type: null, error: null };
      }

      let isIPv4Valid = false;
      let isIPv6Valid = false;

      if (allowIPv4) {
        isIPv4Valid = isValidIPv4(ip);
      }

      if (allowIPv6) {
        isIPv6Valid = isValidIPv6(ip);
      }

      if (isIPv4Valid) {
        return { isValid: true, type: 'IPv4', error: null };
      } else if (isIPv6Valid) {
        return { isValid: true, type: 'IPv6', error: null };
      } else {
        let error = 'Invalid IP address format';
        if (!allowIPv4 && !allowIPv6) {
          error = 'IP address input is disabled';
        } else if (!allowIPv4) {
          error = 'Only IPv6 addresses are allowed';
        } else if (!allowIPv6) {
          error = 'Only IPv4 addresses are allowed';
        }
        return { isValid: false, type: null, error };
      }
    },
    [allowIPv4, allowIPv6, isValidIPv4, isValidIPv6]
  );

  // const formatIPv6 = (ip: string): string => {
  //   // Basic IPv6 formatting - expand compressed notation for display
  //   if (!ip.includes('::')) return ip;

  //   const parts = ip.split('::');
  //   const leftParts = parts[0] ? parts[0].split(':') : [];
  //   const rightParts = parts[1] ? parts[1].split(':') : [];
  //   const missingParts = 8 - leftParts.length - rightParts.length;

  //   const expanded = [
  //     ...leftParts,
  //     ...Array(missingParts).fill('0000'),
  //     ...rightParts,
  //   ];

  //   return expanded.map((part) => part.padStart(4, '0')).join(':');
  // };

  // Update validation state whenever the prop value changes from the outside (e.g., from react-hook-form)
  useEffect(() => {
    setValidationState(validateIP(value));
  }, [value, validateIP]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    // We call the onChange from props directly, letting react-hook-form manage the state.
    onChange(newValue);
  };

  const getInputClass = (): string => {
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
          value={value} // Directly use the value from props
          onChange={handleInputChange}
          placeholder={placeholder}
          className={getInputClass()}
          autoComplete="off"
          spellCheck="false"
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {validationState.isValid === true && (
            <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
          )}
          {validationState.isValid === false && (
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
          )}
          {validationState.isValid === null && value && (
            <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>

      <div className="mt-2 min-h-[1.5rem]">
        {validationState.isValid === false && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{validationState.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPAddressInput;
