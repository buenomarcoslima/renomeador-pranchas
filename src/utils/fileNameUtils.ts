import type {
  ParsedPart,
  RenamePreset,
  RenamingFile,
  SupportedExtension,
} from '../types/fileTypes'

type DetectedRevision = {
  prefix: string
  number: string
}

export function getExtension(filename: string): SupportedExtension | null {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.dwg')) return 'dwg'

  return null
}

export function removeExtension(filename: string): string {
  return filename.replace(/\.(pdf|dwg)$/i, '')
}

export function detectRevision(partText: string): DetectedRevision | null {
  const trimmed = partText.trim()
  const regex = /^(R|REV|REVISÃO)\s*(\d+)$/i
  const match = trimmed.match(regex)

  if (!match) {
    return null
  }

  return {
    prefix: match[1].toUpperCase(),
    number: match[2],
  }
}

export function splitFileNameIntoParts(fileNameWithoutExtension: string): ParsedPart[] {
  const rawParts = fileNameWithoutExtension
    .split(/[_.-]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  return rawParts.map((part, index) => {
    const revision = detectRevision(part)

    return {
      id: `part-${index}-${part}`,
      text: part,
      enabled: true,
      originalIndex: index,
      isRevision: !!revision,
      revisionPrefix: revision ? revision.prefix : null,
      revisionNumber: revision ? revision.number : null,
    }
  })
}

export function buildFileName(
  parts: ParsedPart[],
  joinWith: string,
  extension: SupportedExtension,
): string {
  const enabledParts = parts
    .filter((part) => part.enabled)
    .map((part) => part.text.trim())
    .filter((part) => part.length > 0)

  return `${enabledParts.join(joinWith)}.${extension}`
}

export function reorderParts(
  parts: ParsedPart[],
  activeId: string,
  overId: string,
): ParsedPart[] {
  const oldIndex = parts.findIndex((part) => part.id === activeId)
  const newIndex = parts.findIndex((part) => part.id === overId)

  if (oldIndex === -1 || newIndex === -1) {
    return parts
  }

  const updated = [...parts]
  const [moved] = updated.splice(oldIndex, 1)
  updated.splice(newIndex, 0, moved)

  return updated
}

export function updateRevisionParts(parts: ParsedPart[], newNumber: string): ParsedPart[] {
  const sanitizedNumber = newNumber.trim()

  if (!sanitizedNumber) {
    return parts
  }

  return parts.map((part) => {
    if (!part.isRevision || !part.revisionPrefix) {
      return part
    }

    const originalLength = part.revisionNumber ? part.revisionNumber.length : 2
    const paddedNumber = sanitizedNumber.padStart(originalLength, '0')

    return {
      ...part,
      text: `${part.revisionPrefix}${paddedNumber}`,
      revisionNumber: paddedNumber,
    }
  })
}

export function hasAnyRevision(parts: ParsedPart[]): boolean {
  return parts.some((part) => part.isRevision)
}

export function applyTemplateToFileParts(
  fileParts: ParsedPart[],
  templateParts: ParsedPart[],
): ParsedPart[] {
  const templateOrder = templateParts.map((part) => part.originalIndex)

  const filePartsByIndex = [...fileParts].sort(
    (a, b) => a.originalIndex - b.originalIndex,
  )

  const templateByIndex = [...templateParts].sort(
    (a, b) => a.originalIndex - b.originalIndex,
  )

  const mergedParts = filePartsByIndex.map((filePart, index) => {
    const templatePart = templateByIndex[index]

    if (!templatePart) {
      return filePart
    }

    return {
      ...filePart,
      enabled: templatePart.enabled,
    }
  })

  const reorderedParts = templateOrder
    .map((originalIndex) =>
      mergedParts.find((part) => part.originalIndex === originalIndex),
    )
    .filter((part): part is ParsedPart => part !== undefined)

  return reorderedParts
}

export function getPreviewNameFromTemplate(
  file: RenamingFile,
  templateParts: ParsedPart[],
  joinWith: string,
): string {
  const previewParts = applyTemplateToFileParts(file.parts, templateParts)
  return buildFileName(previewParts, joinWith, file.extension)
}

export function createPresetFromTemplate(
  name: string,
  joinWith: string,
  templateParts: ParsedPart[],
): RenamePreset {
  return {
    id: `preset-${Date.now()}`,
    name: name.trim(),
    joinWith,
    partOrder: templateParts.map((part) => part.originalIndex),
    partStates: templateParts.map((part) => ({
      originalIndex: part.originalIndex,
      enabled: part.enabled,
    })),
  }
}

export function applyPresetToTemplateParts(
  currentParts: ParsedPart[],
  preset: RenamePreset,
): ParsedPart[] {
  const byOriginalIndex = [...currentParts].sort(
    (a, b) => a.originalIndex - b.originalIndex,
  )

  const updatedEnabled = byOriginalIndex.map((part) => {
    const presetState = preset.partStates.find(
      (state) => state.originalIndex === part.originalIndex,
    )

    if (!presetState) {
      return part
    }

    return {
      ...part,
      enabled: presetState.enabled,
    }
  })

  const reorderedParts = preset.partOrder
    .map((originalIndex) =>
      updatedEnabled.find((part) => part.originalIndex === originalIndex),
    )
    .filter((part): part is ParsedPart => part !== undefined)

  return reorderedParts
}