/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, ChangeEvent, FocusEvent } from "react";
import { Label } from "@/components/common/ui/label/Label";

// Type definitions
type TextareaResize = "none" | "both" | "horizontal" | "vertical";
type TextareaVariant = "default" | "filled" | "outlined";

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>, value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
  rows?: number;
  maxLength?: number;
  resize?: TextareaResize;
  variant?: TextareaVariant;
  className?: string;
  id?: string;
  showCharCount?: boolean;
  fullWidth?: boolean;
}

// Textarea Component
export const Textarea: React.FC<TextareaProps> = ({
  value = "",
  onChange = (e: ChangeEvent<HTMLTextAreaElement>, value: string) => {},
  placeholder = "",
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  label,
  helperText,
  rows = 4,
  maxLength,
  resize = "vertical",
  variant = "default",
  className = "",
  id,
  showCharCount = true,
  fullWidth = true,
  ...props
}) => {
  const [focused, setFocused] = useState<boolean>(false);
  const [charCount, setCharCount] = useState<number>(value.length);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCharCount(newValue.length);
    onChange(e, newValue);
  };

  const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
    setFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    setFocused(false);
    props.onBlur?.(e);
  };

  const resizeClasses: Record<TextareaResize, string> = {
    none: "resize-none",
    both: "resize",
    horizontal: "resize-x",
    vertical: "resize-y",
  };

  const variantClasses: Record<TextareaVariant, string> = {
    default: "border shadow-sm",
    filled: "border-b-2 bg-gray-50 dark:bg-gray-700",
    outlined: "border-2"
  };

  const uniqueId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${fullWidth ? "w-full" : "w-fit"} ${className}`}>
      {label && (
        <Label
          htmlFor={uniqueId}
          required={required}
          disabled={disabled}
          className="mb-2"
        >
          {label}
        </Label>
      )}

      <div className="relative">
        <textarea
          id={uniqueId}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={`
            ${fullWidth ? "w-full" : "w-fit"} 
            px-3 py-2 rounded-lg transition-all duration-200
            ${resizeClasses[resize]}
            ${variantClasses[variant]}
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-600"
                : focused
                ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-20 dark:border-blue-400 dark:ring-blue-400"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
            }
            ${
              disabled
                ? "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                : "bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
            }
            focus:outline-none placeholder-gray-400 dark:placeholder-gray-500
          `}
          {...props}
        />

        {maxLength && showCharCount && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-400 bg-white dark:bg-gray-700 px-1 rounded">
            {charCount}/{maxLength}
          </div>
        )}
      </div>

      {(errorMessage || helperText) && (
        <div className="mt-1">
          {error && errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errorMessage}
            </p>
          )}
          {!error && helperText && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};

// // Basic usage
// <Textarea value={content} onChange={(e, val) => setContent(val)} />

// // With label and helper text
// <Textarea
//   label="Description"
//   helperText="Enter a detailed description"
//   value={description}
//   onChange={(e, val) => setDescription(val)}
// />

// // Error state
// <Textarea
//   error
//   errorMessage="This field is required"
//   value={comment}
//   onChange={(e, val) => setComment(val)}
// />

// // Dark mode ready
// <Textarea
//   label="Bio"
//   variant="filled"
//   value={bio}
//   onChange={(e, val) => setBio(val)}
//   className="dark:bg-gray-800"
// />

// // With character count
// <Textarea
//   maxLength={500}
//   showCharCount
//   value={essay}
//   onChange={(e, val) => setEssay(val)}
// />

//   // Demo Component
//   const ComponentDemo: React.FC = () => {
//     const [switchState, setSwitchState] = useState<boolean>(false);
//     const [switchState2, setSwitchState2] = useState<boolean>(true);
//     const [textValue, setTextValue] = useState<string>("");
//     const [textValue2, setTextValue2] = useState<string>("This textarea has an error");

//     return (
//       <div className="max-w-4xl mx-auto p-8 bg-gray-50 min-h-screen">
//         <div className="bg-white rounded-xl shadow-lg p-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
//             Reusable Components Demo
//           </h1>

//           {/* Switch Examples */}
//           <section className="mb-12">
//             <h2 className="text-2xl font-semibold text-gray-800 mb-6">Switch Component</h2>
//             <div className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-700 mb-4">Basic Switches</h3>
//                   <div className="space-y-4">
//                     <Switch
//                       checked={switchState}
//                       onChange={setSwitchState}
//                       label="Enable notifications"
//                       id="notifications"
//                     />
//                     <Switch
//                       checked={switchState2}
//                       onChange={setSwitchState2}
//                       label="Dark mode"
//                       id="darkmode"
//                     />
//                     <Switch
//                       checked={false}
//                       disabled={true}
//                       label="Disabled switch"
//                       id="disabled"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <h3 className="text-lg font-medium text-gray-700 mb-4">Different Sizes</h3>
//                   <div className="space-y-4">
//                     <Switch
//                       checked={true}
//                       size="sm"
//                       label="Small switch"
//                       id="small"
//                     />
//                     <Switch
//                       checked={true}
//                       size="md"
//                       label="Medium switch"
//                       id="medium"
//                     />
//                     <Switch
//                       checked={true}
//                       size="lg"
//                       label="Large switch"
//                       id="large"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* Label Examples */}
//           <section className="mb-12">
//             <h2 className="text-2xl font-semibold text-gray-800 mb-6">Label Component</h2>
//             <div className="space-y-4">
//               <Label>Standard label</Label>
//               <Label required>Required field label</Label>
//               <Label disabled>Disabled label</Label>
//               <div className="grid grid-cols-3 gap-4">
//                 <Label size="sm">Small label</Label>
//                 <Label size="md">Medium label</Label>
//                 <Label size="lg">Large label</Label>
//               </div>
//             </div>
//           </section>

//           {/* Textarea Examples */}
//           <section>
//             <h2 className="text-2xl font-semibold text-gray-800 mb-6">Textarea Component</h2>
//             <div className="space-y-6">
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <Textarea
//                   label="Basic Textarea"
//                   placeholder="Enter your message here..."
//                   value={textValue}
//                   onChange={setTextValue}
//                   helperText="This is a helper text"
//                   rows={4}
//                 />

//                 <Textarea
//                   label="Textarea with Character Limit"
//                   placeholder="Limited to 100 characters..."
//                   maxLength={100}
//                   helperText="Character count shown in bottom right"
//                   rows={4}
//                 />
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <Textarea
//                   label="Required Field"
//                   placeholder="This field is required..."
//                   required
//                   helperText="Please fill in this field"
//                   rows={3}
//                 />

//                 <Textarea
//                   label="Error State"
//                   placeholder="This has an error..."
//                   value={textValue2}
//                   onChange={setTextValue2}
//                   error={true}
//                   errorMessage="This field contains invalid content"
//                   rows={3}
//                 />
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <Textarea
//                   label="Disabled Textarea"
//                   value="This textarea is disabled"
//                   disabled={true}
//                   helperText="This field cannot be edited"
//                   rows={3}
//                 />

//                 <Textarea
//                   label="No Resize"
//                   placeholder="This textarea cannot be resized..."
//                   resize="none"
//                   helperText="Resize is disabled"
//                   rows={3}
//                 />
//               </div>
//             </div>
//           </section>

//           {/* Usage Tips */}
//           <section className="mt-12 p-6 bg-blue-50 rounded-lg">
//             <h3 className="text-lg font-semibold text-blue-900 mb-3">Component Features</h3>
//             <ul className="text-blue-800 space-y-1">
//               <li>• <strong>Switch:</strong> Accessible, multiple sizes, disabled states, with/without labels</li>
//               <li>• <strong>Label:</strong> Required indicators, size variants, disabled states</li>
//               <li>• <strong>Textarea:</strong> Error states, character counting, resize control, helper text</li>
//               <li>• All components support custom className and standard HTML props</li>
//               <li>• Built with accessibility in mind (ARIA labels, focus management)</li>
//               <li>• Full TypeScript support with proper type definitions</li>
//             </ul>
//           </section>
//         </div>
//       </div>
//     );
//   };

//   export default ComponentDemo;
