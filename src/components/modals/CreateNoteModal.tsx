import { useState } from 'react';
import { X, Plus, Folder, Tag, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor } from '@/types';
import { pastelColors } from '@/lib/colors';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateNoteModal({ isOpen, onClose }: CreateNoteModalProps) {
  const { addNote, folders, addFolder } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folder, setFolder] = useState(folders[0]?.name || 'Personal');
  const [color, setColor] = useState<PastelColor>(folders[0]?.color || 'sky');
  const [date, setDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // New folder creation state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<PastelColor>('sky');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), color: newFolderColor });
      setFolder(newFolderName.trim());
      setColor(newFolderColor);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    addNote({
      title: title.trim(),
      content: content.trim(),
      folder,
      color,
      tags,
      isPinned: false,
      date: date ? new Date(date) : undefined,
    });

    // Reset form
    setTitle('');
    setContent('');
    setFolder(folders[0]?.name || 'Personal');
    setColor(folders[0]?.color || 'sky');
    setDate('');
    setTags([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up safe-bottom">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-foreground">New Note</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full text-lg font-medium bg-transparent border-0 outline-none placeholder:text-muted-foreground"
            autoFocus
          />

          {/* Folder */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Folder className="w-4 h-4" /> Folder
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFolder(f.name); setColor(f.color); }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                    folder === f.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  <div className={cn('w-3 h-3 rounded-full', `bg-pastel-${f.color}`)} />
                  {f.name}
                </button>
              ))}
              <button
                onClick={() => setShowNewFolder(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-primary hover:bg-muted transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>

            {/* New Folder Inline Form */}
            {showNewFolder && (
              <div className="mt-3 p-3 bg-secondary rounded-xl space-y-3 animate-fade-in">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="flow-input"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {pastelColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewFolderColor(c.value)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        c.class,
                        newFolderColor === c.value && 'ring-2 ring-offset-2 ring-primary'
                      )}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewFolder(false)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm bg-muted text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className="flex-1 px-3 py-2 rounded-xl text-sm bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date (optional)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flow-input"
            />
          </div>

          {/* Color Override */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Color (override)</label>
            <div className="flex flex-wrap gap-2">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    c.class,
                    color === c.value && 'ring-2 ring-offset-2 ring-primary'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Tags
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="flow-badge flow-badge-gray flex items-center gap-1">
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
              rows={6}
              className="flow-input resize-none"
            />
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
