/**
 * Advanced Search Hooks and Utilities
 * Custom hooks for search functionality, filtering, and pagination
 */

import { useState, useEffect, useMemo, useCallback } from "react";

// Custom hook for managing search state
export const useAdvancedSearch = ({
  initialSearchValue = "",
  initialFilters = {},
  initialSortBy = "",
  initialSortOrder = "asc",
  searchFunction,
  debounceDelay = 300,
}) => {
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchFunction) {
        setLoading(true);
        try {
          const searchParams = {
            query: searchValue,
            filters,
            sortBy,
            sortOrder,
          };

          const response = await searchFunction(searchParams);
          setResults(response.results || []);
          setTotalCount(response.totalCount || 0);
          setSuggestions(response.suggestions || []);
        } catch (_error) {
          // console.error('Search error:', error);
          setResults([]);
          setTotalCount(0);
        } finally {
          setLoading(false);
        }
      }
    }, debounceDelay);

    return () => clearTimeout(timeoutId);
  }, [searchValue, filters, sortBy, sortOrder, searchFunction, debounceDelay]);

  const handleSearch = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchValue("");
    setFilters(initialFilters);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [initialFilters, initialSortBy, initialSortOrder]);

  return {
    searchValue,
    filters,
    sortBy,
    sortOrder,
    loading,
    results,
    totalCount,
    suggestions,
    handleSearch,
    handleFilterChange,
    handleSortChange,
    clearSearch,
  };
};

// Custom hook for pagination
export const usePagination = ({
  initialPage = 1,
  initialPageSize = 10,
  totalCount = 0,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize - 1, totalCount - 1);
  }, [startIndex, pageSize, totalCount]);

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Reset page when total count changes significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalCount,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
  };
};

// Search filter utilities
export const createSearchFilters = {
  // Create a text filter
  text: (key, label, placeholder = "") => ({
    key,
    label,
    type: "text",
    placeholder,
  }),

  // Create a select filter
  select: (key, label, options, multiple = false) => ({
    key,
    label,
    type: "select",
    options,
    multiple,
  }),

  // Create an autocomplete filter
  autocomplete: (key, label, options, multiple = false) => ({
    key,
    label,
    type: "autocomplete",
    options,
    multiple,
  }),

  // Create a checkbox filter
  checkbox: (key, label, options) => ({
    key,
    label,
    type: "checkbox",
    options,
    multiple: true,
  }),

  // Create a date filter
  date: (key, label) => ({
    key,
    label,
    type: "date",
  }),

  // Create a date range filter
  dateRange: (key, label) => ({
    key,
    label,
    type: "dateRange",
  }),

  // Create a quick filter (appears as chips)
  quickFilter: (key, label, options) => ({
    key,
    label,
    type: "select",
    options,
    multiple: true,
    quickFilter: true,
    quickFilterOptions: options,
  }),
};

// Search sort utilities
export const createSortOptions = {
  // Create basic sort option
  field: (value, label, defaultOrder = "asc") => ({
    value,
    label,
    defaultOrder,
  }),

  // Create multiple sort options for common fields
  common: () => [
    { value: "name", label: "Name", defaultOrder: "asc" },
    { value: "createdAt", label: "Date Created", defaultOrder: "desc" },
    { value: "updatedAt", label: "Last Modified", defaultOrder: "desc" },
    { value: "status", label: "Status", defaultOrder: "asc" },
  ],
};

// Search suggestion utilities
export const createSuggestions = {
  // Create search suggestions from data
  fromData: (data, fields = ["name", "title", "email"]) => {
    const suggestions = [];

    data.forEach((item) => {
      fields.forEach((field) => {
        if (item[field]) {
          suggestions.push({
            text: item[field],
            category: field,
            type: "data",
          });
        }
      });
    });

    // Remove duplicates and sort
    return [...new Set(suggestions.map((s) => s.text))]
      .map((text) => suggestions.find((s) => s.text === text))
      .sort((a, b) => a.text.localeCompare(b.text));
  },

  // Create filter-based suggestions
  fromFilters: (filters) => {
    const suggestions = [];

    filters.forEach((filter) => {
      if (filter.options) {
        filter.options.forEach((option) => {
          suggestions.push({
            text: option.label,
            category: filter.label,
            type: "filter",
            filters: { [filter.key]: option.value },
          });
        });
      }
    });

    return suggestions;
  },

  // Create recent search suggestions
  fromHistory: (searchHistory) => {
    return searchHistory
      .slice(-10) // Last 10 searches
      .reverse()
      .map((search) => ({
        text: search.query,
        category: "Recent",
        type: "history",
        filters: search.filters,
      }));
  },
};

