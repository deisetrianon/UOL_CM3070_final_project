import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination());
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.nextPageToken).toBeNull();
    expect(result.current.pageTokenHistory).toEqual([]);
  });

  it('should initialize with custom page', () => {
    const { result } = renderHook(() => usePagination(3));
    
    expect(result.current.currentPage).toBe(3);
  });

  it('should go to next page with token', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.goToNextPage('token1');
    });
    
    expect(result.current.currentPage).toBe(2);
    expect(result.current.nextPageToken).toBe('token1');
    expect(result.current.pageTokenHistory).toEqual([null]);
  });

  it('should go to previous page', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.goToNextPage('token1');
    });
    
    expect(result.current.currentPage).toBe(2);
    expect(result.current.nextPageToken).toBe('token1');
    
    act(() => {
      result.current.goToNextPage('token2');
    });
    
    expect(result.current.currentPage).toBe(3);
    expect(result.current.nextPageToken).toBe('token2');
    
    act(() => {
      result.current.goToPrevPage();
    });
    
    expect(result.current.currentPage).toBe(2);
    expect(result.current.nextPageToken).toBe('token1');
    expect(result.current.pageTokenHistory).toHaveLength(1);
  });

  it('should not go to previous page if history is empty', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.goToPrevPage();
    });
    
    expect(result.current.currentPage).toBe(1);
  });

  it('should go to first page', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.goToNextPage('token1');
      result.current.goToNextPage('token2');
      result.current.goToFirstPage();
    });
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.nextPageToken).toBeNull();
    expect(result.current.pageTokenHistory).toEqual([]);
  });

  it('should reset pagination', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.goToNextPage('token1');
      result.current.reset();
    });
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.nextPageToken).toBeNull();
    expect(result.current.pageTokenHistory).toEqual([]);
  });

  it('should set next page token directly', () => {
    const { result } = renderHook(() => usePagination());
    
    act(() => {
      result.current.setNextPageToken('custom-token');
    });
    
    expect(result.current.nextPageToken).toBe('custom-token');
  });
});
