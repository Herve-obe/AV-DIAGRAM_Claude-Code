// Icônes d'interface (style trait, grille 24 x 24).
const ICONS = {
  select: 'M5 3l14 8-6 2-2 6z',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  folder: 'M3 6h6l2 2h10v11H3z',
  save: 'M5 3h11l3 3v15H5zM8 3v6h8M8 21v-7h8v7',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  monitor: 'M3 5h18v11H3zM9 20h6M12 16v4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M6 15l6-6 6 6',
  synoptic: 'M3 5h6v5H3zM15 14h6v5h-6zM9 7.5h3v9h3',
  rack: 'M5 3h14v18H5zM5 8h14M5 13h14M5 18h14',
  plan: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  network: 'M12 3v6M5 21v-4h14v4M12 13v4M9 9h6v4H9zM3 21h4M17 21h4',
  lists: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  deliver: 'M4 4h16v16H4zM4 9h16M9 14h6',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  check: 'M4 12l5 5L20 6',
  plus: 'M12 5v14M5 12h14',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  close: 'M6 6l12 12M18 6L6 18',
  pdf: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4',
  lang: 'M3 5h10M8 3v2M5 9c1.5 3 4 5 7 6M11 5c-1 4-3.5 7.5-7 10M13 21l4-10 4 10M14.5 17h5',
} as const

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  )
}
