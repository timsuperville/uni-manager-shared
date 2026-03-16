/**
 * Advanced Search Hooks and Utilities
 * Custom hooks for search functionality, filtering, and pagination
 */

import { useState, useEffect, useMemo, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SortOrder = "asc" | "desc";

export interface FilterOption {
  value: string;
  label: string;
}

export type FilterType =
  | "text"
  | "select"
  | "autocomplete"
  | "checkbox"
  | "date"
  | "dateRange";

export interface SearchFilter {
  key: string;
  label: string;
  type: FilterType;
  placeholder?: string;
  options?: FilterOption[];
  multiple?: boolean;
  quickFilter?: boolean;
  quickFilterOptions?: FilterOption[];
}

export interface SortOption {
  value: string;
  label: string;
  defaultOrder?: SortOrder;
}

export interface SearchParams {
  query: string;
  filters: Record<string, unknown>;
  sortBy: string;
  sortOrder: SortOrder;
}

export interface SearchResponse<T = unknown> {
  results: T[];
  totalCount: number;
  suggestions?: SuggestionItem[];
}

export interface SuggestionItem {
  text: string;
  category: string;
  type: "data" | "filter" | "history";
  filters?: Record<string, unknown>;
}

export interface UseAdvancedSearchOptions<T = unknown> {
  initialSearchValue?: string;
  initialFilters?: Record<string, unknown>;
  initialSortBy?: string;
  initialSortOrder?: SortOrder;
  searchFunction?: (params: SearchParams) => Promise<SearchResponse<T>>;
  debounceDelay?: number;
}

export interface UseAdvancedSearchResult<T = unknown> {
  searchValue: string;
  filters: Record<string, unknown>;
  sortBy: string;
  sortOrder: SortOrder;
  loading: boolean;
  results: T[];
  totalCount: number;
  suggestions: SuggestionItem[];
  handleSearch: (value: string) => void;
  handleFilterChange: (newFilters: Record<string, unknown>) => void;
  handleSortChange: (field: string, order: SortOrder) => void;
  clearSearch: () => void;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalCount?: number;
}

export interface UsePaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  changePageSize: (size: number) => void;
}

export interface ProcessSearchDataOptions<T = unknown> {
  data: T[];
  searchValue: string;
  filters: Record<string, unknown>;
  sortBy: string;
  sortOrder: SortOrder;
  currentPage: number;
  pageSize: number;
  searchFields?: string[];
}

export interface ProcessSearchDataResult<T = unknown> {
  results: T[];
  totalCount: number;
  filteredCount: number;
  originalCount: number;
}

// ---------------------------------------------------------------------------
// useAdvancedSearch
// ---------------------------------------------------------------------------

export function useAdvancedSearch<T = unknown>({
  initialSearchValue = "",
  initialFilters = {},
  initialSortBy = "",
  initialSortOrder = "asc",
  searchFunction,
  debounceDelay = 300,
}: UseAdvancedSearchOptions<T>): UseAdvancedSearchResult<T> {
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [filters, setFilters] =
    useState<Record<string, unknown>>(initialFilters);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!searchFunction) return;
      setLoading(true);
      try {
        const response = await searchFunction({
          query: searchValue,
          filters,
          sortBy,
          sortOrder,
        });
        setResults(response.results ?? []);
        setTotalCount(response.totalCount ?? 0);
        setSuggestions(response.suggestions ?? []);
      } catch {
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }, debounceDelay);

    return () => clearTimeout(timeoutId);
  }, [searchValue, filters, sortBy, sortOrder, searchFunction, debounceDelay]);

  const handleSearch = useCallback((value: string): void => {
    setSearchValue(value);
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: Record<string, unknown>): void => {
      setFilters(newFilters);
    },
    [],
  );

  const handleSortChange = useCallback(
    (field: string, order: SortOrder): void => {
      setSortBy(field);
      setSortOrder(order);
    },
    [],
  );

  const clearSearch = useCallback((): void => {
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
}

// ---------------------------------------------------------------------------
// usePagination
// ---------------------------------------------------------------------------

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalCount = 0,
}: UsePaginationOptions): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [totalCount, pageSize],
  );
  const startIndex = useMemo(
    () => (currentPage - 1) * pageSize,
    [currentPage, pageSize],
  );
  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize - 1, totalCount - 1),
    [startIndex, pageSize, totalCount],
  );

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = useCallback(
    (page: number): void => {
      if (page >= 1 && page <= totalPages) setCurrentPage(page);
    },
    [totalPages],
  );

  const nextPage = useCallback((): void => {
    if (hasNextPage) setCurrentPage((prev) => prev + 1);
  }, [hasNextPage]);

  const previousPage = useCallback((): void => {
    if (hasPreviousPage) setCurrentPage((prev) => prev - 1);
  }, [hasPreviousPage]);

  const changePageSize = useCallback((newPageSize: number): void => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

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
}

