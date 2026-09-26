// Pictogrammes d'équipements dessinés pour le projet (trait 1,6 px, grille 24 x 24).
import type { PictogramId } from '../model/types'

const PATHS: Record<PictogramId, string> = {
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6',
  di: 'M4 7h16v10H4zM8 12h3M13 12h3M7 7V5M17 7V5',
  console: 'M3 18l2.5-11h13L21 18zM8 10v5M11 9v6M14 11v4M17 10v5',
  stagebox: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h.01M11 14h.01M15 14h.01M19 10v4',
  processor: 'M3 8h18v8H3zM6 12h2l1.5-2.5 2 5 1.5-2.5h5',
  amp: 'M3 7h18v10H3zM7 12h3l2-3v6l2-3h3M7 17v2M17 17v2',
  speaker: 'M6 3h12v18H6zM12 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  wireless: 'M5 10h14v9H5zM9 10V5M8.5 14.5h7M5.5 5.5a4 4 0 0 1 7 0',
  recorder: 'M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9h.01',
  camera: 'M3 7h12v10H3zM15 11l6-3v8l-6-3M6 10h3',
  switcher: 'M3 14h18v5H3zM6 14V9M10 14V7M14 14V9M18 14V6M5 17h2M9 17h2',
  router: 'M4 4h16v16H4zM4 9h16M4 14h16M9 4v16M14 4v16',
  display: 'M3 5h18v11H3zM9 20h6M12 16v4',
  projector: 'M3 9h18v8H3zM16 13a2 2 0 1 0 0-.01M6 13h5M7 17v2M17 17v2',
  intercom: 'M4 13a8 8 0 0 1 16 0M4 13v3a2 2 0 0 0 2 2h1v-6H6M20 13v3a2 2 0 0 1-2 2h-1M17 18v1a2 2 0 0 1-2 2h-2',
  switch: 'M3 8h18v8H3zM6 12h1M9 12h1M12 12h1M15 12h1M18 12h.01',
  clock: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 8v4l3 2',
  control: 'M4 6h16v12H4zM8 10h.01M12 10h.01M16 10h.01M8 14h8',
  power: 'M13 3L6 13h5l-1 8 7-10h-5z',
  patch: 'M3 8h18v8H3zM7 12h.01M10 12h.01M13 12h.01M16 12h.01',
  // Projecteur sur lyre : corps, lentille et étrier
  light: 'M8 5h8l2 9H6zM9 14a3 3 0 0 0 6 0M4 9v8h16V9M12 17v3M9 20h6',
}

export function Pictogram({ id, size = 18 }: { id: PictogramId; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[id]} />
    </svg>
  )
}
