import { useState } from 'react';
import { X } from 'lucide-react';
import { Folder, PastelColor } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { pastelColors } from '@/lib/colors';
import { cn } from '@/lib/utils';

interface FolderEditModalProps {
  folder: Folder;
  onClose: () => void;
}

export function FolderEditModal({ folder, onClose }: FolderEditModalProps) {
  const { updateFolder, deleteFolder, notes } = useAppStore();
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState<PastelColor>(folder.color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const noteCount = notes.filter(n => n.folder === folder.name).length;

  const handleSave = () => {
    if (name.trim()) {
      updateFolder(folder.id, { name: name.trim(), color });
      onClose();
    }
  };

  const handleDelete = () => {
    deleteFolder(folder.id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1100] animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-[9999]"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 48px)', maxWidth: 400 }}
      >
        <div className="bg-card rounded-[20px] shadow-xl p-6 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="flow-modal-title">Edit Folder</h3>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Name input */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="flow-input mb-4 w-full"
          />

          {/* Color picker */}
          <div className="flex flex-wrap gap-2 mb-5">
            {pastelColors.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={cn('w-9 h-9 rounded-full transition-all active:scale-95', c.class, color === c.value && 'ring-2 ring-offset-2 ring-primary')}
              />
            ))}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full flow-button-primary"
            style={{ borderRadius: 12, padding: 16, fontSize: 15 }}
          >
            Save Changes
          </button>

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              width: '100%',
              background: 'transparent',
              color: 'hsl(var(--destructive))',
              fontWeight: 500,
              borderRadius: 12,
              padding: 12,
              border: 'none',
              fontSize: 15,
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            Delete Folder
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-[10000]"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div
            className="fixed z-[10001]"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 64px)', maxWidth: 320 }}
          >
            <div className="bg-card rounded-[16px] shadow-xl p-5 animate-scale-in text-center">
              <h4 className="font-bold text-base text-foreground mb-2">
                Delete Folder?
              </h4>
              <p className="text-sm text-muted-foreground mb-5" style={{ lineHeight: 1.4 }}>
                Are you sure? {noteCount > 0 ? `${noteCount} ${noteCount === 1 ? 'note' : 'notes'} in this folder will become unassigned.` : 'This folder is empty.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-[10px] bg-secondary font-semibold text-[15px] text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-[10px] bg-destructive text-destructive-foreground font-semibold text-[15px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
