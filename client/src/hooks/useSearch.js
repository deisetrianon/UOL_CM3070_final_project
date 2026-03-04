import { useState, useCallback, useMemo } from 'react';

export function useSearch(initialQuery = '', onSearchCallback = null) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeSearch, setActiveSearch] = useState('');

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    setActiveSearch(trimmedQuery);
    if (onSearchCallback) {
      onSearchCallback(trimmedQuery);
    }
  }, [searchQuery, onSearchCallback]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setActiveSearch('');
    if (onSearchCallback) {
      onSearchCallback('');
    }
  }, [onSearchCallback]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const isSearchActive = useMemo(() => {
    return activeSearch.length > 0;
  }, [activeSearch]);

  return {
    searchQuery,
    activeSearch,
    isSearchActive,
    setSearchQuery,
    handleSearch,
    handleClearSearch,
    handleSearchKeyDown,
  };
}
