import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Notebook, PastelColor } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface NotebookEditModalProps {
  notebook: Notebook;
  onClose: () => void;
}

const NOTEBOOK_COLORS: { hex: string; value: PastelColor }[] = [
  { hex: '#768E78', value: 'coral' },
  { hex: '#C6C09C', value: 'peach' },
  { hex: '#6398A9', value: 'amber' },
  { hex: '#D5E3E8', value: 'yellow' },
  { hex: '#FCAC83', value: 'mint' },
  { hex: '#FCC88A', value: 'teal' },
  { hex: '#E79897', value: 'sky' },
  { hex: '#F2C4CE', value: 'lavender' },
  { hex: '#9B7FA6', value: 'rose' },
  { hex: '#A89880', value: 'gray' },
  { hex: '#E0DCD1', value: 'stone' },
];

export function NotebookEditModal({ notebook, onClose }: NotebookEditModalProps) {
  const { updateNotebook, deleteNotebook, notebookPages } = useAppStore();
  const [name, setName] = useState(notebook.name);
  const [color, setColor] = useState<PastelColor>(notebook.color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pageCount = notebookPages.filter(p => p.notebookId === notebook.id).length;

  const handleSave = () => {
    if (name.trim()) {
      updateNotebook(notebook.id, { name: name.trim(), color });
      onClose();
    }
  };

  const handleDelete = () => {
    deleteNotebook(notebook.id);
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

      {/* Modal shell - centering only */}
      <div
        className="fixed z-[9999]"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 48px)', maxWidth: 400 }}
      >
        {/* Inner panel - animation + visuals */}
        <div className="bg-card rounded-[20px] shadow-xl p-6 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1E' }}>Edit Notebook</h3>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Name input */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Notebook name"
            style={{
              width: '100%',
              background: '#F5F3F0',
              borderRadius: 10,
              padding: 14,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: '#1C1C1E',
              marginBottom: 16,
            }}
          />

          {/* Color picker */}
          <div className="flex flex-wrap gap-2 mb-5" style={{ maxWidth: 280 }}>
            {NOTEBOOK_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className="relative flex items-center justify-center transition-all"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: c.hex,
                  boxShadow: color === c.value ? `0 0 0 2px #fff, 0 0 0 4px ${c.hex}` : 'none',
                }}
              >
                {color === c.value && (
                  <Check className="w-4 h-4" style={{ color: '#fff' }} />
                )}
              </button>
            ))}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              background: '#1C1C1E',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 12,
              padding: 16,
              border: 'none',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Save Changes
          </button>

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#FF3B30',
              fontWeight: 500,
              borderRadius: 12,
              padding: 12,
              border: 'none',
              fontSize: 15,
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            Delete Notebook
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
              <h4 style={{ fontWeight: 700, fontSize: 16, color: '#1C1C1E', marginBottom: 8 }}>
                Delete Notebook?
              </h4>
              <p style={{ fontSize: 14, color: '#8E8E93', marginBottom: 20, lineHeight: 1.4 }}>
                Are you sure you want to delete this notebook? This will permanently delete all {pageCount} {pageCount === 1 ? 'page' : 'pages'} inside it.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: 'none',
                    background: '#F2F2F7',
                    color: '#1C1C1E',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: 'none',
                    background: '#FF3B30',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
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
