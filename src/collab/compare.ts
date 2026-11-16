// Le réseau peut changer l'ordre des clés ou omettre un champ undefined sans changer les données.
export const stableJson = (value: unknown): string | undefined => JSON.stringify(value, (_key, v) =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : v)

export const sameData = (a: unknown, b: unknown): boolean => a === b || stableJson(a) === stableJson(b)
