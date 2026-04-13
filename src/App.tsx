import { useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import PresetEditor from './components/PresetEditor'
import type { ParsedPart, RenamePreset, RenamingFile } from './types/fileTypes'
import {
  applyPresetToTemplateParts,
  applyTemplateToFileParts,
  buildFileName,
  createPresetFromTemplate,
  getExtension,
  getPreviewNameFromTemplate,
  hasAnyRevision,
  removeExtension,
  splitFileNameIntoParts,
  updateRevisionParts,
} from './utils/fileNameUtils'

const PRESETS_STORAGE_KEY = 'renomeador-pranchas-presets'

function App() {
  const [files, setFiles] = useState<RenamingFile[]>([])
  const [joinWith, setJoinWith] = useState(' - ')
  const [templateParts, setTemplateParts] = useState<ParsedPart[]>([])
  const [globalRevision, setGlobalRevision] = useState('')
  const [presetName, setPresetName] = useState('')
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files

    if (!selectedFiles) {
      return
    }

    const parsedFiles: RenamingFile[] = Array.from(selectedFiles)
      .map((file, index) => {
        const extension = getExtension(file.name)

        if (!extension) {
          return null
        }

        const baseName = removeExtension(file.name)
        const parts = splitFileNameIntoParts(baseName)
        const newName = buildFileName(parts, joinWith, extension)

        return {
          id: `${file.name}-${index}`,
          originalFile: file,
          originalName: file.name,
          baseName,
          extension,
          parts,
          newName,
        }
      })
      .filter((file): file is RenamingFile => file !== null)

    setFiles(parsedFiles)

    if (parsedFiles.length > 0) {
      setTemplateParts(parsedFiles[0].parts)
    } else {
      setTemplateParts([])
    }
  }

  function handleTemplatePartsChange(updatedParts: ParsedPart[]) {
    setTemplateParts(updatedParts)
  }

  function applyTemplateToAllFiles() {
    if (templateParts.length === 0) {
      return
    }

    setFiles((currentFiles) =>
      currentFiles.map((file) => {
        const updatedParts = applyTemplateToFileParts(file.parts, templateParts)

        return {
          ...file,
          parts: updatedParts,
          newName: buildFileName(updatedParts, joinWith, file.extension),
        }
      }),
    )
  }

  function handleJoinWithChange(event: React.ChangeEvent<HTMLInputElement>) {
    setJoinWith(event.target.value)
  }

  function applyGlobalRevision() {
    const revisionValue = globalRevision.trim()

    if (!revisionValue) {
      return
    }

    const updatedTemplateParts = updateRevisionParts(templateParts, revisionValue)
    setTemplateParts(updatedTemplateParts)

    setFiles((currentFiles) =>
      currentFiles.map((file) => {
        const updatedParts = updateRevisionParts(file.parts, revisionValue)

        return {
          ...file,
          parts: updatedParts,
          newName: buildFileName(updatedParts, joinWith, file.extension),
        }
      }),
    )
  }

  function savePreset() {
    const cleanName = presetName.trim()

    if (!cleanName || templateParts.length === 0) {
      return
    }

    const newPreset = createPresetFromTemplate(cleanName, joinWith, templateParts)

    const updatedPresets = [
      ...savedPresets.filter((preset) => preset.name !== cleanName),
      newPreset,
    ]

    persistPresets(updatedPresets)
    setPresetName('')
  }

  function loadPreset(preset: RenamePreset) {
    setJoinWith(preset.joinWith)

    setTemplateParts((currentParts) => {
      if (currentParts.length === 0) {
        return currentParts
      }

      return applyPresetToTemplateParts(currentParts, preset)
    })
  }

  function deletePreset(presetId: string) {
    const updatedPresets = savedPresets.filter((preset) => preset.id !== presetId)
    persistPresets(updatedPresets)
  }

  async function downloadZip() {
    const zip = new JSZip()

    files.forEach((file) => {
      const finalName = file.newName || file.originalName
      zip.file(finalName, file.originalFile)
    })

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, 'arquivos-renomeados.zip')
  }

  const templatePreview = useMemo(() => {
    if (files.length === 0 || templateParts.length === 0) {
      return ''
    }

    return buildFileName(templateParts, joinWith, files[0].extension)
  }, [files, joinWith, templateParts])

  const templateHasRevision = useMemo(() => {
    return hasAnyRevision(templateParts)
  }, [templateParts])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700">
                Renomeador de pranchas
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Padronize nomes de PDF e DWG
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Envie arquivos, reorganize os blocos, salve presets, ajuste revisão global
                e baixe tudo em ZIP.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">Arquivos válidos:</span> {files.length}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Entrada e ações</h2>
              <p className="mt-1 text-sm text-slate-600">
                Faça upload, ajuste o separador final e aplique a regra em lote.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Arquivos PDF e DWG
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.dwg"
                    onChange={handleFileChange}
                    className="block w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Separador final
                  </label>
                  <input
                    type="text"
                    value={joinWith}
                    onChange={handleJoinWithChange}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-400"
                  />
                </div>

                {templateHasRevision && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Revisão global
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={globalRevision}
                        onChange={(event) => setGlobalRevision(event.target.value)}
                        placeholder="Ex.: 02"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                      />
                      <button
                        type="button"
                        onClick={applyGlobalRevision}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={applyTemplateToAllFiles}
                  disabled={files.length === 0 || templateParts.length === 0}
                  className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Aplicar regra em todos
                </button>

                <button
                  type="button"
                  onClick={downloadZip}
                  disabled={files.length === 0}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Baixar ZIP
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Preset do modelo</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Salve e recarregue combinações de ordem, marcação e separador.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="Nome do preset"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                />

                <button
                  type="button"
                  onClick={savePreset}
                  disabled={!presetName.trim() || templateParts.length === 0}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Salvar preset
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {savedPresets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Nenhum preset salvo ainda.
                  </div>
                ) : (
                  savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{preset.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Separador: <span className="rounded bg-white px-2 py-1 font-mono">{preset.joinWith}</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => loadPreset(preset)}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-100"
                        >
                          Carregar
                        </button>

                        <button
                          type="button"
                          onClick={() => deletePreset(preset.id)}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Arquivo modelo</h2>

              {files.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nenhum arquivo carregado ainda.</p>
              ) : (
                <>
                  <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Arquivo:</span>{' '}
                      {files[0].originalName}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Preview:</span>{' '}
                      {templatePreview}
                    </p>
                    {templateHasRevision && (
                      <p className="text-sm font-medium text-emerald-700">
                        Revisão detectada no modelo.
                      </p>
                    )}
                  </div>

                  <div className="mt-5">
                    <PresetEditor
                      parts={templateParts}
                      onPartsChange={handleTemplatePartsChange}
                    />
                  </div>
                </>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Arquivos e previews</h2>
              <p className="mt-1 text-sm text-slate-600">
                Veja o preview ao vivo e o nome efetivamente aplicado.
              </p>

              <div className="mt-5 space-y-4">
                {files.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Faça upload de arquivos para ver a lista aqui.
                  </div>
                ) : (
                  files.map((file) => {
                    const livePreview = getPreviewNameFromTemplate(file, templateParts, joinWith)

                    return (
                      <div
                        key={file.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">Original:</span>{' '}
                          {file.originalName}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">Preview ao vivo:</span>{' '}
                          {livePreview}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">Nome aplicado:</span>{' '}
                          {file.newName}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App