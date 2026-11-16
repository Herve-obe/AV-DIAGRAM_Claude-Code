// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LIBRARY_BY_ID } from '../library/generic'
import { addEquipment, createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { useCollab } from './session'
import { useEditing } from './useEditing'

describe('droits affichés pendant une session', () => {
  let host: HTMLDivElement, root: Root
  const added = addEquipment(createProject('Concert'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const initial = useCollab.getState()
  let renders = 0
  let last: ReturnType<typeof useEditing> | null = null
  function Probe() {
    renders++
    last = useEditing()
    return null
  }

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    host = document.createElement('div')
    root = createRoot(host)
    renders = 0
    useProject.setState({ project: added.project })
    useUi.setState({ layer: 'sound' })
    useCollab.setState({ status: 'connected', role: 'guest', started: true, userId: 'moi', claims: {} })
    act(() => root.render(<Probe />))
  })
  afterEach(() => {
    act(() => root.unmount())
    useCollab.setState(initial, true)
    useUi.setState({ layer: 'all' })
  })

  it('suit les réservations de calques sans se redessiner pour le tchat ni pour le projet', () => {
    const eq = added.project.equipment[added.id]
    expect(last!.equipment(eq)).toBe(false)
    const count = renders
    act(() => { useCollab.setState({ unread: 3, chatOpen: true }) })
    act(() => { useProject.setState({ project: { ...useProject.getState().project, name: 'Autre' } }) })
    expect(renders).toBe(count)
    act(() => { useCollab.setState({ claims: { sound: { userId: 'moi', name: 'Moi', color: 'x' } } }) })
    expect(renders).toBe(count + 1)
    expect(last!.equipment(eq)).toBe(true)
  })

  it('compare un changement au projet courant, lu au moment de l’appel', () => {
    const before = last!
    const renamed = { ...added.project, name: 'Renommé' }
    act(() => { useProject.setState({ project: renamed }) })
    expect(last).toBe(before)
    // Aucun changement par rapport au projet courant : rien à refuser
    act(() => { useCollab.setState({ claims: { full: { userId: 'autre', name: 'Autre', color: 'x' } } }) })
    expect(last!.changeReason(renamed)).toBeNull()
    expect(last!.changeReason({ ...renamed, name: 'Encore' })).toEqual({ code: 'common' })
  })
})
