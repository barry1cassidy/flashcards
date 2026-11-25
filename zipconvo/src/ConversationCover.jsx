import { COVER_PALETTES } from './covers'

export default function ConversationCover({ motif, palette }) {
  const tone = COVER_PALETTES[palette] || COVER_PALETTES.periwinkle
  const Scene = SCENES[motif] || SCENES.table
  return (
    <svg className="conversation-cover" viewBox="0 0 640 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Scene tone={tone} />
    </svg>
  )
}

function Room({ tone, sunX, sunY = 20 }) {
  return (
    <>
      <rect width="640" height="180" fill={tone.bg} />
      <circle cx={sunX} cy={sunY} r="86" fill={tone.wash} />
      <rect x="0" y="136" width="640" height="44" fill={tone.wash} />
    </>
  )
}

function Bust({ x, y, fill, ink, flip = false, headphones = false, scale = 1.65 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g transform={flip ? 'translate(66 0) scale(-1 1)' : undefined}>
        <path
          fill={fill}
          d="M21 40C12 46 3 55 2 64c-1 7 6 11 14 11h34c8 0 15-4 14-11-1-9-9-18-18-24-4-4-8-6-12-6s-8 2-12 6z"
        />
        <circle cx="33" cy="22" r="20" fill={fill} />
        {headphones ? (
          <>
            <path d="M14 26c0-16 8-24 19-24s19 8 19 24" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="14" cy="27" r="6.5" fill={ink} />
            <circle cx="52" cy="27" r="6.5" fill={ink} />
          </>
        ) : null}
        <circle cx="42" cy="20" r="2.4" fill={ink} />
        <path d="M40.2 28.2Q46.5 33.2 52 27.2" fill="none" stroke={ink} strokeWidth="2.3" strokeLinecap="round" />
      </g>
    </g>
  )
}

function Wave({ x, y, color }) {
  const heights = [16, 30, 22, 40, 18, 32, 14]
  return heights.map((height, index) => (
    <rect
      key={index}
      x={x + index * 16}
      y={y + (44 - height)}
      width="8"
      height={height}
      rx="4"
      fill={color}
    />
  ))
}

const SCENES = {
  table({ tone }) {
    return (
      <>
        <Room tone={tone} sunX={540} />
        <Bust x={148} y={6} fill={tone.figure} ink={tone.ink} />
        <Bust x={392} y={6} fill={tone.accent} ink={tone.ink} flip />
        <rect x="286" y="108" width="68" height="12" rx="6" fill={tone.surface} />
      </>
    )
  },
  headset({ tone }) {
    return (
      <>
        <Room tone={tone} sunX={250} sunY={8} />
        <Bust x={168} y={2} fill={tone.figure} ink={tone.ink} headphones scale={1.8} />
        <Wave x={360} y={52} color={tone.accent} />
      </>
    )
  },
  pair({ tone }) {
    return (
      <>
        <Room tone={tone} sunX={320} sunY={-10} />
        <Bust x={176} y={4} fill={tone.figure} ink={tone.ink} scale={1.75} />
        <Bust x={352} y={4} fill={tone.accent} ink={tone.ink} flip scale={1.75} />
      </>
    )
  },
  bench({ tone }) {
    return (
      <>
        <Room tone={tone} sunX={86} />
        <Bust x={156} y={2} fill={tone.figure} ink={tone.ink} />
        <Bust x={360} y={2} fill={tone.accent} ink={tone.ink} flip />
        <rect x="148" y="112" width="344" height="16" rx="8" fill={tone.surface} />
      </>
    )
  },
  stroll({ tone }) {
    return (
      <>
        <Room tone={tone} sunX={78} sunY={36} />
        <Bust x={150} y={16} fill={tone.accent} ink={tone.ink} scale={1.5} />
        <Bust x={330} y={4} fill={tone.figure} ink={tone.ink} flip scale={1.7} />
      </>
    )
  },
  listen({ tone }) {
    return (
      <>
        <Room tone={tone} sunX={500} sunY={30} />
        <Bust x={128} y={6} fill={tone.accent} ink={tone.ink} />
        <circle cx="292" cy="70" r="5" fill={tone.figure} />
        <circle cx="312" cy="70" r="5" fill={tone.figure} />
        <circle cx="332" cy="70" r="5" fill={tone.figure} />
        <Bust x={368} y={6} fill={tone.figure} ink={tone.ink} flip headphones />
      </>
    )
  },
}
