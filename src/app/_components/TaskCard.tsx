import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Task } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'
import { STATUS_STYLES } from './statusStyles'

type TaskCardProps = {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <li
      className={cn(
        'group/card relative overflow-hidden rounded-lg border bg-card py-3 pr-2 pl-4 text-card-foreground shadow-xs transition-shadow hover:shadow-md',
        'before:absolute before:inset-y-0 before:left-0 before:w-1',
        STATUS_STYLES[task.status].accent,
      )}
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 pt-0.5 font-medium break-words">{task.title}</h3>
        <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-focus-within/card:opacity-100 md:group-hover/card:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`「${task.title}」を編集`}
            title="編集"
            onClick={() => onEdit(task)}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`「${task.title}」を削除`}
            title="削除"
            onClick={() => onDelete(task)}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
      {task.description && (
        <p className="mt-1 pr-2 text-sm whitespace-pre-wrap break-words text-muted-foreground">
          {task.description}
        </p>
      )}
    </li>
  )
}
