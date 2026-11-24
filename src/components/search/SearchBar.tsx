import { forwardRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ThemeMode } from '../../types/dashboard';

interface SearchBarProps {
  theme: ThemeMode;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ theme }, ref) {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      if (!query.trim()) {
        e.preventDefault();
      }
    };

    const isUpsideDown = theme === 'upside-down';

    return (
      <section aria-label="Google search" className="w-full">
        <form
          action="https://www.google.com/search"
          method="GET"
          target="_blank"
          rel="noopener noreferrer"
          onSubmit={handleSubmit}
          className="relative flex items-center rounded-xl border bg-[#15151C]/90 px-3.5 py-1.5 transition-all duration-200 backdrop-blur-md"
          style={{
            borderColor: focused
              ? 'var(--accent-highlight)'
              : isUpsideDown
                ? '#302027'
                : '#2A2B36',
            boxShadow: focused
              ? '0 0 28px -6px var(--accent-glow)'
              : '0 10px 30px -16px rgba(0, 0, 0, 0.8)',
          }}
        >
          <Search
            className="h-4 w-4 shrink-0 transition-colors"
            style={{
              color: focused ? 'var(--accent-highlight)' : '#85818A',
            }}
          />

          <input
            ref={ref}
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search Google... (press /)"
            aria-label="Search Google"
            autoComplete="off"
            className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-[#F4F0EF] placeholder-[#85818A]/75 focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="mr-1.5 rounded-md p-1 text-[#85818A] hover:text-[#F4F0EF] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            aria-label="Search on Google"
            className="rounded-lg px-4 py-2 text-xs font-medium tracking-wide text-[#F4F0EF] transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'var(--accent-crimson)' }}
          >
            Search
          </button>
        </form>
      </section>
    );
  }
);
