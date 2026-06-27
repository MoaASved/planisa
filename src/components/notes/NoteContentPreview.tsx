import { cn } from '@/lib/utils';

interface NoteContentPreviewProps {
  content: string;
  className?: string;
}

function hasVisibleContent(html: string): boolean {
  if (!html || html.trim() === '') return false;
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return stripped.length > 0;
}

export function NoteContentPreview({ content, className }: NoteContentPreviewProps) {
  if (!hasVisibleContent(content)) return null;
  return (
    <div
      className={cn('note-card-preview', className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
