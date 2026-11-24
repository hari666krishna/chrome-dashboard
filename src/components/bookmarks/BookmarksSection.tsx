import { useMemo, useState } from 'react';
import {
  FolderKanban,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Bookmark, BookmarkIconName, Category } from '../../types/dashboard';
import { extractDomain } from '../../utils/validation';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CategoryTabs } from '../categories/CategoryTabs';
import { BookmarkIconGlyph } from './BookmarkIconGlyph';
import { BookmarkModal } from './BookmarkModal';

interface BookmarksSectionProps {
  categories: Category[];
  bookmarks: Bookmark[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  onAddCategory: (name: string) => { ok: boolean; error?: string };
  onRenameCategory: (id: string, name: string) => { ok: boolean; error?: string };
  onDeleteCategory: (id: string) => void;
  onMoveCategory: (id: string, direction: -1 | 1) => void;
  onAutoGroup: () => void;
  onAddBookmark: (data: {
    title: string;
    url: string;
    categoryId: string;
    icon: BookmarkIconName;
  }) => { ok: boolean; error?: string };
  onUpdateBookmark: (
    id: string,
    data: {
      title: string;
      url: string;
      categoryId: string;
      icon: BookmarkIconName;
    }
  ) => { ok: boolean; error?: string };
  onDeleteBookmark: (id: string) => void;
  onReorderBookmark: (sourceId: string, targetId: string) => void;
  onMoveBookmarkStep: (id: string, direction: -1 | 1, visibleIds: string[]) => void;
}

function getSquareGroupClasses(itemCount: number): {
  boxSize: string;
  gridCols: string;
} {
  if (itemCount <= 1) {
    return {
      boxSize: 'w-[116px] h-[116px]',
      gridCols: 'grid-cols-1',
    };
  }
  if (itemCount <= 4) {
    return {
      boxSize: 'w-[140px] h-[140px]',
      gridCols: 'grid-cols-2',
    };
  }
  if (itemCount <= 9) {
    return {
      boxSize: 'w-[186px] h-[186px]',
      gridCols: 'grid-cols-3',
    };
  }
  return {
    boxSize: 'w-[232px] h-[232px]',
    gridCols: 'grid-cols-4',
  };
}

export function BookmarksSection({
  categories,
  bookmarks,
  activeCategoryId,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onMoveCategory,
  onAutoGroup,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onReorderBookmark,
}: BookmarksSectionProps) {
  const [filterText, setFilterText] = useState('');
  const [groupedView, setGroupedView] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultCategoryId, setModalDefaultCategoryId] =
    useState<string>(activeCategoryId);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bookmark | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const visibleBookmarks = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return [...bookmarks]
      .sort((a, b) => a.order - b.order)
      .filter((b) =>
        activeCategoryId === 'all' ? true : b.categoryId === activeCategoryId
      )
      .filter((b) =>
        q
          ? b.title.toLowerCase().includes(q) ||
            b.url.toLowerCase().includes(q)
          : true
      );
  }, [activeCategoryId, bookmarks, filterText]);

  const groupedSections = useMemo(() => {
    const groups: { category: Category; items: Bookmark[] }[] = [];
    for (const cat of sortedCategories) {
      const items = visibleBookmarks.filter((b) => b.categoryId === cat.id);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [sortedCategories, visibleBookmarks]);

  const openAdd = (targetCategoryId?: string) => {
    setEditingBookmark(null);
    setModalDefaultCategoryId(targetCategoryId ?? activeCategoryId);
    setModalOpen(true);
  };

  const openEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setModalDefaultCategoryId(bookmark.categoryId);
    setModalOpen(true);
  };

  const renderIconBox = (bookmark: Bookmark, sizeClass = 'h-10 w-10') => {
    const isDragging = draggedId === bookmark.id;
    const domain = extractDomain(bookmark.url);

    return (
      <div
        key={bookmark.id}
        draggable
        onDragStart={() => setDraggedId(bookmark.id)}
        onDragEnd={() => setDraggedId(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedId && draggedId !== bookmark.id) {
            onReorderBookmark(draggedId, bookmark.id);
          }
          setDraggedId(null);
        }}
        className={`group relative ${sizeClass} shrink-0 rounded-none border border-[#302027] bg-[#15151C] transition-all duration-150 hover:border-[#E63946]/80 hover:bg-[#1A1821] ${
          isDragging ? 'opacity-45 scale-95' : 'opacity-100'
        }`}
      >
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${bookmark.title} (${domain})`}
          aria-label={bookmark.title}
          className="flex h-full w-full items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]"
        >
          <BookmarkIconGlyph
            url={bookmark.url}
            title={bookmark.title}
            icon={bookmark.icon}
            className="h-5 w-5"
          />
        </a>

        {/* Compact hover edit/delete controls */}
        <div className="pointer-events-none absolute -right-1.5 -top-1.5 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openEdit(bookmark);
            }}
            title={`Edit ${bookmark.title}`}
            aria-label={`Edit ${bookmark.title}`}
            className="pointer-events-auto flex h-4 w-4 items-center justify-center rounded-none border border-[#302027] bg-[#101117] text-[#85818A] hover:text-[#F4F0EF] shadow"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteTarget(bookmark);
            }}
            title={`Delete ${bookmark.title}`}
            aria-label={`Delete ${bookmark.title}`}
            className="pointer-events-auto flex h-4 w-4 items-center justify-center rounded-none border border-[#302027] bg-[#101117] text-[#85818A] hover:text-[#E63946] shadow"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    );
  };

  const showGroupedSections = activeCategoryId === 'all' && groupedView;

  return (
    <section
      aria-label="Quick access bookmarks"
      className="flex flex-col rounded-xl border border-[#302027] bg-[#15151C]/85 p-4 sm:p-5"
    >
      {/* Compact Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="text-sm sm:text-base font-semibold tracking-wide text-[#F4F0EF]">
          Bookmarks
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#85818A]" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter..."
              aria-label="Filter bookmarks"
              className="w-28 sm:w-36 rounded-lg border border-[#302027] bg-[#101117] pl-8 pr-2.5 py-1.5 text-xs text-[#F4F0EF] placeholder-[#85818A]/70 focus:outline-none focus:border-[#E63946]"
            />
          </div>

          {activeCategoryId === 'all' && (
            <div
              role="group"
              aria-label="Bookmark layout mode"
              className="flex items-center rounded-lg border border-[#302027] bg-[#101117] p-0.5"
            >
              <button
                type="button"
                onClick={() => setGroupedView(true)}
                title="Grouped square boxes"
                aria-label="Grouped view"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: groupedView
                    ? 'rgba(100, 19, 31, 0.5)'
                    : 'transparent',
                  color: groupedView ? '#F4F0EF' : '#85818A',
                }}
              >
                <FolderKanban className="h-3 w-3" />
                <span className="hidden sm:inline">Groups</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupedView(false)}
                title="All icons grid"
                aria-label="Flat grid view"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: !groupedView
                    ? 'rgba(100, 19, 31, 0.5)'
                    : 'transparent',
                  color: !groupedView ? '#F4F0EF' : '#85818A',
                }}
              >
                <LayoutGrid className="h-3 w-3" />
                <span className="hidden sm:inline">Icons</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setGroupedView(true);
              onAutoGroup();
            }}
            title="Automatically create purpose groups and sort your bookmarks into them"
            className="flex items-center gap-1.5 rounded-lg border border-[#302027] bg-[#101117] px-2.5 py-1.5 text-xs font-medium text-[#F4F0EF] hover:border-[#E63946] transition-colors whitespace-nowrap shrink-0"
          >
            <Wand2 className="h-3.5 w-3.5" style={{ color: 'var(--accent-highlight)' }} />
            <span>Make Groups</span>
          </button>

          <button
            type="button"
            onClick={() => openAdd()}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[#F4F0EF] transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'var(--accent-crimson)' }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-3">
        <CategoryTabs
          categories={categories}
          bookmarks={bookmarks}
          activeCategoryId={activeCategoryId}
          onSelectCategory={onSelectCategory}
          onAddCategory={onAddCategory}
          onRenameCategory={onRenameCategory}
          onDeleteCategory={onDeleteCategory}
          onMoveCategory={onMoveCategory}
        />
      </div>

      {/* Square Group Boxes & Square Icon Tiles */}
      {visibleBookmarks.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-none border border-dashed border-[#302027] bg-[#101117]/60 px-6 py-8 text-center">
          <p className="text-sm font-medium text-[#F4F0EF]">
            {filterText.trim()
              ? 'No bookmarks match your filter'
              : 'No bookmarks in this group yet'}
          </p>
          <button
            type="button"
            onClick={filterText.trim() ? () => setFilterText('') : () => openAdd()}
            className="mt-3 rounded-none border border-[#302027] bg-[#15151C] px-3.5 py-1.5 text-xs font-medium text-[#F4F0EF] hover:border-[#E63946] transition-colors"
          >
            {filterText.trim() ? 'Clear Filter' : 'Add Bookmark'}
          </button>
        </div>
      ) : showGroupedSections ? (
        <div className="mt-4 flex flex-wrap items-start gap-3">
          {groupedSections.map(({ category, items }) => {
            const { boxSize, gridCols } = getSquareGroupClasses(items.length);
            return (
              <div
                key={category.id}
                className={`${boxSize} flex flex-col rounded-none border border-[#302027] bg-[#101117]/90 p-2.5 transition-all duration-200`}
              >
                <div className="flex items-center justify-between gap-1 pb-2">
                  <button
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    title={`${category.name} (${items.length})`}
                    className="min-w-0 truncate text-left group"
                  >
                    <h3 className="truncate text-[10px] font-semibold tracking-[0.12em] uppercase text-[#F4F0EF] group-hover:text-white">
                      {category.name}
                    </h3>
                  </button>

                  <button
                    type="button"
                    onClick={() => openAdd(category.id)}
                    title={`Add to ${category.name}`}
                    aria-label={`Add bookmark to ${category.name}`}
                    className="rounded-none p-0.5 text-[#85818A] hover:bg-[#15151C] hover:text-[#F4F0EF] transition-colors shrink-0"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className={`grid ${gridCols} gap-1.5 place-items-center flex-1 content-start`}>
                  {items.map((bookmark) => renderIconBox(bookmark, 'h-10 w-10'))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleBookmarks.map((bookmark) => renderIconBox(bookmark, 'h-12 w-12'))}
        </div>
      )}

      <BookmarkModal
        open={modalOpen}
        categories={categories}
        initialBookmark={editingBookmark}
        defaultCategoryId={modalDefaultCategoryId}
        onSave={(data) =>
          editingBookmark
            ? onUpdateBookmark(editingBookmark.id, data)
            : onAddBookmark(data)
        }
        onClose={() => {
          setModalOpen(false);
          setEditingBookmark(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Bookmark"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.title}" (${extractDomain(deleteTarget.url)}) from your bookmarks?`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteBookmark(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
