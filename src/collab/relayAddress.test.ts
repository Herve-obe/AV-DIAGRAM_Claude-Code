import { expect, it } from 'vitest'
import { isPrivateRelayAddress, relayAddresses } from './relayAddress'

it('ne retient que des adresses IPv4 privées avec port, au plus quatre', () => {
  for (const ok of ['192.168.1.20:4455', '10.0.0.5:1', '172.16.3.4:65535', '172.31.255.255:80']) expect(isPrivateRelayAddress(ok), ok).toBe(true)
  for (const ko of ['8.8.8.8:4455', '172.32.0.1:4455', '192.168.1.20', '192.168.1.300:4455', '192.168.1.2:0', 'evil.example:443', '127.0.0.1:4455', ' 10.0.0.1:1', 42, null])
    expect(isPrivateRelayAddress(ko), String(ko)).toBe(false)
  expect(relayAddresses(['10.0.0.1:1', '10.0.0.1:1', '8.8.8.8:1', '10.0.0.2:1', '10.0.0.3:1', '10.0.0.4:1', '10.0.0.5:1'])).toEqual(['10.0.0.1:1', '10.0.0.2:1', '10.0.0.3:1', '10.0.0.4:1'])
  expect(relayAddresses('10.0.0.1:1')).toEqual([])
})
