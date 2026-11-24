import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Bookmark, BookmarkIconName, Category } from '../../types/dashboard';
import { detectPurposeGroupName } from '../../utils/categorizer';

interface BookmarkModalProps {
  open: boolean;
  categories: Category[];
  initialBookmark: Bookmark | null;
  defaultCategoryId: string;
  onSave: (data: {
    title: string;
    url: string;
    categoryId: string;
    icon: BookmarkIconName;
  }) => { ok: boolean; error?: string };
  onClose: () => void;
}

export function BookmarkModal({
  open,
  categories,
  initialBookmark,
  defaultCategoryId,
  onSave,
  onClose,
}: BookmarkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialBookmark) {
      setTitle(initialBookmark.title);
      setUrl(initialBookmark.url);
      setCategoryId(initialBookmark.categoryId);
      setCategoryTouched(true);
    } else {
      setTitle('');
      setUrl('');
      setCategoryId(
        defaultCategoryId !== 'all'
          ? defaultCategoryId
          : categories[0]?.id ?? 'cat-google'
      );
      setCategoryTouched(defaultCategoryId !== 'all');
    }
    setError(null);
  }, [categories, defaultCategoryId, initialBookmark, open]);

  const detectedSuggestion = useMemo(() => {
    if (!url.trim() && !title.trim()) return null;
    const detectedName = detectPurposeGroupName(url, title);
    return (
      categories.find(
        (c) => c.name.trim().toLowerCase() === detectedName.toLowerCase()
      ) ?? null
    );
  }, [categories, title, url]);

  useEffect(() => {
    if (!open || initialBookmark || categoryTouched || !detectedSuggestion) return;
    setCategoryId(detectedSuggestion.id);
  }, [categoryTouched, detectedSuggestion, initialBookmark, open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, open]);

  if (!open) return null;

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onSave({
      title,
      url,
      categoryId,
      icon: initialBookmark?.icon ?? 'auto',
    });
    if (!res.ok) {
      setError(res.error ?? 'Please check bookmark details.');
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookmark-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#302027] bg-[#15151C] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#302027] pb-4">
          <h3 id="bookmark-modal-title" className="text-base font-semibold text-[#F4F0EF]">
            {initialBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bookmark modal"
            className="rounded-lg p-1.5 text-[#85818A] hover:bg-[#101117] hover:text-[#F4F0EF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="bm-title" className="block text-xs text-[#85818A] mb-1.5">
              Website Title
            </label>
            <input
              id="bm-title"
              type="text"
              maxLength={48}
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Gmail, GitHub, Claude, LeetCode"
              className="w-full rounded-lg border border-[#302027] bg-[#101117] px-3 py-2 text-sm text-[#F4F0EF] placeholder-[#85818A]/70 focus:outline-none focus:border-[#E63946]"
            />
          </div>

          <div>
            <label htmlFor="bm-url" className="block text-xs text-[#85818A] mb-1.5">
              Website URL
            </label>
            <input
              id="bm-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://claude.ai"
              className="w-full rounded-lg border border-[#302027] bg-[#101117] px-3 py-2 text-sm font-mono-tech text-[#F4F0EF] placeholder-[#85818A]/70 focus:outline-none focus:border-[#E63946]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="bm-category" className="block text-xs text-[#85818A]">
                Purpose Group
              </label>
              {detectedSuggestion && detectedSuggestion.id !== categoryId && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId(detectedSuggestion.id);
                    setCategoryTouched(true);
                  }}
                  className="flex items-center gap-1 text-[11px] hover:underline"
                  style={{ color: 'var(--accent-highlight)' }}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Use {detectedSuggestion.name}</span>
                </button>
              )}
            </div>
            <select
              id="bm-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setCategoryTouched(true);
              }}
              className="w-full rounded-lg border border-[#302027] bg-[#101117] px-3 py-2 text-sm text-[#F4F0EF] focus:outline-none focus:border-[#E63946]"
            >
              {sortedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-[#E63946]">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#302027] bg-[#101117] px-4 py-2 text-xs font-medium text-[#85818A] hover:text-[#F4F0EF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-xs font-medium text-[#F4F0EF]"
              style={{ backgroundColor: 'var(--accent-crimson)' }}
            >
              {initialBookmark ? 'Save Changes' : 'Add Bookmark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
