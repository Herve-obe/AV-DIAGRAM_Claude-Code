// Adresses de relais de secours annoncées par les participants : seules des adresses IPv4 privées du
// réseau local (avec port) sont retenues, au plus quatre. Une annonce invalide ou extérieure est ignorée.

const MAX_ADDRESSES = 4

/** IPv4 privée (RFC 1918) suivie d'un port, ex. « 192.168.1.20:4455 ». */
export function isPrivateRelayAddress(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 21) return false
  const m = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3}):(\d{1,5})$/)
  if (!m) return false
  const [a, b, c, d, port] = m.slice(1).map(Number)
  if ([a, b, c, d].some(n => n > 255) || port < 1 || port > 65535) return false
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
}

/** Adresses de secours valides d'une annonce, ou liste vide. */
export function relayAddresses(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(isPrivateRelayAddress))].slice(0, MAX_ADDRESSES) : []
}
