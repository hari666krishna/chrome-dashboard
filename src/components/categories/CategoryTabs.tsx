import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  FolderPlus,
  Pencil,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { Bookmark, Category } from '../../types/dashboard';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface CategoryTabsProps {
  categories: Category[];
  bookmarks: Bookmark[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  onAddCategory: (name: string) => { ok: boolean; error?: string };
  onRenameCategory: (id: string, name: string) => { ok: boolean; error?: string };
  onDeleteCategory: (id: string) => void;
  onMoveCategory: (id: string, direction: -1 | 1) => void;
}

export function CategoryTabs({
  categories,
  bookmarks,
  activeCategoryId,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onMoveCategory,
}: CategoryTabsProps) {
  const [manageOpen, setManageOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    if (!manageOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteTarget) setManageOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [deleteTarget, manageOpen]);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const getCountForCategory = (catId: string) =>
    bookmarks.filter((b) => b.categoryId === catId).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onAddCategory(newCategoryName);
    if (!res.ok) {
      setAddError(res.error ?? 'Could not add category.');
      return;
    }
    setNewCategoryName('');
    setAddError(null);
  };

  const handleSaveRename = (id: string) => {
    const res = onRenameCategory(id, editDraft);
    if (!res.ok) {
      setEditError(res.error ?? 'Could not rename category.');
      return;
    }
    setEditingId(null);
    setEditError(null);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Bookmark categories"
          className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategoryId === 'all'}
            onClick={() => onSelectCategory('all')}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0"
            style={{
              borderColor:
                activeCategoryId === 'all' ? 'var(--accent-highlight)' : '#302027',
              backgroundColor:
                activeCategoryId === 'all' ? 'rgba(100, 19, 31, 0.35)' : '#101117',
              color: activeCategoryId === 'all' ? '#F4F0EF' : '#85818A',
            }}
          >
            <span>All</span>
            <span className="font-mono-tech text-[11px] opacity-75">
              {bookmarks.length}
            </span>
          </button>

          {sortedCategories.map((cat) => {
            const isSelected = activeCategoryId === cat.id;
            const count = getCountForCategory(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(cat.id)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0"
                style={{
                  borderColor: isSelected ? 'var(--accent-highlight)' : '#302027',
                  backgroundColor: isSelected ? 'rgba(100, 19, 31, 0.35)' : '#101117',
                  color: isSelected ? '#F4F0EF' : '#85818A',
                }}
              >
                <span>{cat.name}</span>
                <span className="font-mono-tech text-[11px] opacity-75">{count}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setManageOpen(true)}
          title="Manage groups"
          className="flex items-center gap-1.5 rounded-lg border border-[#302027] bg-[#101117] px-2.5 py-1.5 text-xs text-[#85818A] hover:border-[#85818A]/50 hover:text-[#F4F0EF] transition-colors whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Manage Groups</span>
        </button>
      </div>

      {/* Category Manager Modal */}
      {manageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-manager-title"
          onClick={() => setManageOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#302027] bg-[#15151C] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#302027] pb-4">
              <div>
                <h3
                  id="category-manager-title"
                  className="text-base font-semibold text-[#F4F0EF]"
                >
                  Manage Groups
                </h3>
                <p className="mt-0.5 text-xs text-[#85818A]">
                  Create, rename, reorder, or remove bookmark purpose groups.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                aria-label="Close category manager"
                className="rounded-lg p-1.5 text-[#85818A] hover:bg-[#101117] hover:text-[#F4F0EF]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Add new category */}
            <form onSubmit={handleAdd} className="mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={32}
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (addError) setAddError(null);
                  }}
                  placeholder="New group name (e.g. Study, AI Tools)..."
                  aria-label="New group name"
                  className="flex-1 rounded-lg border border-[#302027] bg-[#101117] px-3 py-2 text-sm text-[#F4F0EF] placeholder-[#85818A]/70 focus:outline-none focus:border-[#E63946]"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#F4F0EF] whitespace-nowrap shrink-0"
                  style={{ backgroundColor: 'var(--accent-crimson)' }}
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
              {addError && (
                <p className="mt-1.5 text-xs text-[#E63946]">{addError}</p>
              )}
            </form>

            {/* Existing category list */}
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {sortedCategories.map((cat, idx) => {
                const count = getCountForCategory(cat.id);
                const isEditing = editingId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#302027] bg-[#101117] px-3 py-2"
                  >
                    {isEditing ? (
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={32}
                            autoFocus
                            value={editDraft}
                            onChange={(e) => {
                              setEditDraft(e.target.value);
                              if (editError) setEditError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveRename(cat.id);
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                                setEditError(null);
                              }
                            }}
                            className="flex-1 rounded border border-[#302027] bg-[#15151C] px-2.5 py-1 text-sm text-[#F4F0EF] focus:outline-none focus:border-[#E63946]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(cat.id)}
                            className="rounded px-2.5 py-1 text-xs font-medium text-[#F4F0EF]"
                            style={{ backgroundColor: 'var(--accent-crimson)' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditError(null);
                            }}
                            className="rounded px-2 py-1 text-xs text-[#85818A] hover:text-[#F4F0EF]"
                          >
                            Cancel
                          </button>
                        </div>
                        {editError && (
                          <p className="text-xs text-[#E63946]">{editError}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="truncate text-sm font-medium text-[#F4F0EF]">
                            {cat.name}
                          </span>
                          <span className="font-mono-tech text-xs text-[#85818A]">
                            {count} {count === 1 ? 'link' : 'links'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onMoveCategory(cat.id, -1)}
                            title="Move up"
                            aria-label={`Move ${cat.name} up`}
                            className="rounded p-1.5 text-[#85818A] hover:bg-[#15151C] hover:text-[#F4F0EF] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sortedCategories.length - 1}
                            onClick={() => onMoveCategory(cat.id, 1)}
                            title="Move down"
                            aria-label={`Move ${cat.name} down`}
                            className="rounded p-1.5 text-[#85818A] hover:bg-[#15151C] hover:text-[#F4F0EF] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(cat.id);
                              setEditDraft(cat.name);
                              setEditError(null);
                            }}
                            title="Rename category"
                            aria-label={`Rename ${cat.name}`}
                            className="rounded p-1.5 text-[#85818A] hover:bg-[#15151C] hover:text-[#F4F0EF]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={sortedCategories.length <= 1}
                            onClick={() => setDeleteTarget(cat)}
                            title={
                              sortedCategories.length <= 1
                                ? 'At least one category is required'
                                : 'Delete category'
                            }
                            aria-label={`Delete ${cat.name}`}
                            className="rounded p-1.5 text-[#85818A] hover:bg-[#15151C] hover:text-[#E63946] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        message={
          deleteTarget
            ? getCountForCategory(deleteTarget.id) > 0
              ? `"${deleteTarget.name}" contains ${getCountForCategory(deleteTarget.id)} bookmark(s). Deleting it will reassign those bookmarks to "${sortedCategories.find((c) => c.id !== deleteTarget.id)?.name ?? 'another category'}".`
              : `Are you sure you want to delete the "${deleteTarget.name}" category?`
            : ''
        }
        confirmLabel="Delete Category"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteCategory(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
