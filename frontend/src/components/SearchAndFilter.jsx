import React from 'react';

export default function SearchAndFilter({
  searchTerm,
  onSearchChange,
  filterActive,
  onFilterChange,
  totalCount,
  filteredCount
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="flex-1">
        <label htmlFor="search" className="sr-only">
          Search themes
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            name="search"
            id="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search themes..."
          />
        </div>
      </div>

      {/* Filter */}
      <div className="sm:w-48">
        <label htmlFor="filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="filter"
          name="filter"
          value={filterActive}
          onChange={(e) => onFilterChange(e.target.value)}
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Themes</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center text-sm text-gray-700">
        <span>
          {filteredCount === totalCount
            ? `Showing ${totalCount} theme${totalCount !== 1 ? 's' : ''}`
            : `Showing ${filteredCount} of ${totalCount} theme${totalCount !== 1 ? 's' : ''}`
          }
        </span>
      </div>
    </div>
  );
}
