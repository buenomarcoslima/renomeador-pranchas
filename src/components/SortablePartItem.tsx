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
        'inline-flex min-h-[52px] max-w-full items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm select-none transition',
        isDragging
          ? 'z-50 cursor-grabbing border-sky-300 bg-sky-50 opacity-80 shadow-lg'
          : 'cursor-grab',
        part.enabled
          ? 'border-sky-200 bg-sky-50'
          : 'border-slate-200 bg-slate-100',
      ].join(' ')}
    >
      {!isDragging && (
        <input
          type="checkbox"
          checked={part.enabled}
          onChange={() => onToggle(part.id)}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={stopDragStart}
          onMouseDown={stopDragStart}
          onTouchStart={stopDragStart}
          className="h-4 w-4 shrink-0 rounded border-slate-300"
        />
      )}

      <span
        className={[
          'break-words text-sm font-medium tracking-tight',
          part.enabled ? 'text-slate-800' : 'text-slate-500 line-through',
        ].join(' ')}
      >
        {part.text}
      </span>
    </div>
  )
}