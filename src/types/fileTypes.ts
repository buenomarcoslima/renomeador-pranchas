export type SupportedExtension = 'pdf' | 'dwg'

export type ParsedPart = {
  id: string
  text: string
  enabled: boolean
  originalIndex: number
  isRevision: boolean
  revisionPrefix: string | null
  revisionNumber: string | null
}

export type RenamingFile = {
  id: string
  originalFile: File
  originalName: string
  baseName: string
  extension: SupportedExtension
  parts: ParsedPart[]
  newName: string
}

export type RenamePresetPartState = {
  originalIndex: number
  enabled: boolean
}

export type RenamePreset = {
  id: string
  name: string
  joinWith: string
  partOrder: number[]
  partStates: RenamePresetPartState[]
}