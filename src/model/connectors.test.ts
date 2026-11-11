import { describe, expect, it } from 'vitest'
import { connectorLabel, connectorsMate } from './connectors'
import { familiesCompatible } from './signals'

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

describe('signaux et connecteurs', () => {
  it('un flux audio sur IP passe sur un port réseau', () => {
    expect(familiesCompatible('audioIp', 'network')).toBe(true)
    expect(familiesCompatible('network', 'videoIp')).toBe(true)
    expect(familiesCompatible('video', 'audioAnalog')).toBe(false)
    expect(familiesCompatible('audioIp', 'videoIp')).toBe(false)
  })
  it('un RJ45 entre dans une embase etherCON, pas un XLR dans un jack', () => {
    expect(connectorsMate('rj45', 'ethercon')).toBe(true)
    expect(connectorsMate('xlr3', 'jack-trs')).toBe(false)
  })
})

describe('connecteurs combo', () => {
  it('une embase combo accepte un XLR et un jack', () => {
    expect(connectorsMate('xlr3', 'combo')).toBe(true)
    expect(connectorsMate('combo', 'jack-trs')).toBe(true)
    expect(connectorsMate('combo', 'bnc')).toBe(false)
  })
})
