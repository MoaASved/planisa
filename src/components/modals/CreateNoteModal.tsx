import { useState } from 'react';
import { X, Folder, Tag, Calendar, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateNoteModal({ isOpen, onClose }: CreateNoteModalProps) {
  const { addNote, folders } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState(folders[0]?.name || 'Personal');
  const [date, setDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
    // Placeholder for audio recording functionality
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    addNote({
      title: title.trim(),
      content: content.trim(),
      folder,
      tags,
      isPinned: false,
      date: date ? new Date(date) : undefined,
    });

    // Reset form
    setTitle('');
    setContent('');
    setFolder(folders[0]?.name || 'Personal');
    setDate('');
    setTags([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">New Note</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="w-full text-lg font-medium bg-transparent border-0 outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Folder & Date */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Folder className="w-4 h-4" /> Folder
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none appearance-none cursor-pointer"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date (optional)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Tags
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span 
                  key={tag} 
                  className="flow-badge flow-badge-primary flex items-center gap-1"
                >
                  #{tag}
                  <button onClick={() => setTags(tags.filter(t => t !== tag))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                className="bg-transparent outline-none text-sm min-w-[100px]"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
              rows={8}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none resize-none"
            />
          </div>

          {/* Audio Recording Placeholder */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleRecordToggle}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300',
                isRecording 
                  ? 'bg-destructive text-destructive-foreground animate-pulse-soft'
                  : 'bg-secondary text-muted-foreground hover:bg-muted'
              )}
            >
              <Mic className="w-5 h-5" />
              <span className="text-sm font-medium">
                {isRecording ? 'Recording...' : 'Record Audio'}
              </span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full flow-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Note
          </button>
        </div>
      </div>
    </div>
  );
}