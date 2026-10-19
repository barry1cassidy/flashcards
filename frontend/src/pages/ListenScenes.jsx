export function UseScene({ scene }) {
  return (
    <svg viewBox="0 0 240 150" aria-hidden="true">
      <path className="listen-ground" d="M20 128h200" />
      {scene === 'walk' ? <WalkFigure /> : null}
      {scene === 'run' ? <RunFigure /> : null}
      {scene === 'workout' ? <WorkoutFigure /> : null}
      {scene === 'chores' ? <ChoresFigure /> : null}
    </svg>
  )
}

function Headphones({ x, y }) {
  return (
    <g className="listen-phones" transform={`translate(${x} ${y})`}>
      <path d="M-14 4a14 14 0 0 1 28 0" />
      <rect x="-16" y="2" width="6" height="12" rx="2" />
      <rect x="10" y="2" width="6" height="12" rx="2" />
    </g>
  )
}

function WalkFigure() {
  return (
    <g className="listen-figure">
      <circle cx="108" cy="46" r="14" />
      <Headphones x={108} y={40} />
      <path d="M108 62v28M108 74l-18 12M108 74l16 8M108 90l-16 30M108 90l18 24" />
      <g className="listen-bars" transform="translate(150 78)">
        <rect x="0" y="10" width="4" height="14" rx="2" />
        <rect x="8" y="4" width="4" height="20" rx="2" />
        <rect x="16" y="8" width="4" height="16" rx="2" />
        <rect x="24" y="2" width="4" height="22" rx="2" />
        <rect x="32" y="12" width="4" height="12" rx="2" />
      </g>
    </g>
  )
}

function RunFigure() {
  return (
    <g className="listen-figure">
      <path className="listen-motion" d="M36 70h28M28 86h24M40 102h20" />
      <circle cx="118" cy="42" r="14" />
      <Headphones x={118} y={36} />
      <path d="M118 58l16 26M134 84l-22 10M134 84l20 6M134 84l-8 34M134 84l18 28" />
    </g>
  )
}

function WorkoutFigure() {
  return (
    <g className="listen-figure">
      <circle cx="120" cy="40" r="14" />
      <Headphones x={120} y={34} />
      <path d="M120 56v30M120 86l-16 32M120 86l16 32M120 70l-28-8M120 70l28-8" />
      <g className="listen-phones">
        <rect x="78" y="56" width="16" height="6" rx="2" />
        <rect x="146" y="56" width="16" height="6" rx="2" />
      </g>
    </g>
  )
}

function ChoresFigure() {
  return (
    <g className="listen-figure">
      <path d="M48 96h70v32H48z" />
      <circle cx="150" cy="44" r="14" />
      <Headphones x={150} y={38} />
      <path d="M150 60v28M150 72l-22 16M150 88l-12 30M150 88l14 28" />
      <g className="listen-phones">
        <circle cx="68" cy="86" r="8" />
        <circle cx="90" cy="84" r="7" />
      </g>
    </g>
  )
}
