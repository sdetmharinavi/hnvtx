import React, { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import { Label } from '@/components/common/ui';

interface ValidationState {
  isValid: boolean | null;
  type: 'IPv4' | 'IPv6' | null;
  error: string | null;
}

interface IPAddressInputProps {
  value?: string;
  onChange?: (value: string, validation: ValidationState) => void;
  placeholder?: string;
  allowIPv4?: boolean;
  allowIPv6?: boolean;
  className?: string;
  label?: string;
}

const IPAddressInput: React.FC<IPAddressInputProps> = ({ 
  value = '', 
  onChange = () => {}, 
  placeholder = 'Enter IP address',
  allowIPv4 = true,
  allowIPv6 = true,
  className = '',
  label = '',
}) => {
  const [inputValue, setInputValue] = useState<string>(value);
  const [validationState, setValidationState] = useState<ValidationState>({ isValid: null, type: null, error: null });

  // IPv4 validation
  const isValidIPv4 = useCallback((ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);
    if (!match) return false;
    
    return match.slice(1).every(octet => {
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
    const hexGroups = normalized.split('::').join(':').split(':').filter(part => part !== '');
    return hexGroups.every(group => {
      if (group.length === 0 || group.length > 4) return false;
      return /^[0-9a-f]+$/i.test(group);
    });
  }, []);

   // IPv6 validation
   const isValidIPv6 = useCallback((ip: string): boolean => {
    // Handle IPv6 with embedded IPv4
    const ipv6WithIPv4Regex = /^([0-9a-fA-F:]+):(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;
    if (ipv6WithIPv4Regex.test(ip)) {
      const parts = ip.split(':');
      const ipv4Part = parts[parts.length - 1];
      const ipv6Part = parts.slice(0, -1).join(':') + ':';
      return isValidIPv4(ipv4Part) && isValidIPv6Basic(ipv6Part.slice(0, -1));
    }
    
    return isValidIPv6Basic(ip);
  }, [isValidIPv4, isValidIPv6Basic]);

  const validateIP = useCallback((ip: string): ValidationState => {
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
  }, [allowIPv4, allowIPv6, isValidIPv4, isValidIPv6]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const validation = validateIP(newValue);
    setValidationState(validation);
    
    onChange(newValue, validation);
  };

  const formatIPv6 = (ip: string): string => {
    // Basic IPv6 formatting - expand compressed notation for display
    if (!ip.includes('::')) return ip;
    
    const parts = ip.split('::');
    const leftParts = parts[0] ? parts[0].split(':') : [];
    const rightParts = parts[1] ? parts[1].split(':') : [];
    const missingParts = 8 - leftParts.length - rightParts.length;
    
    const expanded = [
      ...leftParts,
      ...Array(missingParts).fill('0000'),
      ...rightParts
    ];
    
    return expanded.map(part => part.padStart(4, '0')).join(':');
  };

  const getInputClass = (): string => {
    let baseClass = `w-full px-4 py-3 border rounded-lg transition-all duration-200 font-mono text-sm ${className}`;
    
    if (validationState.isValid === true) {
      baseClass += ' border-green-500 bg-green-50 focus:border-green-600 focus:ring-2 focus:ring-green-200 dark:bg-green-900/20 dark:border-green-600 dark:focus:border-green-500 dark:focus:ring-green-500/20';
    } else if (validationState.isValid === false) {
      baseClass += ' border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-200 dark:bg-red-900/20 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-500/20';
    } else {
      baseClass += ' border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/20';
    }
    
    return baseClass;
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        {label && (
          <Label className="dark:text-gray-300">{label}</Label>
        )}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={getInputClass()}
          autoComplete="off"
          spellCheck="false"
        />
        
        {/* Status icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {validationState.isValid === true && (
            <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
          )}
          {validationState.isValid === false && (
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
          )}
          {validationState.isValid === null && inputValue && (
            <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>

      {/* Validation feedback */}
      <div className="mt-2 min-h-[1.5rem]">
        {validationState.isValid === true && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Valid {validationState.type} address</span>
          </div>
        )}
        
        {validationState.isValid === false && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{validationState.error}</span>
          </div>
        )}
        
        {validationState.isValid === true && validationState.type === 'IPv6' && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
            Expanded: {formatIPv6(inputValue)}
          </div>
        )}
      </div>
    </div>
  );
};

