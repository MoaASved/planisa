import { useState } from 'react';
import { Folder, FolderPlus, X, Check } from 'lucide-react';
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
  const [newFolderColor, setNewFolderColor] = useState<PastelColor>('sky');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), color: newFolderColor });
      onSelectFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" 
        onClick={onClose} 
      />
      <div className="fixed inset-x-0 bottom-0 z-50 flow-bottom-sheet animate-slide-up max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Select Folder</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {!showCreateFolder ? (
          <div className="space-y-2">
            {/* No folder option */}
            <button
              onClick={() => onSelectFolder(undefined)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-colors',
                !selectedFolder ? 'bg-primary/10' : 'hover:bg-secondary'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Folder className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">No folder</span>
              {!selectedFolder && <Check className="w-5 h-5 text-primary" />}
            </button>

            {/* Existing folders */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.name)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-colors',
                  selectedFolder === folder.name ? 'bg-primary/10' : 'hover:bg-secondary'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', `bg-pastel-${folder.color}/20`)}>
                  <Folder className={cn('w-5 h-5', `text-pastel-${folder.color}`)} />
                </div>
                <span className="flex-1 text-left font-medium text-foreground">{folder.name}</span>
                {selectedFolder === folder.name && <Check className="w-5 h-5 text-primary" />}
              </button>
            ))}

            {/* Create new folder button */}
            <button
              onClick={() => setShowCreateFolder(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-primary" />
              </div>
              <span className="flex-1 text-left font-medium text-primary">Create new folder</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
                    'w-8 h-8 rounded-full transition-all',
                    c.class,
                    newFolderColor === c.value && 'ring-2 ring-offset-2 ring-primary'
                  )}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowCreateFolder(false)}
                className="flex-1 flow-button-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder}
                className="flex-1 flow-button-primary"
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
