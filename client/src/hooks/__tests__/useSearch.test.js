import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';

describe('useSearch', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.searchQuery).toBe('');
    expect(result.current.activeSearch).toBe('');
    expect(result.current.isSearchActive).toBe(false);
  });

  it('should initialize with custom query', () => {
    const { result } = renderHook(() => useSearch('initial query'));

    expect(result.current.searchQuery).toBe('initial query');
  });

  it('should update search query', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('new query');
    });

    expect(result.current.searchQuery).toBe('new query');
  });

  it('should execute search and set active search', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('test query');
    });

    act(() => {
      result.current.handleSearch();
    });

    expect(result.current.activeSearch).toBe('test query');
    expect(result.current.isSearchActive).toBe(true);
  });

  it('should trim search query before executing', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('  trimmed query  ');
    });

    act(() => {
      result.current.handleSearch();
    });

    expect(result.current.activeSearch).toBe('trimmed query');
  });

  it('should call callback on search', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSearch('', callback));

    act(() => {
      result.current.handleSearch();
    });

    expect(callback).toHaveBeenCalledWith('');
  });

  it('should clear search', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSearch('test', callback));

    act(() => {
      result.current.handleSearch();
      result.current.handleClearSearch();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.activeSearch).toBe('');
    expect(result.current.isSearchActive).toBe(false);
    expect(callback).toHaveBeenCalledWith('');
  });

  it('should handle Enter key press', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSearch('test', callback));

    act(() => {
      result.current.setSearchQuery('test query');
    });

    act(() => {
      result.current.handleSearchKeyDown({ key: 'Enter' });
    });

    expect(result.current.activeSearch).toBe('test query');
    expect(callback).toHaveBeenCalledWith('test query');
  });

  it('should not execute search on other keys', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useSearch('test', callback));

    act(() => {
      result.current.setSearchQuery('test query');
      result.current.handleSearchKeyDown({ key: 'Space' });
    });

    expect(result.current.activeSearch).toBe('');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should update isSearchActive when activeSearch changes', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.isSearchActive).toBe(false);

    act(() => {
      result.current.setSearchQuery('query');
    });

    act(() => {
      result.current.handleSearch();
    });

    expect(result.current.isSearchActive).toBe(true);
  });
});
