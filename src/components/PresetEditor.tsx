import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Editor visual do modelo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Arraste os blocos livremente, inclusive entre linhas. Marque ou desmarque
          para incluir ou excluir.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={parts.map((part) => part.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid min-h-28 grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  )
}