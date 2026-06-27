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

function normalizeContent(content: string): string {
  // Plain text (sticky notes store raw text, not TipTap HTML) — preserve line breaks
  if (!/<[a-zA-Z]/.test(content)) {
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped
      .split('\n')
      .map(line => `<p>${line || '&nbsp;'}</p>`)
      .join('');
  }
  return content;
}

export function NoteContentPreview({ content, className }: NoteContentPreviewProps) {
  if (!hasVisibleContent(content)) return null;
  return (
    <div
      className={cn('note-card-preview', className)}
      dangerouslySetInnerHTML={{ __html: normalizeContent(content) }}
    />
  );
}
