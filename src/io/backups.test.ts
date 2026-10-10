import { describe, expect, it } from 'vitest'
import { backupName, backupsToDelete } from './backups'

describe('sauvegardes tournantes', () => {
  it('nomme les sauvegardes dans l\'ordre chronologique', () => {
    expect(backupName('concert', new Date(2026, 9, 10, 14, 5, 3))).toBe('concert_2026-10-10_14-05-03.avd')
  })
  it('ne garde que les plus récentes, sans toucher aux autres fichiers', () => {
    const names = [
      'concert_2026-10-10_14-00-00.avd', 'concert_2026-10-10_14-10-00.avd', 'concert_2026-10-10_14-05-00.avd',
      'concert-2_2026-10-10_14-00-00.avd', 'notes.txt', 'concert.avd',
    ]
    expect(backupsToDelete(names, 'concert', 2)).toEqual(['concert_2026-10-10_14-00-00.avd'])
    expect(backupsToDelete(names, 'concert', 10)).toEqual([])
  })
})