// ---------------------------------------------------------------------------
// createSearchFilters
// ---------------------------------------------------------------------------

export const createSearchFilters = {
  text: (key: string, label: string, placeholder = ""): SearchFilter => ({
    key,
    label,
    type: "text",
    placeholder,
  }),
  select: (
    key: string,
    label: string,
    options: FilterOption[],
    multiple = false,
  ): SearchFilter => ({
    key,
    label,
    type: "select",
    options,
    multiple,
  }),
  autocomplete: (
    key: string,
    label: string,
    options: FilterOption[],
    multiple = false,
  ): SearchFilter => ({
    key,
    label,
    type: "autocomplete",
    options,
    multiple,
  }),
  checkbox: (
    key: string,
    label: string,
    options: FilterOption[],
  ): SearchFilter => ({
    key,
    label,
    type: "checkbox",
    options,
    multiple: true,
  }),
  date: (key: string, label: string): SearchFilter => ({
    key,
    label,
    type: "date",
  }),
  dateRange: (key: string, label: string): SearchFilter => ({
    key,
    label,
    type: "dateRange",
  }),
  quickFilter: (
    key: string,
    label: string,
    options: FilterOption[],
  ): SearchFilter => ({
    key,
    label,
    type: "select",
    options,
    multiple: true,
    quickFilter: true,
    quickFilterOptions: options,
  }),
};

// ---------------------------------------------------------------------------
// createSortOptions
// ---------------------------------------------------------------------------

export const createSortOptions = {
  field: (
    value: string,
    label: string,
    defaultOrder: SortOrder = "asc",
  ): SortOption => ({
    value,
    label,
    defaultOrder,
  }),
  common: (): SortOption[] => [
    { value: "name", label: "Name", defaultOrder: "asc" },
    { value: "createdAt", label: "Date Created", defaultOrder: "desc" },
    { value: "updatedAt", label: "Last Modified", defaultOrder: "desc" },
    { value: "status", label: "Status", defaultOrder: "asc" },
  ],
};

// ---------------------------------------------------------------------------
// createSuggestions
// ---------------------------------------------------------------------------

export const createSuggestions = {
  fromData: (
    data: Record<string, unknown>[],
    fields: string[] = ["name", "title", "email"],
  ): SuggestionItem[] => {
    const suggestions: SuggestionItem[] = [];

    data.forEach((item) => {
      fields.forEach((field) => {
        if (item[field] && typeof item[field] === "string") {
          suggestions.push({
            text: item[field] as string,
            category: field,
            type: "data",
          });
        }
      });
    });

    return [...new Set(suggestions.map((s) => s.text))]
      .map((text) => suggestions.find((s) => s.text === text)!)
      .sort((a, b) => a.text.localeCompare(b.text));
  },

  fromFilters: (filters: SearchFilter[]): SuggestionItem[] => {
    const suggestions: SuggestionItem[] = [];
    filters.forEach((filter) => {
      filter.options?.forEach((option) => {
        suggestions.push({
          text: option.label,
          category: filter.label,
          type: "filter",
          filters: { [filter.key]: option.value },
        });
      });
    });
    return suggestions;
  },

  fromHistory: (
    searchHistory: Array<{ query: string; filters?: Record<string, unknown> }>,
  ): SuggestionItem[] => {
    return searchHistory
      .slice(-10)
      .reverse()
      .map((search) => ({
        text: search.query,
        category: "Recent",
        type: "history" as const,
        filters: search.filters,
      }));
  },
};

