import * as React from "react";
const SVGComponent = (props) => (
  <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z"
      fill="#4CAF50"
      stroke="#388E3C"
      strokeWidth={2}
    />
    <circle
      cx={60}
      cy={60}
      r={12}
      fill="white"
      stroke="#4CAF50"
      strokeWidth={4}
    />
    <circle
      cx={60}
      cy={35}
      r={6}
      fill="white"
      stroke="#4CAF50"
      strokeWidth={4}
    />
    <circle
      cx={40}
      cy={75}
      r={6}
      fill="white"
      stroke="#4CAF50"
      strokeWidth={4}
    />
    <circle
      cx={80}
      cy={75}
      r={6}
      fill="white"
      stroke="#4CAF50"
      strokeWidth={4}
    />
    <line x1={60} y1={48} x2={60} y2={41} stroke="#4CAF50" strokeWidth={4} />
    <line x1={53} y1={68} x2={46} y2={75} stroke="#4CAF50" strokeWidth={4} />
    <line x1={67} y1={68} x2={74} y2={75} stroke="#4CAF50" strokeWidth={4} />
  </svg>
);
export default SVGComponent;
