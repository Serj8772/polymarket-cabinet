/** Markets listing page — search, filter, browse prediction markets */

import { useState, useCallback } from "react";
import { useMarkets, useMarketSearch } from "@/hooks/useMarkets";
import { MarketSearch } from "@/components/features/Markets/MarketSearch";
import { MarketList } from "@/components/features/Markets/MarketList";

const CATEGORIES = ["All", "Politics", "Sports", "Crypto", "Science", "Culture"];

export function MarketsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>();
  const [showActive, setShowActive] = useState<boolean | undefined>(true);
  const pageSize = 24; // divisible by 2, 3, 4 — fits all breakpoints

  // Determine mode: search vs browse
  const isSearchMode = search.length >= 2;

  // Browse query
  const browseQuery = useMarkets({
    category,
    active: showActive,
    page,
    page_size: pageSize,
  });

  // Search query
  const searchQuery = useMarketSearch(search, page, pageSize);

  // Pick active data source
  const activeQuery = isSearchMode ? searchQuery : browseQuery;
  const { data, isLoading } = activeQuery;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on new search
  }, []);

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat === "All" ? undefined : cat);
    setPage(1);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Markets
        </h2>
        <div className="w-full sm:w-80">
          <MarketSearch value={search} onChange={handleSearchChange} />
        </div>
      </div>

      {/* Filters row */}
      {!isSearchMode && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive =
                cat === "All" ? !category : category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--accent-blue)] text-white"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Active/All toggle */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowActive(true)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                showActive === true
                  ? "bg-[var(--accent-green)] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowActive(undefined)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                showActive === undefined
                  ? "bg-[var(--accent-blue)] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              }`}
            >
              All
            </button>
          </div>
        </div>
      )}

      {/* Search indicator */}
      {isSearchMode && (
        <div className="mb-4 text-sm text-[var(--text-secondary)]">
          Search results for &quot;{search}&quot;
          {data && ` — ${data.total.toLocaleString()} found`}
        </div>
      )}

      {/* Market grid */}
      <MarketList
        markets={data?.markets}
        isLoading={isLoading}
        total={data?.total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