// Advanced search utilities
export const searchUtils = {
  // Highlight search terms in text
  highlightText: (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  },

  // Extract search terms from query
  extractTerms: (query) => {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);
  },

  // Score search relevance
  calculateRelevance: (item, searchTerms, fields = []) => {
    let score = 0;

    searchTerms.forEach((term) => {
      fields.forEach((field) => {
        const value = item[field]?.toLowerCase() || "";
        if (value.includes(term)) {
          score += value.indexOf(term) === 0 ? 3 : 1; // Higher score for prefix matches
        }
      });
    });

    return score;
  },

  // Filter data based on search criteria
  filterData: (data, searchValue, filters, searchFields = []) => {
    let filteredData = [...data];

    // Apply text search
    if (searchValue && searchFields.length > 0) {
      const searchTerms = searchUtils.extractTerms(searchValue);
      filteredData = filteredData.filter((item) =>
        searchTerms.some((term) =>
          searchFields.some((field) =>
            item[field]?.toLowerCase().includes(term),
          ),
        ),
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : value !== "")) {
        filteredData = filteredData.filter((item) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return (
            item[key] === value ||
            (typeof item[key] === "string" &&
              item[key].toLowerCase().includes(value.toLowerCase()))
          );
        });
      }
    });

    return filteredData;
  },

  // Sort data
  sortData: (data, sortBy, sortOrder) => {
    if (!sortBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      let comparison = 0;

      if (aValue === null || aValue === undefined) comparison = 1;
      else if (bValue === null || bValue === undefined) comparison = -1;
      else if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });
  },

  // Paginate data
  paginateData: (data, currentPage, pageSize) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  },
};

// Complete search processing utility
export const processSearchData = ({
  data,
  searchValue,
  filters,
  sortBy,
  sortOrder,
  currentPage,
  pageSize,
  searchFields = ["name", "email", "title"],
}) => {
  // Filter data
  let processedData = searchUtils.filterData(
    data,
    searchValue,
    filters,
    searchFields,
  );

  // Sort data
  processedData = searchUtils.sortData(processedData, sortBy, sortOrder);

  // Get total count before pagination
  const totalCount = processedData.length;

  // Paginate data
  const paginatedData = searchUtils.paginateData(
    processedData,
    currentPage,
    pageSize,
  );

  return {
    results: paginatedData,
    totalCount,
    filteredCount: totalCount,
    originalCount: data.length,
  };
};

// Member-specific search configuration
export const memberSearchConfig = {
  filters: [
    createSearchFilters.text("name", "Name"),
    createSearchFilters.text("email", "Email"),
    createSearchFilters.select("role", "Role", [
      { value: "admin", label: "Administrator" },
      { value: "moderator", label: "Moderator" },
      { value: "member", label: "Member" },
    ]),
    createSearchFilters.quickFilter("status", "Status", [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "pending", label: "Pending" },
    ]),
    createSearchFilters.date("joinedAfter", "Joined After"),
    createSearchFilters.checkbox("permissions", "Permissions", [
      { value: "read", label: "Read" },
      { value: "write", label: "Write" },
      { value: "delete", label: "Delete" },
      { value: "admin", label: "Admin" },
    ]),
  ],
  sortOptions: [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "role", label: "Role" },
    { value: "joinedAt", label: "Join Date" },
    { value: "lastActive", label: "Last Active" },
  ],
  searchFields: ["name", "email", "phone"],
  defaultSort: { field: "name", order: "asc" },
};

// Invitation-specific search configuration
export const invitationSearchConfig = {
  filters: [
    createSearchFilters.text("email", "Email"),
    createSearchFilters.text("name", "Name"),
    createSearchFilters.quickFilter("status", "Status", [
      { value: "pending", label: "Pending" },
      { value: "accepted", label: "Accepted" },
      { value: "declined", label: "Declined" },
      { value: "expired", label: "Expired" },
    ]),
    createSearchFilters.select("role", "Role", [
      { value: "admin", label: "Administrator" },
      { value: "moderator", label: "Moderator" },
      { value: "member", label: "Member" },
    ]),
    createSearchFilters.date("sentAfter", "Sent After"),
    createSearchFilters.date("expiresBefore", "Expires Before"),
  ],
  sortOptions: [
    { value: "recipientEmail", label: "Email" },
    { value: "recipientName", label: "Name" },
    { value: "status", label: "Status" },
    { value: "sentAt", label: "Sent Date" },
    { value: "expiresAt", label: "Expiry Date" },
  ],
  searchFields: ["recipientEmail", "recipientName"],
  defaultSort: { field: "sentAt", order: "desc" },
};
