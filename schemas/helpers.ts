import z from "zod";

export const ipv4Regex =
  /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/;
export const ipValidation = z
  .string()
  .regex(ipv4Regex, { message: "Invalid IPv4 address format." });

// 2. Create a preprocessor for OPTIONAL numbers.
export const emptyStringToNumber = z.preprocess(
  (val) => (val === "" || val === null ? null : Number(val)),
  z.number().optional().nullable()
);

// 3. Create a preprocessor for REQUIRED numbers.
export const requiredStringToNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  return Number(val); // ensure cast
}, z.number({ error: (issue) => (issue.input === undefined ? "This field is required" : "Not a number") }));

// A reusable schema for optional IP addresses that can be an empty string
export const optionalIpValidation = z.union([
  z.string().regex(ipv4Regex, { message: "Invalid IPv4 address format." }),
  z.string().length(0), // Allows empty string
])
.optional()
.nullable()
.transform(val => val === "" ? null : val); // Transform empty string to null for the database