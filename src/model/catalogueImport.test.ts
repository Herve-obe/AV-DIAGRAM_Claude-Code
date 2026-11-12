import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { LIBRARY } from '../library'
import { catalogueColumns, catalogueCsv, catalogueEntries, catalogueTemplate } from './catalogueImport'

describe('import de catalogue utilisateur', () => {
  const device = { id: 'test-mic', manufacturer: 'Fabricant fictif', model: 'Micro 1', family: 'capture' as const, pictogram: 'mic' as const, status: 'community' as const,
    ports: [{ id: 'out', name: 'Sortie', direction: 'out' as const, signal: 'audioAnalog' as const, connector: 'xlr3' }] }
  it('lit les CSV avec BOM, guillemets, point-virgule, retours à la ligne et guillemets doublés', () => {
    const table = catalogueCsv('\uFEFFModèle;Fabricant\r\n"Micro; ""spécial""\n1";Test\r\n')
    expect(table.rows).toEqual([['Modèle', 'Fabricant'], ['Micro; "spécial"\n1', 'Test']])
    expect(catalogueColumns(table.rows[0])).toEqual({ model: 0, manufacturer: 1, quantity: -1 })
    expect(catalogueCsv('Name,Brand\nMicro,Test').rows[1]).toEqual(['Micro', 'Test'])
    expect(catalogueCsv('Name\tBrand\nMicro\tTest').rows[1]).toEqual(['Micro', 'Test'])
  })
  it('refuse une syntaxe CSV tronquée ou démesurée', () => {
    expect(() => catalogueCsv('Name\n"Micro')).toThrow('invalid')
    expect(() => catalogueCsv('Name\n"Micro"suite')).toThrow('invalid')
    expect(() => catalogueCsv('Name\n' + 'a'.repeat(10_001))).toThrow('large')
    expect(() => catalogueCsv(Array(102).fill('a').join(','))).toThrow('large')
  })
  it('rapproche une désignation exacte et déduplique les exemplaires sans importer les colonnes internes', () => {
    const table = catalogueCsv('Manufacturer,Model,Price,Serial\nFabricant fictif,Micro 1,90,ABC\nfabricant fictif,micro-1,45,DEF')
    const result = catalogueEntries(table, catalogueColumns(table.rows[0]), [device], 'passive')
    expect(result.problems).toEqual([]); expect(result.entries).toHaveLength(1)
    expect(result.entries[0].template).toBe(device)
    const copy = catalogueTemplate(result.entries[0]); copy.ports[0].name = 'Autre'
    expect(device.ports[0].name).toBe('Sortie'); expect(copy.status).toBe('user')
    expect(JSON.stringify(copy)).not.toMatch(/ABC|DEF|Serial|Price/)
  })
  it('ne devine pas une génération ou une variante et laisse les nouvelles prises à documenter', () => {
    const table = catalogueCsv('Name\nFabricant fictif Micro 1 avec étui\nFabricant fictif Micro 10\nInconnu')
    const result = catalogueEntries(table, { model: 0, manufacturer: -1 }, [device], 'camera')
    expect(result.entries[0].template).toBe(device)
    expect(result.entries[1].template).toBeUndefined()
    expect(catalogueTemplate(result.entries[2])).toMatchObject({ status: 'user', family: 'camera', portStatus: 'pending', ports: [] })
    const ambiguous = catalogueEntries(catalogueCsv('Name\nMicro 1'), { model: 0, manufacturer: -1 }, [device, { ...device, id: 'other', manufacturer: 'Autre fabricant' }], 'passive')
    expect(ambiguous.entries[0].template).toBeUndefined()
  })
  it('écarte les formules XLSX et les cellules invalides sans exécuter leur contenu', () => {
    const result = catalogueEntries({ name: 'Test', rows: [['Name'], [{ kind: 'formula' }], [true], [null], ['Valide']] }, { model: 0, manufacturer: -1 }, [], 'passive')
    expect(result.problems).toEqual([2, 3]); expect(result.entries.map(e => e.model)).toEqual(['Valide'])
    const generic = GENERIC_LIBRARY[0]
    expect(catalogueEntries({ name: 'Test', rows: [['Name'], [generic.model]] }, { model: 0, manufacturer: -1 }, [generic], 'passive').entries[0].template).toBeUndefined()
  })
  it('reconnaît les générations par alias avec une colonne fabricant, sans confondre les marques', () => {
    const fourth = LIBRARY.find(t => t.id === 'focusrite-scarlett-2i2-4g')!
    const library = [...LIBRARY, { ...fourth, id: 'autre-interface', manufacturer: 'Autre' }]
    const table = catalogueCsv('Fabricant;Modèle\nFocusrite;Scarlett 2i2 Gen 2\nFocusrite;Scarlett 2i2 Gen 3\nfocusrite;Scarlett 2i2 Gen 4\nFocusrite;Scarlett 2i2\nInconnu;Scarlett 2i2 Gen 4\n;Scarlett 2i2 Gen 4')
    const entries = catalogueEntries(table, catalogueColumns(table.rows[0]), library, 'recording').entries
    expect(entries.map(e => e.template?.id)).toEqual([
      'focusrite-scarlett-2i2-2g', 'focusrite-scarlett-2i2-3g', 'focusrite-scarlett-2i2-4g', undefined, undefined, undefined,
    ])
  })
  it('retrouve un modèle déjà importé malgré sa copie dans la bibliothèque commune', () => {
    const original = LIBRARY.find(t => t.id === 'focusrite-scarlett-2i2-4g')!
    const personal = { ...structuredClone(original), id: 'user-interface', status: 'user' as const }
    const table = catalogueCsv('Fabricant;Modèle\nFocusrite;Scarlett 2i2 Gen 4')
    const entries = catalogueEntries(table, catalogueColumns(table.rows[0]), [personal, ...LIBRARY], 'recording').entries
    expect(entries[0].template).toBe(personal)
    expect(catalogueTemplate(entries[0]).model).toBe(original.model)
  })
})
