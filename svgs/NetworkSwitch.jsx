import * as React from "react";
const SVGComponent = (props) => (
  <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z"
      fill="#424242"
      stroke="#212121"
      strokeWidth={2}
    />
    <rect x={32} y={48} width={56} height={20} rx={2} fill="white" />
    <rect x={35} y={52} width={6} height={12} rx={1} fill="#424242" />
    <rect x={43} y={52} width={6} height={12} rx={1} fill="#424242" />
    <rect x={51} y={52} width={6} height={12} rx={1} fill="#424242" />
    <rect x={59} y={52} width={6} height={12} rx={1} fill="#424242" />
    <rect x={67} y={52} width={6} height={12} rx={1} fill="#424242" />
    <rect x={75} y={52} width={6} height={12} rx={1} fill="#424242" />
    <circle cx={84} cy={58} r={2} fill="#4CAF50" />
  </svg>
);
export default SVGComponent;
