import * as React from "react";
const SVGComponent = (props) => (
  <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z"
      fill="#20B2AA"
      stroke="#178F88"
      strokeWidth={2}
    />
    <rect x={30} y={30} width={60} height={60} rx={8} fill="white" />
    <rect x={38} y={38} width={44} height={16} rx={3} fill="#20B2AA" />
    <rect x={38} y={60} width={10} height={12} rx={2} fill="#20B2AA" />
    <rect x={55} y={60} width={10} height={12} rx={2} fill="#20B2AA" />
    <rect x={72} y={60} width={10} height={12} rx={2} fill="#20B2AA" />
    <rect x={38} y={76} width={10} height={12} rx={2} fill="#20B2AA" />
    <rect x={55} y={76} width={10} height={12} rx={2} fill="#20B2AA" />
    <rect x={72} y={76} width={10} height={12} rx={2} fill="#20B2AA" />
  </svg>
);
export default SVGComponent;
