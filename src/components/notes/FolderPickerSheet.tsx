import { useState, useRef } from 'react';
import { EmojiPicker, useEmojiPicker } from '@/components/ui/EmojiPicker';
import ReactDOM from 'react-dom';
import { FolderPlus, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor } from '@/types';
import { pastelColors } from '@/lib/colors';

interface FolderPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFolder?: string;
  onSelectFolder: (folder?: string) => void;
}

export function FolderPickerSheet({ isOpen, onClose, selectedFolder, onSelectFolder }: FolderPickerSheetProps) {
  const { folders, addFolder } = useAppStore();
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<PastelColor>('peony');
  const folderNameRef = useRef<HTMLInputElement>(null);
  const folderNamePicker = useEmojiPicker(folderNameRef, newFolderName, setNewFolderName);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), color: newFolderColor });
      onSelectFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      {/* Centering shell */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 9999, pointerEvents: 'none' }}
      >
        <div
          className="animate-in fade-in zoom-in-95 duration-150 bg-card rounded-2xl shadow-xl w-[280px] max-h-[60vh] overflow-y-auto"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {!showCreateFolder ? (
            <div className="py-2">
              {/* Header */}
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Folder
              </p>


              {/* Folders (root folders with subfolders indented beneath) */}
              {folders.filter(f => !f.parentId).flatMap((folder) => {
                const subfolders = folders.filter(f => f.parentId === folder.id);
                return [
                  <button
                    key={folder.id}
                    onClick={() => onSelectFolder(folder.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      selectedFolder === folder.name ? 'bg-primary/10' : 'hover:bg-secondary'
                    )}
                  >
                    <div className={cn('w-3 h-3 rounded-full', `bg-pastel-${folder.color}`)} />
                    <span className="flex-1 text-left text-sm font-medium text-foreground">{folder.name}</span>
                    {selectedFolder === folder.name && <Check className="w-4 h-4 text-primary" />}
                  </button>,
                  ...subfolders.map(subfolder => (
                    <button
                      key={subfolder.id}
                      onClick={() => onSelectFolder(subfolder.name)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 pl-8 transition-colors',
                        selectedFolder === subfolder.name ? 'bg-primary/10' : 'hover:bg-secondary'
                      )}
                    >
                      <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <div className={cn('w-2.5 h-2.5 rounded-full', `bg-pastel-${subfolder.color}`)} />
                      <span className="flex-1 text-left text-sm text-foreground">{subfolder.name}</span>
                      {selectedFolder === subfolder.name && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  )),
                ];
              })}

              {/* Create new */}
              <button
                onClick={() => setShowCreateFolder(true)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors border-t border-border"
              >
                <FolderPlus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">New folder</span>
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                New Folder
              </p>
              <input
                ref={folderNameRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground placeholder:text-muted-foreground"
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
                  onClick={() => setShowCreateFolder(false)}
                  className="flex-1 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <EmojiPicker {...folderNamePicker} />
    </>,
    document.body
  );
}
