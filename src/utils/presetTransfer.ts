import type { PresetTransferPayload, RenamePreset } from '../types/fileTypes'

const TRANSFER_APP_NAME = 'renomeador-pranchas'
const TRANSFER_VERSION = '1.1.0'

export function exportPresetsToJson(presets: RenamePreset[]) {
  const payload: PresetTransferPayload = {
    app: TRANSFER_APP_NAME,
    version: TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    presets,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `presets-renomeador-pranchas-${new Date()
    .toISOString()
    .slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importPresetsFromFile(
  file: File,
): Promise<RenamePreset[]> {
  const text = await file.text()
  const data = JSON.parse(text) as Partial<PresetTransferPayload>

  if (!data || !Array.isArray(data.presets)) {
    throw new Error(
      'Arquivo inválido. O JSON não contém uma lista de presets compatível.',
    )
  }

  const validPresets = data.presets.filter(isValidPreset)

  if (validPresets.length === 0) {
    throw new Error(
      'Nenhum preset válido foi encontrado no arquivo selecionado.',
    )
  }

  return validPresets
}

function isValidPreset(value: unknown): value is RenamePreset {
  if (!value || typeof value !== 'object') {
    return false
  }

  const preset = value as Partial<RenamePreset>

  return (
    typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    typeof preset.joinWith === 'string' &&
    Array.isArray(preset.partOrder) &&
    Array.isArray(preset.partStates)
  )
}