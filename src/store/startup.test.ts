import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('démarrage de l’application de bureau', () => {
  it('ne gèle pas Object.prototype : d3-color (React Flow) plante au chargement et la fenêtre reste cachée', () => {
    const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'))
    expect(conf.app.security.freezePrototype).not.toBe(true)
    // La fenêtre part cachée : la partie native doit l'afficher d'office si l'interface ne le fait pas
    expect(conf.app.windows[0].visible).toBe(false)
    expect(readFileSync('src-tauri/src/lib.rs', 'utf8')).toContain('STARTUP_SHOW_DELAY_SECS')
  })
})
