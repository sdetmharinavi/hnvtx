import * as React from "react";
const SVGComponent = (props) => (
  <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z"
      fill="#9C27B0"
      stroke="#7B1FA2"
      strokeWidth={2}
    />
    <circle
      cx={60}
      cy={60}
      r={24}
      fill="white"
      stroke="#9C27B0"
      strokeWidth={3}
    />
    <line x1={30} y1={60} x2={90} y2={60} stroke="#9C27B0" strokeWidth={3} />
    <line x1={42} y1={42} x2={78} y2={78} stroke="#9C27B0" strokeWidth={3} />
    <polygon points="78,42 88,52 68,52" fill="#9C27B0" />
  </svg>
);
export default SVGComponent;
