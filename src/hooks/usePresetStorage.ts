import { useEffect, useState } from 'react'
import type { RenamePreset } from '../types/fileTypes'

export const PRESETS_STORAGE_KEY = 'renomeador-pranchas-presets'

export function usePresetStorage() {
  const [savedPresets, setSavedPresets] = useState<RenamePreset[]>([])

  useEffect(() => {
    const storedPresets = localStorage.getItem(PRESETS_STORAGE_KEY)

    if (!storedPresets) {
      return
    }

    try {
      const parsedPresets = JSON.parse(storedPresets) as RenamePreset[]
      setSavedPresets(parsedPresets)
    } catch (error) {
      console.error('Erro ao carregar presets salvos:', error)
    }
  }, [])

  function persistPresets(presets: RenamePreset[]) {
    setSavedPresets(presets)
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
  }

  function savePreset(preset: RenamePreset) {
    const updatedPresets = [
      ...savedPresets.filter((item) => item.name !== preset.name),
      preset,
    ]

    persistPresets(updatedPresets)
  }

  function deletePreset(presetId: string) {
    const updatedPresets = savedPresets.filter((preset) => preset.id !== presetId)
    persistPresets(updatedPresets)
  }

  function replaceAllPresets(presets: RenamePreset[]) {
    persistPresets(presets)
  }

  return {
    savedPresets,
    savePreset,
    deletePreset,
    replaceAllPresets,
  }
}