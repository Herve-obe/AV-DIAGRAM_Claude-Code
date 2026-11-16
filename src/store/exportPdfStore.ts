// Ouverture du dialogue d'export PDF, demandée depuis la barre d'outils, la palette de commandes et les vues.
import { create } from 'zustand'

export const useExportPdf = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