export default IPAddressInput;

// // Demo component showing usage examples
// const IPAddressDemo = () => {
//   const [ipv4Value, setIPv4Value] = useState('');
//   const [ipv6Value, setIPv6Value] = useState('');
//   const [anyValue, setAnyValue] = useState('');

//   const handleIPChange = (value: string, validation: ValidationState, setter: (value: string) => void): void => {
//     setter(value);
//     console.log('IP changed:', { value, validation });
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <div className="max-w-2xl mx-auto space-y-8">
//         <div className="text-center">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">IP Address Input Component</h1>
//           <p className="text-gray-600">Supports IPv4 and IPv6 with real-time validation</p>
//         </div>

//         <div className="space-y-6">
//           {/* IPv4 Only */}
//           <div className="bg-white p-6 rounded-lg shadow-sm border">
//             <h2 className="text-lg font-semibold text-gray-800 mb-3">IPv4 Only</h2>
//             <IPAddressInput
//               value={ipv4Value}
//               onChange={(value, validation) => handleIPChange(value, validation, setIPv4Value)}
//               placeholder="Enter IPv4 address (e.g., 192.168.1.1)"
//               allowIPv4={true}
//               allowIPv6={false}
//             />
//             <div className="mt-2 text-sm text-gray-500">
//               Current value: <code className="bg-gray-100 px-1 rounded">{ipv4Value || 'empty'}</code>
//             </div>
//           </div>

//           {/* IPv6 Only */}
//           <div className="bg-white p-6 rounded-lg shadow-sm border">
//             <h2 className="text-lg font-semibold text-gray-800 mb-3">IPv6 Only</h2>
//             <IPAddressInput
//               value={ipv6Value}
//               onChange={(value, validation) => handleIPChange(value, validation, setIPv6Value)}
//               placeholder="Enter IPv6 address (e.g., 2001:db8::1)"
//               allowIPv4={false}
//               allowIPv6={true}
//             />
//             <div className="mt-2 text-sm text-gray-500">
//               Current value: <code className="bg-gray-100 px-1 rounded">{ipv6Value || 'empty'}</code>
//             </div>
//           </div>

//           {/* Both IPv4 and IPv6 */}
//           <div className="bg-white p-6 rounded-lg shadow-sm border">
//             <h2 className="text-lg font-semibold text-gray-800 mb-3">IPv4 or IPv6</h2>
//             <IPAddressInput
//               value={anyValue}
//               onChange={(value, validation) => handleIPChange(value, validation, setAnyValue)}
//               placeholder="Enter any IP address"
//               allowIPv4={true}
//               allowIPv6={true}
//             />
//             <div className="mt-2 text-sm text-gray-500">
//               Current value: <code className="bg-gray-100 px-1 rounded">{anyValue || 'empty'}</code>
//             </div>
//           </div>
//         </div>

//         {/* Example values for testing */}
//         <div className="bg-white p-6 rounded-lg shadow-sm border">
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Examples</h3>
//           <div className="space-y-2 text-sm">
//             <div>
//               <strong>Valid IPv4:</strong>
//               <ul className="ml-4 mt-1 space-y-1 text-gray-600">
//                 <li><code className="bg-gray-100 px-1 rounded">192.168.1.1</code></li>
//                 <li><code className="bg-gray-100 px-1 rounded">10.0.0.1</code></li>
//                 <li><code className="bg-gray-100 px-1 rounded">127.0.0.1</code></li>
//               </ul>
//             </div>
//             <div>
//               <strong>Valid IPv6:</strong>
//               <ul className="ml-4 mt-1 space-y-1 text-gray-600">
//                 <li><code className="bg-gray-100 px-1 rounded">2001:db8::1</code></li>
//                 <li><code className="bg-gray-100 px-1 rounded">::1</code></li>
//                 <li><code className="bg-gray-100 px-1 rounded">fe80::1%lo0</code> (with zone ID)</li>
//                 <li><code className="bg-gray-100 px-1 rounded">2001:db8:85a3::8a2e:370:7334</code></li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


