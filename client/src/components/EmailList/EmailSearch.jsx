/**
 * Email Search component.
 * Search input for filtering emails by query.
 * Handles search input, clear functionality, and keyboard navigation.
 * 
 * @module components/EmailList/EmailSearch
 * @component
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {string} props.activeSearch - Active search query being applied
 * @param {Function} props.onSearchChange - Callback when search input changes
 * @param {Function} props.onSearch - Callback when search is executed
 * @param {Function} props.onClearSearch - Callback when search is cleared
 * @param {Function} props.onSearchKeyDown - Callback for keyboard events
 * @returns {JSX.Element} Email Search component
 */

import searchIcon from '../../assets/icons/search.png';
import './EmailList.css';

function EmailSearch({ 
  searchQuery, 
  activeSearch, 
  onSearchChange, 
  onSearch, 
  onClearSearch,
  onSearchKeyDown 
}) {
  return (
    <div className="search-bar" role="search" aria-label="Search emails">
      <img src={searchIcon} alt="" className="search-icon" aria-hidden="true" />
      <label htmlFor="email-search-input" className="sr-only">Search emails</label>
      <input 
        id="email-search-input"
        type="text" 
        placeholder="Search emails..." 
        className="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={onSearchKeyDown}
        aria-label="Search emails"
      />
      {(searchQuery || activeSearch) && (
        <button 
          className="search-clear"
          onClick={onClearSearch}
          title="Clear search"
          aria-label="Clear search query"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
      <button 
        className="search-btn"
        onClick={onSearch}
        disabled={!searchQuery.trim()}
        title="Search"
        aria-label="Search emails"
      >
        Search
      </button>
    </div>
  );
}

export default EmailSearch;
