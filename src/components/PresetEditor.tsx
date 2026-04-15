import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import type { ParsedPart } from '../types/fileTypes'
import SortablePartItem from './SortablePartItem'
import { reorderParts } from '../utils/fileNameUtils'

type PresetEditorProps = {
  parts: ParsedPart[]
  onPartsChange: (parts: ParsedPart[]) => void
}

export default function PresetEditor({
  parts,
  onPartsChange,
}: PresetEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const updatedParts = reorderParts(parts, String(active.id), String(over.id))
    onPartsChange(updatedParts)
  }

  function handleToggle(partId: string) {
    const updatedParts = parts.map((part) =>
      part.id === partId ? { ...part, enabled: !part.enabled } : part,
    )

    onPartsChange(updatedParts)
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Editor visual do modelo
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Arraste os blocos para reorganizar o padrão do nome. Você também pode
          ativar ou desativar blocos individualmente para definir exatamente o
          que entra no nome final.
        </p>
      </div>

      {parts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          Faça upload de pelo menos um arquivo para editar o modelo.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={parts.map((part) => part.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {parts.map((part) => (
                <SortablePartItem
                  key={part.id}
                  part={part}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}