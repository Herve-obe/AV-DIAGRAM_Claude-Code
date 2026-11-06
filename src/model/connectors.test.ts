import { describe, expect, it } from 'vitest'
import { connectorLabel, connectorsMate } from './connectors'

describe('connecteurs documentés dans les notices constructeur', () => {
  it('distingue les connecteurs qui exigent un adaptateur', () => {
    for (const [a, b] of [['rp-tnc', 'tnc'], ['camlock', 'powerlock'], ['socapex19', 'multipin'], ['xlr7', 'xlr5'], ['minidin4', 'minidin8'], ['mini-displayport', 'displayport'], ['hdmi-mini', 'hdmi-micro'], ['martin-bbd6', 'multipin']]) {
      expect(connectorsMate(a, b), a + ' / ' + b).toBe(false)
      expect(connectorsMate(b, a), b + ' / ' + a).toBe(false)
      expect(connectorsMate(a, a)).toBe(true)
      expect(connectorLabel(a)).not.toBe(a)
    }
  })
  it('reconnaît les câbles USB et la liaison AutoConnect des Syva', () => {
    expect(connectorsMate('usb-micro', 'usb-a')).toBe(true)
    expect(connectorsMate('syva-autoconnect', 'syva-autoconnect')).toBe(true)
    expect(connectorsMate('syva-autoconnect', 'speakon-nl4')).toBe(false)
  })
})
