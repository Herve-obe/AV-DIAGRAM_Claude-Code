import { afterEach, expect, it } from 'vitest'
import { LIBRARY_BY_ID } from '../library/generic'
import * as ops from '../model/project'
import { setProjectGuard, useProject } from './projectStore'

afterEach(() => setProjectGuard(() => true))
it('le garde bloque aussi le déplacement, le remplacement par l’assistant, l’ouverture et l’historique', () => {
  const { project: p, id } = ops.addEquipment(ops.createProject('Concert'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  useProject.setState({ project: p, past: [ops.createProject('Ancien')], future: [ops.createProject('Futur')], saved: true })
  setProjectGuard(() => false)
  const st = useProject.getState()
  st.moveEquipment(id, { x: 999, y: 0 }); st.rename('Autre'); st.replaceProject(ops.createProject('Assistant'))
  st.load(ops.createProject('Fichier')); st.undo(); st.redo()
  expect(useProject.getState().project).toBe(p)
  expect(useProject.getState().saved).toBe(true)
})