// ---------------------------------------------------------------------------
// searchUtils
// ---------------------------------------------------------------------------

export const searchUtils = {
  highlightText: (text: string, searchTerm: string): string => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  },

  extractTerms: (query: string): string[] => {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);
  },

  calculateRelevance: (
    item: Record<string, unknown>,
    searchTerms: string[],
    fields: string[] = [],
  ): number => {
    let score = 0;
    searchTerms.forEach((term) => {
      fields.forEach((field) => {
        const value =
          typeof item[field] === "string"
            ? (item[field] as string).toLowerCase()
            : "";
        if (value.includes(term)) {
          score += value.indexOf(term) === 0 ? 3 : 1;
        }
      });
    });
    return score;
  },

  filterData: <T extends Record<string, unknown>>(
    data: T[],
    searchValue: string,
    filters: Record<string, unknown>,
    searchFields: string[] = [],
  ): T[] => {
    let filteredData = [...data];

    if (searchValue && searchFields.length > 0) {
      const searchTerms = searchUtils.extractTerms(searchValue);
      filteredData = filteredData.filter((item) =>
        searchTerms.some((term) =>
          searchFields.some(
            (field) =>
              typeof item[field] === "string" &&
              (item[field] as string).toLowerCase().includes(term),
          ),
        ),
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : value !== "")) {
        filteredData = filteredData.filter((item) => {
          if (Array.isArray(value)) return value.includes(item[key]);
          return (
            item[key] === value ||
            (typeof item[key] === "string" &&
              (item[key] as string)
                .toLowerCase()
                .includes((value as string).toLowerCase()))
          );
        });
      }
    });

    return filteredData;
  },

  sortData: <T extends Record<string, unknown>>(
    data: T[],
    sortBy: string,
    sortOrder: SortOrder,
  ): T[] => {
    if (!sortBy) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      let comparison = 0;

      if (aValue == null) comparison = 1;
      else if (bValue == null) comparison = -1;
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

  paginateData: <T>(data: T[], currentPage: number, pageSize: number): T[] => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  },
};

// ---------------------------------------------------------------------------
// processSearchData
// ---------------------------------------------------------------------------

export function processSearchData<T extends Record<string, unknown>>({
  data,
  searchValue,
  filters,
  sortBy,
  sortOrder,
  currentPage,
  pageSize,
  searchFields = ["name", "email", "title"],
}: ProcessSearchDataOptions<T>): ProcessSearchDataResult<T> {
  let processedData = searchUtils.filterData(
    data,
    searchValue,
    filters,
    searchFields,
  );
  processedData = searchUtils.sortData(processedData, sortBy, sortOrder);
  const totalCount = processedData.length;
  const results = searchUtils.paginateData(
    processedData,
    currentPage,
    pageSize,
  );

  return {
    results,
    totalCount,
    filteredCount: totalCount,
    originalCount: data.length,
  };
}

// ---------------------------------------------------------------------------
// Search configurations
// ---------------------------------------------------------------------------

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
  ] as SearchFilter[],
  sortOptions: [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "role", label: "Role" },
    { value: "joinedAt", label: "Join Date" },
    { value: "lastActive", label: "Last Active" },
  ] as SortOption[],
  searchFields: ["name", "email", "phone"] as string[],
  defaultSort: { field: "name", order: "asc" as SortOrder },
};

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
  ] as SearchFilter[],
  sortOptions: [
    { value: "recipientEmail", label: "Email" },
    { value: "recipientName", label: "Name" },
    { value: "status", label: "Status" },
    { value: "sentAt", label: "Sent Date" },
    { value: "expiresAt", label: "Expiry Date" },
  ] as SortOption[],
  searchFields: ["recipientEmail", "recipientName"] as string[],
  defaultSort: { field: "sentAt", order: "desc" as SortOrder },
};
