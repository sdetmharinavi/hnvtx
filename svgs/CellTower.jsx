const SVGComponent = (props) => (
  <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M60 0 C27 0 0 27 0 60 C0 75 5 88 13 99 L60 160 L107 99 C115 88 120 75 120 60 C120 27 93 0 60 0 Z"
      fill="#3F51B5"
      stroke="#303F9F"
      strokeWidth={2}
    />
    <path
      d="M60 30 L48 80 L52 80 L52 85 L68 85 L68 80 L72 80 Z"
      fill="white"
      stroke="white"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <line x1={54} y1={50} x2={66} y2={50} stroke="white" strokeWidth={2} />
    <line x1={52} y1={60} x2={68} y2={60} stroke="white" strokeWidth={2} />
    <line x1={51} y1={70} x2={69} y2={70} stroke="white" strokeWidth={2} />
    <circle cx={60} cy={27} r={3} fill="white" />
  </svg>
);
export default SVGComponent;
