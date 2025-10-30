const SVGComponent = (props) => (
  <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z"
      fill="#F44336"
      stroke="#D32F2F"
      strokeWidth={2}
    />
    <path
      d="M60 35 L50 70 L55 70 L60 85 L65 70 L70 70 Z"
      fill="white"
      stroke="white"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <circle cx={60} cy={32} r={4} fill="white" />
    <path
      d="M45 40 Q40 45 40 52"
      fill="none"
      stroke="white"
      strokeWidth={3}
      strokeLinecap="round"
    />
    <path
      d="M48 35 Q44 40 44 47"
      fill="none"
      stroke="white"
      strokeWidth={3}
      strokeLinecap="round"
    />
    <path
      d="M75 40 Q80 45 80 52"
      fill="none"
      stroke="white"
      strokeWidth={3}
      strokeLinecap="round"
    />
    <path
      d="M72 35 Q76 40 76 47"
      fill="none"
      stroke="white"
      strokeWidth={3}
      strokeLinecap="round"
    />
  </svg>
);
export default SVGComponent;
