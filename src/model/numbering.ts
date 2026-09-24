// Numérotation automatique des câbles. Format configurable, ex. "{ZONE}-{TYPE}-{NUM:000}" -> "FOH-AUD-012".
import type { SignalFamily } from './signals'

export const SIGNAL_CODE: Record<SignalFamily, string> = {
  audioAnalog: 'AUD',
  audioDigital: 'AES',
  audioIp: 'AIP',
  video: 'VID',
  videoIp: 'VIP',
  sync: 'SYN',
  intercom: 'COM',
  control: 'CTL',
  network: 'NET',
  power: 'PWR',
}

export function formatCableLabel(format: string, values: { zone: string; signal: SignalFamily; num: number }): string {
  return format
    .replace(/\{ZONE\}/g, values.zone)
    .replace(/\{TYPE\}/g, SIGNAL_CODE[values.signal])
    .replace(/\{NUM(?::(0+))?\}/g, (_m, pad: string | undefined) => String(values.num).padStart(pad?.length ?? 1, '0'))
}
