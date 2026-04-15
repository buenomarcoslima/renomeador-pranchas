import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import PresetEditor from './components/PresetEditor'
import AppFooter from './components/AppFooter'
import { usePresetStorage } from './hooks/usePresetStorage'
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
import {
  exportPresetsToJson,
  importPresetsFromFile,
} from './utils/presetTransfer'

const APP_VERSION = '1.1.0'

export default function App() {
  const [files, setFiles] = useState<RenamingFile[]>([])
  const [joinWith, setJoinWith] = useState<string>(' - ')
  const [templateParts, setTemplateParts] = useState<ParsedPart[]>([])
  const [globalRevision, setGlobalRevision] = useState<string>('')
  const [presetName, setPresetName] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string>('')

  const { savedPresets, savePreset, deletePreset, replaceAllPresets } =
    usePresetStorage()

  const importInputRef = useRef<HTMLInputElement | null>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
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
          id: `${file.name}-${index}-${crypto.randomUUID()}`,
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
      setStatusMessage(`${parsedFiles.length} arquivo(s) válidos carregados.`)
    } else {
      setTemplateParts([])
      setStatusMessage('Nenhum arquivo PDF ou DWG válido foi identificado.')
    }

    event.target.value = ''
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

    setStatusMessage('Regra aplicada a todos os arquivos.')
  }

  function handleJoinWithChange(event: ChangeEvent<HTMLInputElement>) {
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

    setStatusMessage(`Revisão global "${revisionValue}" aplicada.`)
  }

  function handleSavePreset() {
    const cleanName = presetName.trim()

    if (!cleanName || templateParts.length === 0) {
      return
    }

    const newPreset = createPresetFromTemplate(cleanName, joinWith, templateParts)
    savePreset(newPreset)
    setPresetName('')
    setStatusMessage(`Preset "${cleanName}" salvo com sucesso.`)
  }

  function loadPreset(preset: RenamePreset) {
    setJoinWith(preset.joinWith)
    setTemplateParts((currentParts) => {
      if (currentParts.length === 0) {
        return currentParts
      }

      return applyPresetToTemplateParts(currentParts, preset)
    })

    setStatusMessage(`Preset "${preset.name}" carregado.`)
  }

  async function downloadZip() {
    if (files.length === 0) {
      return
    }

    const zip = new JSZip()

    files.forEach((file) => {
      const finalName = file.newName || file.originalName
      zip.file(finalName, file.originalFile)
    })

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, 'arquivos-renomeados.zip')
  }

  function handleExportPresets() {
    if (savedPresets.length === 0) {
      setStatusMessage('Não há presets salvos para exportar.')
      return
    }

    exportPresetsToJson(savedPresets)
    setStatusMessage('Presets exportados em JSON com sucesso.')
  }

  function handleOpenImport() {
    importInputRef.current?.click()
  }

  async function handleImportPresets(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    try {
      const importedPresets = await importPresetsFromFile(selectedFile)

      const mergedPresets = [
        ...savedPresets.filter(
          (saved) =>
            !importedPresets.some(
              (imported) => imported.name.trim() === saved.name.trim(),
            ),
        ),
        ...importedPresets,
      ]

      replaceAllPresets(mergedPresets)
      setStatusMessage(
        `${importedPresets.length} preset(s) importado(s) com sucesso.`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível importar os presets.'

      setStatusMessage(message)
    } finally {
      event.target.value = ''
    }
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                Ferramenta local para PDF e DWG
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Renomeador de pranchas
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Padronize nomes de arquivos com mais consistência. Faça upload de
                PDFs e DWGs, reorganize blocos com drag and drop, aplique revisão
                global, salve presets e exporte tudo em ZIP.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
              <p className="font-medium text-slate-800">Versão {APP_VERSION}</p>
              <p>Processamento local no navegador</p>
            </div>
          </div>

          {statusMessage && (
            <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              {statusMessage}
            </div>
          )}
        </header>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Entrada e ações
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Faça upload dos arquivos, defina o separador final e aplique a
              regra para toda a lista.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Arquivos PDF e DWG
                </span>

                <input
                  type="file"
                  accept=".pdf,.dwg"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:font-medium file:text-sky-700 hover:file:bg-sky-200"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Separador final
                </span>

                <input
                  value={joinWith}
                  onChange={handleJoinWithChange}
                  placeholder="Ex.:  - "
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                />
              </label>

              {templateHasRevision && (
                <div className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Revisão global
                  </span>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={globalRevision}
                      onChange={(event) => setGlobalRevision(event.target.value)}
                      placeholder="Ex.: 02"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                    />

                    <button
                      type="button"
                      onClick={applyGlobalRevision}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={applyTemplateToAllFiles}
                  className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
                >
                  Aplicar regra em todos
                </button>

                <button
                  type="button"
                  onClick={downloadZip}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Baixar ZIP
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                Arquivos válidos carregados: <strong>{files.length}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Presets do modelo
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Salve combinações de ordem, ativação de blocos e separador. Você
              também pode exportar e importar presets em JSON.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Nome do preset
                </span>

                <input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="Ex.: Escritório - PDF padrão"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSavePreset}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Salvar preset
                </button>

                <button
                  type="button"
                  onClick={handleExportPresets}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-100"
                >
                  Exportar presets
                </button>

                <button
                  type="button"
                  onClick={handleOpenImport}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-100"
                >
                  Importar presets
                </button>

                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportPresets}
                  className="hidden"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                Presets salvos: <strong>{savedPresets.length}</strong>
              </div>

              {savedPresets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Nenhum preset salvo ainda.
                </div>
              ) : (
                <div className="grid gap-3">
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {preset.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Separador: <strong>{preset.joinWith}</strong>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Arquivo modelo
            </h2>

            {files.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Nenhum arquivo carregado ainda.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Arquivo base</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {files[0].originalName}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Preview do modelo</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {templatePreview || '—'}
                  </p>
                </div>

                {templateHasRevision && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                    Revisão detectada no modelo.
                  </div>
                )}
              </div>
            )}
          </div>

          <PresetEditor
            parts={templateParts}
            onPartsChange={handleTemplatePartsChange}
          />
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Arquivos e previews
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Veja o preview ao vivo de cada arquivo e o nome que será aplicado no
            ZIP final.
          </p>

          {files.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Faça upload de arquivos para ver a lista aqui.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {files.map((file) => {
                const livePreview = getPreviewNameFromTemplate(
                  file,
                  templateParts,
                  joinWith,
                )

                return (
                  <article
                    key={file.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Original
                        </p>
                        <p className="mt-2 break-all text-sm font-medium text-slate-800">
                          {file.originalName}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Preview ao vivo
                        </p>
                        <p className="mt-2 break-all text-sm font-medium text-sky-700">
                          {livePreview}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Nome aplicado
                        </p>
                        <p className="mt-2 break-all text-sm font-medium text-emerald-700">
                          {file.newName}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <AppFooter version={APP_VERSION} />
      </div>
    </main>
  )
}