type Props = {
  size?: number;
  flip?: boolean;
  style?: React.CSSProperties;
};

export default function FlourishScroll({ size = 240, flip = false, style = {} }: Props) {
  const WD = 'var(--warm-deep)';
  const side = 'M-9 2 C -34 2 -52 -11 -76 -8 C -96 -5.5 -102 7 -90 11.5 C -81 15 -73 8 -78 2.5';
  return (
    <svg
      className="flourish"
      width={size}
      height={size * 48 / 300}
      viewBox="-150 -24 300 48"
      fill="none"
      stroke={WD}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: flip ? 'scaleY(-1)' : 'none', ...style }}
      aria-hidden="true"
    >
      <path d="M0 -11 C5.5 -5 5.5 -1 0 4 C-5.5 -1 -5.5 -5 0 -11 Z" fill={WD} stroke="none" />
      <path d={side} />
      <g transform="scale(-1,1)"><path d={side} /></g>
    </svg>
  );
}
