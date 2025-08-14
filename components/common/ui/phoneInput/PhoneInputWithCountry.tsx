"use client";

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

// Full country list: name, code, dialCode, flag
const countries: Country[] = [
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "Afghanistan", code: "AF", dialCode: "+93", flag: "🇦🇫" },
  { name: "Åland Islands", code: "AX", dialCode: "+358", flag: "🇦🇽" },
  { name: "Albania", code: "AL", dialCode: "+355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dialCode: "+213", flag: "🇩🇿" },
  { name: "American Samoa", code: "AS", dialCode: "+1684", flag: "🇦🇸" },
  { name: "Andorra", code: "AD", dialCode: "+376", flag: "🇦🇩" },
  { name: "Angola", code: "AO", dialCode: "+244", flag: "🇦🇴" },
  { name: "Anguilla", code: "AI", dialCode: "+1264", flag: "🇦🇮" },
  { name: "Antarctica", code: "AQ", dialCode: "+672", flag: "🇦🇶" },
  { name: "Antigua and Barbuda", code: "AG", dialCode: "+1268", flag: "🇦🇬" },
  { name: "Argentina", code: "AR", dialCode: "+54", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", dialCode: "+374", flag: "🇦🇲" },
  { name: "Aruba", code: "AW", dialCode: "+297", flag: "🇦🇼" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dialCode: "+43", flag: "🇦🇹" },
  { name: "Azerbaijan", code: "AZ", dialCode: "+994", flag: "🇦🇿" },
  { name: "Bahamas", code: "BS", dialCode: "+1242", flag: "🇧🇸" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩" },
  { name: "Barbados", code: "BB", dialCode: "+1246", flag: "🇧🇧" },
  { name: "Belarus", code: "BY", dialCode: "+375", flag: "🇧🇾" },
  { name: "Belgium", code: "BE", dialCode: "+32", flag: "🇧🇪" },
  { name: "Belize", code: "BZ", dialCode: "+501", flag: "🇧🇿" },
  { name: "Benin", code: "BJ", dialCode: "+229", flag: "🇧🇯" },
  { name: "Bermuda", code: "BM", dialCode: "+1441", flag: "🇧🇲" },
  { name: "Bhutan", code: "BT", dialCode: "+975", flag: "🇧🇹" },
  { name: "Bolivia", code: "BO", dialCode: "+591", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", code: "BA", dialCode: "+387", flag: "🇧🇦" },
  { name: "Botswana", code: "BW", dialCode: "+267", flag: "🇧🇼" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  {
    name: "British Indian Ocean Territory",
    code: "IO",
    dialCode: "+246",
    flag: "🇮🇴",
  },
  { name: "Brunei Darussalam", code: "BN", dialCode: "+673", flag: "🇧🇳" },
  { name: "Bulgaria", code: "BG", dialCode: "+359", flag: "🇧🇬" },
  { name: "Burkina Faso", code: "BF", dialCode: "+226", flag: "🇧🇫" },
  { name: "Burundi", code: "BI", dialCode: "+257", flag: "🇧🇮" },
  { name: "Cambodia", code: "KH", dialCode: "+855", flag: "🇰🇭" },
  { name: "Cameroon", code: "CM", dialCode: "+237", flag: "🇨🇲" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Cape Verde", code: "CV", dialCode: "+238", flag: "🇨🇻" },
  { name: "Cayman Islands", code: "KY", dialCode: "+1345", flag: "🇰🇾" },
  {
    name: "Central African Republic",
    code: "CF",
    dialCode: "+236",
    flag: "🇨🇫",
  },
  { name: "Chad", code: "TD", dialCode: "+235", flag: "🇹🇩" },
  { name: "Chile", code: "CL", dialCode: "+56", flag: "🇨🇱" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Christmas Island", code: "CX", dialCode: "+61", flag: "🇨🇽" },
  { name: "Cocos (Keeling) Islands", code: "CC", dialCode: "+61", flag: "🇨🇨" },
  { name: "Colombia", code: "CO", dialCode: "+57", flag: "🇨🇴" },
  { name: "Comoros", code: "KM", dialCode: "+269", flag: "🇰🇲" },
  { name: "Congo", code: "CG", dialCode: "+242", flag: "🇨🇬" },
  {
    name: "Congo, The Democratic Republic of the",
    code: "CD",
    dialCode: "+243",
    flag: "🇨🇩",
  },
  { name: "Cook Islands", code: "CK", dialCode: "+682", flag: "🇨🇰" },
  { name: "Costa Rica", code: "CR", dialCode: "+506", flag: "🇨🇷" },
  { name: "Côte d'Ivoire", code: "CI", dialCode: "+225", flag: "🇨🇮" },
  { name: "Croatia", code: "HR", dialCode: "+385", flag: "🇭🇷" },
  { name: "Cuba", code: "CU", dialCode: "+53", flag: "🇨🇺" },
  { name: "Curaçao", code: "CW", dialCode: "+599", flag: "🇨🇼" },
  { name: "Cyprus", code: "CY", dialCode: "+357", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", dialCode: "+420", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", dialCode: "+45", flag: "🇩🇰" },
  { name: "Djibouti", code: "DJ", dialCode: "+253", flag: "🇩🇯" },
  { name: "Dominica", code: "DM", dialCode: "+1767", flag: "🇩🇲" },
  { name: "Dominican Republic", code: "DO", dialCode: "+1809", flag: "🇩🇴" },
  { name: "Ecuador", code: "EC", dialCode: "+593", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "El Salvador", code: "SV", dialCode: "+503", flag: "🇸🇻" },
  { name: "Equatorial Guinea", code: "GQ", dialCode: "+240", flag: "🇬🇶" },
  { name: "Eritrea", code: "ER", dialCode: "+291", flag: "🇪🇷" },
  { name: "Estonia", code: "EE", dialCode: "+372", flag: "🇪🇪" },
  { name: "Ethiopia", code: "ET", dialCode: "+251", flag: "🇪🇹" },
  {
    name: "Falkland Islands (Malvinas)",
    code: "FK",
    dialCode: "+500",
    flag: "🇫🇰",
  },
  { name: "Faroe Islands", code: "FO", dialCode: "+298", flag: "🇫🇴" },
  { name: "Fiji", code: "FJ", dialCode: "+679", flag: "🇫🇯" },
  { name: "Finland", code: "FI", dialCode: "+358", flag: "🇫🇮" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "French Guiana", code: "GF", dialCode: "+594", flag: "🇬🇫" },
  { name: "French Polynesia", code: "PF", dialCode: "+689", flag: "🇵🇫" },
  { name: "Gabon", code: "GA", dialCode: "+241", flag: "🇬🇦" },
  { name: "Gambia", code: "GM", dialCode: "+220", flag: "🇬🇲" },
  { name: "Georgia", code: "GE", dialCode: "+995", flag: "🇬🇪" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { name: "Gibraltar", code: "GI", dialCode: "+350", flag: "🇬🇮" },
  { name: "Greece", code: "GR", dialCode: "+30", flag: "🇬🇷" },
  { name: "Greenland", code: "GL", dialCode: "+299", flag: "🇬🇱" },
  { name: "Grenada", code: "GD", dialCode: "+1473", flag: "🇬🇩" },
  { name: "Guadeloupe", code: "GP", dialCode: "+590", flag: "🇬🇵" },
  { name: "Guam", code: "GU", dialCode: "+1671", flag: "🇬🇺" },
  { name: "Guatemala", code: "GT", dialCode: "+502", flag: "🇬🇹" },
  { name: "Guernsey", code: "GG", dialCode: "+44", flag: "🇬🇬" },
  { name: "Guinea", code: "GN", dialCode: "+224", flag: "🇬🇳" },
  { name: "Guinea-Bissau", code: "GW", dialCode: "+245", flag: "🇬🇼" },
  { name: "Guyana", code: "GY", dialCode: "+592", flag: "🇬🇾" },
  { name: "Haiti", code: "HT", dialCode: "+509", flag: "🇭🇹" },
  { name: "Honduras", code: "HN", dialCode: "+504", flag: "🇭🇳" },
  { name: "Hong Kong", code: "HK", dialCode: "+852", flag: "🇭🇰" },
  { name: "Hungary", code: "HU", dialCode: "+36", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", dialCode: "+354", flag: "🇮🇸" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  {
    name: "Iran, Islamic Republic of",
    code: "IR",
    dialCode: "+98",
    flag: "🇮🇷",
  },
  { name: "Iraq", code: "IQ", dialCode: "+964", flag: "🇮🇶" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { name: "Isle of Man", code: "IM", dialCode: "+44", flag: "🇮🇲" },
  { name: "Israel", code: "IL", dialCode: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Jamaica", code: "JM", dialCode: "+1876", flag: "🇯🇲" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "Jersey", code: "JE", dialCode: "+44", flag: "🇯🇪" },
  { name: "Jordan", code: "JO", dialCode: "+962", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", dialCode: "+7", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { name: "Kiribati", code: "KI", dialCode: "+686", flag: "🇰🇮" },
  {
    name: "Korea, Democratic People's Republic of",
    code: "KP",
    dialCode: "+850",
    flag: "🇰🇵",
  },
  { name: "Korea, Republic of", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", dialCode: "+996", flag: "🇰🇬" },
  {
    name: "Lao People's Democratic Republic",
    code: "LA",
    dialCode: "+856",
    flag: "🇱🇦",
  },
  { name: "Latvia", code: "LV", dialCode: "+371", flag: "🇱🇻" },
  { name: "Lebanon", code: "LB", dialCode: "+961", flag: "🇱🇧" },
  { name: "Lesotho", code: "LS", dialCode: "+266", flag: "🇱🇸" },
  { name: "Liberia", code: "LR", dialCode: "+231", flag: "🇱🇷" },
  { name: "Libya", code: "LY", dialCode: "+218", flag: "🇱🇾" },
  { name: "Liechtenstein", code: "LI", dialCode: "+423", flag: "🇱🇮" },
  { name: "Lithuania", code: "LT", dialCode: "+370", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", dialCode: "+352", flag: "🇱🇺" },
  { name: "Macao", code: "MO", dialCode: "+853", flag: "🇲🇴" },
  {
    name: "Macedonia, The Former Yugoslav Republic of",
    code: "MK",
    dialCode: "+389",
    flag: "🇲🇰",
  },
  { name: "Madagascar", code: "MG", dialCode: "+261", flag: "🇲🇬" },
  { name: "Malawi", code: "MW", dialCode: "+265", flag: "🇲🇼" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", dialCode: "+960", flag: "🇲🇻" },
  { name: "Mali", code: "ML", dialCode: "+223", flag: "🇲🇱" },
  { name: "Malta", code: "MT", dialCode: "+356", flag: "🇲🇹" },
  { name: "Marshall Islands", code: "MH", dialCode: "+692", flag: "🇲🇭" },
  { name: "Martinique", code: "MQ", dialCode: "+596", flag: "🇲🇶" },
  { name: "Mauritania", code: "MR", dialCode: "+222", flag: "🇲🇷" },
  { name: "Mauritius", code: "MU", dialCode: "+230", flag: "🇲🇺" },
  { name: "Mayotte", code: "YT", dialCode: "+262", flag: "🇾🇹" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  {
    name: "Micronesia, Federated States of",
    code: "FM",
    dialCode: "+691",
    flag: "🇫🇲",
  },
  { name: "Moldova, Republic of", code: "MD", dialCode: "+373", flag: "🇲🇩" },
  { name: "Monaco", code: "MC", dialCode: "+377", flag: "🇲🇨" },
  { name: "Mongolia", code: "MN", dialCode: "+976", flag: "🇲🇳" },
  { name: "Montenegro", code: "ME", dialCode: "+382", flag: "🇲🇪" },
  { name: "Montserrat", code: "MS", dialCode: "+1664", flag: "🇲🇸" },
  { name: "Morocco", code: "MA", dialCode: "+212", flag: "🇲🇦" },
  { name: "Mozambique", code: "MZ", dialCode: "+258", flag: "🇲🇿" },
  { name: "Myanmar", code: "MM", dialCode: "+95", flag: "🇲🇲" },
  { name: "Namibia", code: "NA", dialCode: "+264", flag: "🇳🇦" },
  { name: "Nauru", code: "NR", dialCode: "+674", flag: "🇳🇷" },
  { name: "Nepal", code: "NP", dialCode: "+977", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "New Caledonia", code: "NC", dialCode: "+687", flag: "🇳🇨" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "Nicaragua", code: "NI", dialCode: "+505", flag: "🇳🇮" },
  { name: "Niger", code: "NE", dialCode: "+227", flag: "🇳🇪" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { name: "Niue", code: "NU", dialCode: "+683", flag: "🇳🇺" },
  { name: "Norfolk Island", code: "NF", dialCode: "+672", flag: "🇳🇫" },
  {
    name: "Northern Mariana Islands",
    code: "MP",
    dialCode: "+1670",
    flag: "🇲🇵",
  },
  { name: "Norway", code: "NO", dialCode: "+47", flag: "🇳🇴" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰" },
  { name: "Palau", code: "PW", dialCode: "+680", flag: "🇵🇼" },
  { name: "Palestine, State of", code: "PS", dialCode: "+970", flag: "🇵🇸" },
  { name: "Panama", code: "PA", dialCode: "+507", flag: "🇵🇦" },
  { name: "Papua New Guinea", code: "PG", dialCode: "+675", flag: "🇵🇬" },
  { name: "Paraguay", code: "PY", dialCode: "+595", flag: "🇵🇾" },
  { name: "Peru", code: "PE", dialCode: "+51", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭" },
  { name: "Pitcairn", code: "PN", dialCode: "+870", flag: "🇵🇳" },
  { name: "Poland", code: "PL", dialCode: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dialCode: "+351", flag: "🇵🇹" },
  { name: "Puerto Rico", code: "PR", dialCode: "+1", flag: "🇵🇷" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦" },
  { name: "Réunion", code: "RE", dialCode: "+262", flag: "🇷🇪" },
  { name: "Romania", code: "RO", dialCode: "+40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dialCode: "+7", flag: "🇷🇺" },
  { name: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
  { name: "Saint Barthélemy", code: "BL", dialCode: "+590", flag: "🇧🇱" },
  { name: "Saint Helena", code: "SH", dialCode: "+290", flag: "🇸🇭" },
  { name: "Saint Kitts and Nevis", code: "KN", dialCode: "+1869", flag: "🇰🇳" },
  { name: "Saint Lucia", code: "LC", dialCode: "+1758", flag: "🇱🇨" },
  {
    name: "Saint Martin (French part)",
    code: "MF",
    dialCode: "+590",
    flag: "🇲🇫",
  },
  {
    name: "Saint Pierre and Miquelon",
    code: "PM",
    dialCode: "+508",
    flag: "🇵🇲",
  },
  {
    name: "Saint Vincent and the Grenadines",
    code: "VC",
    dialCode: "+1784",
    flag: "🇻🇨",
  },
  { name: "Samoa", code: "WS", dialCode: "+685", flag: "🇼🇸" },
  { name: "San Marino", code: "SM", dialCode: "+378", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", code: "ST", dialCode: "+239", flag: "🇸🇹" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Senegal", code: "SN", dialCode: "+221", flag: "🇸🇳" },
  { name: "Serbia", code: "RS", dialCode: "+381", flag: "🇷🇸" },
  { name: "Seychelles", code: "SC", dialCode: "+248", flag: "🇸🇨" },
  { name: "Sierra Leone", code: "SL", dialCode: "+232", flag: "🇸🇱" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  {
    name: "Sint Maarten (Dutch part)",
    code: "SX",
    dialCode: "+1721",
    flag: "🇸🇽",
  },
  { name: "Slovakia", code: "SK", dialCode: "+421", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", dialCode: "+386", flag: "🇸🇮" },
  { name: "Solomon Islands", code: "SB", dialCode: "+677", flag: "🇸🇧" },
  { name: "Somalia", code: "SO", dialCode: "+252", flag: "🇸🇴" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "South Sudan", code: "SS", dialCode: "+211", flag: "🇸🇸" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94", flag: "🇱🇰" },
  { name: "Sudan", code: "SD", dialCode: "+249", flag: "🇸🇩" },
  { name: "Suriname", code: "SR", dialCode: "+597", flag: "🇸🇷" },
  { name: "Svalbard and Jan Mayen", code: "SJ", dialCode: "+47", flag: "🇸🇯" },
  { name: "Swaziland", code: "SZ", dialCode: "+268", flag: "🇸🇿" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Syrian Arab Republic", code: "SY", dialCode: "+963", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", dialCode: "+886", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", dialCode: "+992", flag: "🇹🇯" },
  {
    name: "Tanzania, United Republic of",
    code: "TZ",
    dialCode: "+255",
    flag: "🇹🇿",
  },
  { name: "Thailand", code: "TH", dialCode: "+66", flag: "🇹🇭" },
  { name: "Timor-Leste", code: "TL", dialCode: "+670", flag: "🇹🇱" },
  { name: "Togo", code: "TG", dialCode: "+228", flag: "🇹🇬" },
  { name: "Tokelau", code: "TK", dialCode: "+690", flag: "🇹🇰" },
  { name: "Tonga", code: "TO", dialCode: "+676", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", code: "TT", dialCode: "+1868", flag: "🇹🇹" },
  { name: "Tunisia", code: "TN", dialCode: "+216", flag: "🇹🇳" },
  { name: "Turkey", code: "TR", dialCode: "+90", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", dialCode: "+993", flag: "🇹🇲" },
  {
    name: "Turks and Caicos Islands",
    code: "TC",
    dialCode: "+1649",
    flag: "🇹🇨",
  },
  { name: "Tuvalu", code: "TV", dialCode: "+688", flag: "🇹🇻" },
  { name: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dialCode: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", dialCode: "+598", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", dialCode: "+998", flag: "🇺🇿" },
  { name: "Vanuatu", code: "VU", dialCode: "+678", flag: "🇻🇺" },
  { name: "Venezuela", code: "VE", dialCode: "+58", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", dialCode: "+84", flag: "🇻🇳" },
  {
    name: "Virgin Islands, British",
    code: "VG",
    dialCode: "+1284",
    flag: "🇻🇬",
  },
  { name: "Virgin Islands, U.S.", code: "VI", dialCode: "+1340", flag: "🇻🇮" },
  { name: "Wallis and Futuna", code: "WF", dialCode: "+681", flag: "🇼🇫" },
  { name: "Western Sahara", code: "EH", dialCode: "+212", flag: "🇪🇭" },
  { name: "Yemen", code: "YE", dialCode: "+967", flag: "🇾🇪" },
  { name: "Zambia", code: "ZM", dialCode: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", dialCode: "+263", flag: "🇿🇼" },
];
interface PhoneInputWithCountryProps {
  value: string | null;
  onChange: (value: string) => void;
}

export default function PhoneInputWithCountry({
  value,
  onChange,
}: PhoneInputWithCountryProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/\D/g, "");
    onChange(`${selectedCountry.dialCode}${number}`);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find((c) => c.code === e.target.value);
    if (country) {
      setSelectedCountry(country);
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
            {countries.map((country) => (
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
          value={(value ?? "").replace(selectedCountry.dialCode, "")}
          onChange={handleNumberChange}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Full Contact Number: <span className="font-medium">{value}</span>
      </p>
    </div>
  );
}
