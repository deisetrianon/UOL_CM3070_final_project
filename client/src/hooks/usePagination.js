/**
 * Custom hook for managing pagination state with page tokens.
 * Handles next/previous navigation and maintains page token history for backward navigation.
 * 
 * @module usePagination
 * @param {number} initialPage - The initial page number (default: 1)
 * @returns {Object} Pagination state and methods (currentPage, nextPageToken, goToNextPage, goToPrevPage, goToFirstPage, reset)
 */
import { useState, useCallback } from 'react';

export function usePagination(initialPage = 1) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [pageTokenHistory, setPageTokenHistory] = useState([]);

  const goToNextPage = useCallback((token) => {
    if (token) {
      setPageTokenHistory(prev => [...prev, nextPageToken]);
      setNextPageToken(token);
      setCurrentPage(prev => prev + 1);
    }
  }, [nextPageToken]);

  const goToPrevPage = useCallback(() => {
    if (pageTokenHistory.length > 0) {
      const prevToken = pageTokenHistory[pageTokenHistory.length - 1];
      setPageTokenHistory(prev => prev.slice(0, -1));
      setNextPageToken(prevToken);
      setCurrentPage(prev => prev - 1);
    }
  }, [pageTokenHistory]);

  const goToFirstPage = useCallback(() => {
    setPageTokenHistory([]);
    setCurrentPage(1);
    setNextPageToken(null);
  }, []);

  const reset = useCallback(() => {
    setPageTokenHistory([]);
    setCurrentPage(1);
    setNextPageToken(null);
  }, []);

  return {
    currentPage,
    nextPageToken,
    pageTokenHistory,
    setNextPageToken,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    reset,
  };
}
