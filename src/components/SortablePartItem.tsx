import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ParsedPart } from '../types/fileTypes'

type SortablePartItemProps = {
  part: ParsedPart
  onToggle: (partId: string) => void
}

export default function SortablePartItem({
  part,
  onToggle,
}: SortablePartItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: part.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  }

  function stopDragStart(
    event: React.PointerEvent | React.MouseEvent | React.TouchEvent,
  ) {
    event.stopPropagation()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        'rounded-2xl border bg-white p-4 shadow-sm transition',
        part.enabled
          ? 'border-slate-200'
          : 'border-slate-200 bg-slate-50 opacity-70',
        isDragging ? 'scale-[1.02] shadow-lg' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {!isDragging && (
          <input
            type="checkbox"
            checked={part.enabled}
            onChange={() => onToggle(part.id)}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={stopDragStart}
            onMouseDown={stopDragStart}
            onTouchStart={stopDragStart}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{part.text}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
              posição original: {part.originalIndex + 1}
            </span>

            {part.isRevision && (
              <span className="rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-700">
                revisão detectada
              </span>
            )}

            <span
              className={[
                'rounded-full px-2 py-1 text-xs',
                part.enabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700',
              ].join(' ')}
            >
              {part.enabled ? 'incluído' : 'excluído'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}