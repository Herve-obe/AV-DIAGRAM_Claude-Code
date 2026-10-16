// Arguments Chromium : confiance limitée à la clé de l'autorité du proxy de l'environnement
// (/root/.ccr/agent-proxy-ca.crt). L'empreinte est recalculée à chaque lancement, car le certificat
// peut changer d'une session à l'autre.
import { createHash, X509Certificate } from 'node:crypto'
import { readFileSync } from 'node:fs'

export function spkiArgs() {
  try {
    const ca = new X509Certificate(readFileSync('/root/.ccr/agent-proxy-ca.crt'))
    const der = ca.publicKey.export({ type: 'spki', format: 'der' })
    return ['--ignore-certificate-errors-spki-list=' + createHash('sha256').update(der).digest('base64')]
  } catch {
    return []
  }
}
