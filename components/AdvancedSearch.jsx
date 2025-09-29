/**
 * Advanced Search and Filtering System
 * Comprehensive search functionality with filters, sorting, and pagination
 */

import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Divider,
  Paper,
  Collapse,
  Badge,
  Autocomplete,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useResponsive } from "../utils/responsiveUtils";

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Search Input Component
const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  suggestions = [],
  onSuggestionSelect,
  showSuggestions = false,
}) => {
  const { isMobile } = useResponsive();

  return (
    <Box sx={{ position: "relative", mb: 2 }}>
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        variant="outlined"
        size={isMobile ? "medium" : "small"}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onClear} sx={{ p: 0.5 }}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            fontSize: isMobile ? "16px" : "14px", // Prevent zoom on iOS
            "& input": {
              padding: isMobile ? "12px 0" : "8px 0",
            },
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "background.paper",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          },
        }}
      />

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Paper
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 200,
            overflow: "auto",
            mt: 0.5,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <MenuItem
              key={index}
              onClick={() => onSuggestionSelect(suggestion)}
              sx={{
                fontSize: isMobile ? "16px" : "14px",
                py: isMobile ? 1.5 : 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SearchIcon fontSize="small" color="action" />
                <Typography variant="body2">{suggestion.text}</Typography>
                {suggestion.category && (
                  <Chip
                    label={suggestion.category}
                    size="small"
                    variant="outlined"
                    sx={{ ml: "auto" }}
                  />
                )}
              </Box>
            </MenuItem>
          ))}
        </Paper>
      )}
    </Box>
  );
};

// Filter Panel Component
const FilterPanel = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  open,
  onToggle,
}) => {
  const { isMobile } = useResponsive();

  const activeFilterCount = Object.keys(activeFilters).filter(
    (key) =>
      activeFilters[key] &&
      (Array.isArray(activeFilters[key])
        ? activeFilters[key].length > 0
        : activeFilters[key] !== ""),
  ).length;

  return (
    <Box sx={{ mb: 2 }}>
      {/* Filter Toggle Button */}
      <Button
        startIcon={<FilterIcon />}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        onClick={onToggle}
        variant="outlined"
        size={isMobile ? "medium" : "small"}
        sx={{
          mb: 1,
          borderRadius: 2,
        }}
      >
        <Badge badgeContent={activeFilterCount} color="primary">
          <Typography variant="body2">Filters</Typography>
        </Badge>
      </Button>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
            {Object.entries(activeFilters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0))
                return null;

              const filter = filters.find((f) => f.key === key);
              const displayValue = Array.isArray(value)
                ? value.join(", ")
                : value;

              return (
                <Chip
                  key={key}
                  label={`${filter?.label || key}: ${displayValue}`}
                  size="small"
                  onDelete={() =>
                    onFilterChange(key, Array.isArray(value) ? [] : "")
                  }
                  sx={{
                    fontSize: isMobile ? "12px" : "11px",
                    height: isMobile ? 28 : 24,
                  }}
                />
              );
            })}
          </Box>

          <Button
            size="small"
            onClick={onClearFilters}
            startIcon={<ClearIcon />}
            sx={{ fontSize: "12px" }}
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* Filter Controls */}
      <Collapse in={open}>
        <Paper sx={{ p: 2, mt: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 2,
            }}
          >
            {filters.map((filter) => (
              <FilterControl
                key={filter.key}
                filter={filter}
                value={activeFilters[filter.key]}
                onChange={(value) => onFilterChange(filter.key, value)}
              />
            ))}
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

// Individual Filter Control Component
const FilterControl = ({ filter, value, onChange }) => {
  const { isMobile } = useResponsive();

  switch (filter.type) {
    case "select":
      return (
        <FormControl fullWidth size={isMobile ? "medium" : "small"}>
          <InputLabel>{filter.label}</InputLabel>
          <Select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            label={filter.label}
            multiple={filter.multiple}
            sx={{
              fontSize: isMobile ? "16px" : "14px",
            }}
          >
            {filter.options.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  fontSize: isMobile ? "16px" : "14px",
                  minHeight: isMobile ? 48 : 36,
                }}
              >
                {filter.multiple && (
                  <Checkbox
                    checked={
                      Array.isArray(value) && value.includes(option.value)
                    }
                    sx={{ mr: 1 }}
                  />
                )}
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );

    case "autocomplete":
      return (
        <Autocomplete
          options={filter.options}
          getOptionLabel={(option) => option.label || option}
          value={value || (filter.multiple ? [] : null)}
          onChange={(_, newValue) => onChange(newValue)}
          multiple={filter.multiple}
          renderInput={(params) => (
            <TextField
              {...params}
              label={filter.label}
              size={isMobile ? "medium" : "small"}
              sx={{
                "& input": {
                  fontSize: isMobile ? "16px" : "14px",
                },
              }}
            />
          )}
          sx={{
            "& .MuiAutocomplete-listbox": {
              "& .MuiAutocomplete-option": {
                fontSize: isMobile ? "16px" : "14px",
                minHeight: isMobile ? 48 : 36,
              },
            },
          }}
        />
      );

    case "checkbox":
      return (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {filter.label}
          </Typography>
          {filter.options.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    const newValue = e.target.checked
                      ? [...currentValue, option.value]
                      : currentValue.filter((v) => v !== option.value);
                    onChange(newValue);
                  }}
                  sx={{
                    minWidth: isMobile ? 42 : 36,
                    minHeight: isMobile ? 42 : 36,
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: isMobile ? "14px" : "13px" }}>
                  {option.label}
                </Typography>
              }
              sx={{ display: "block", mb: 0.5 }}
            />
          ))}
        </Box>
      );

    case "text":
      return (
        <TextField
          fullWidth
          label={filter.label}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          size={isMobile ? "medium" : "small"}
          InputProps={{
            sx: {
              fontSize: isMobile ? "16px" : "14px",
            },
          }}
        />
      );

    case "date":
      return (
        <TextField
          fullWidth
          label={filter.label}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          size={isMobile ? "medium" : "small"}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: {
              fontSize: isMobile ? "16px" : "14px",
            },
          }}
        />
      );

    default:
      return null;
  }
};

// Sort Control Component
const SortControl = ({ sortOptions, sortBy, sortOrder, onSortChange }) => {
  const { isMobile } = useResponsive();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleSortMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSortSelect = (field, order) => {
    onSortChange(field, order);
    handleSortMenuClose();
  };

  const currentSort = sortOptions.find((option) => option.value === sortBy);

  return (
    <>
      <Button
        startIcon={<SortIcon />}
        onClick={handleSortMenuOpen}
        variant="outlined"
        size={isMobile ? "medium" : "small"}
        sx={{
          borderRadius: 2,
          textTransform: "none",
        }}
      >
        <Typography variant="body2">
          {currentSort
            ? `${currentSort.label} (${sortOrder === "asc" ? "↑" : "↓"})`
            : "Sort"}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSortMenuClose}
        PaperProps={{
          sx: { minWidth: 200 },
        }}
      >
        {sortOptions.map((option) => (
          <Box key={option.value}>
            <MenuItem
              onClick={() => handleSortSelect(option.value, "asc")}
              selected={sortBy === option.value && sortOrder === "asc"}
              sx={{
                fontSize: isMobile ? "16px" : "14px",
                minHeight: isMobile ? 48 : 36,
              }}
            >
              {option.label} ↑
            </MenuItem>
            <MenuItem
              onClick={() => handleSortSelect(option.value, "desc")}
              selected={sortBy === option.value && sortOrder === "desc"}
              sx={{
                fontSize: isMobile ? "16px" : "14px",
                minHeight: isMobile ? 48 : 36,
              }}
            >
              {option.label} ↓
            </MenuItem>
            <Divider />
          </Box>
        ))}
      </Menu>
    </>
  );
};

// Main Advanced Search Component
const AdvancedSearch = ({
  onSearch,
  onFilterChange,
  onSortChange,
  searchValue = "",
  filters = [],
  activeFilters = {},
  sortOptions = [],
  sortBy = "",
  sortOrder = "asc",
  suggestions = [],
  showSuggestions = false,
  loading = false,
  placeholder = "Search...",
  showQuickFilters = true,
}) => {
  const { isMobile } = useResponsive();
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      const debouncedFn = debounce((query) => onSearch(query), 300);
      return debouncedFn;
    })(),
    [onSearch],
  );

  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

  const handleClearSearch = () => {
    onSearch("");
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    filters.forEach((filter) => {
      clearedFilters[filter.key] = filter.multiple ? [] : "";
    });
    onFilterChange(clearedFilters);
  };

  const handleSuggestionSelect = (suggestion) => {
    onSearch(suggestion.text);
    if (suggestion.filters) {
      onFilterChange({ ...activeFilters, ...suggestion.filters });
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Search Input */}
      <SearchInput
        value={searchValue}
        onChange={onSearch}
        onClear={handleClearSearch}
        placeholder={placeholder}
        suggestions={suggestions}
        onSuggestionSelect={handleSuggestionSelect}
        showSuggestions={showSuggestions}
        loading={loading}
      />

      {/* Controls Row */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          mb: 2,
        }}
      >
        {/* Filter Panel */}
        {filters.length > 0 && (
          <Box sx={{ flexGrow: 1 }}>
            <FilterPanel
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={(key, value) =>
                onFilterChange({ ...activeFilters, [key]: value })
              }
              onClearFilters={handleClearFilters}
              open={filterPanelOpen}
              onToggle={() => setFilterPanelOpen(!filterPanelOpen)}
            />
          </Box>
        )}

        {/* Sort Control */}
        {sortOptions.length > 0 && (
          <SortControl
            sortOptions={sortOptions}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        )}
      </Box>

      {/* Quick Filters */}
      {showQuickFilters && (
        <QuickFilters
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={(key, value) =>
            onFilterChange({ ...activeFilters, [key]: value })
          }
        />
      )}
    </Box>
  );
};

// Quick Filters Component
const QuickFilters = ({ filters, activeFilters, onFilterChange }) => {
  const quickFilters = filters.filter((f) => f.quickFilter);

  if (quickFilters.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1, display: "block" }}
      >
        Quick Filters:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {quickFilters.map((filter) =>
          filter.quickFilterOptions?.map((option) => (
            <Chip
              key={`${filter.key}-${option.value}`}
              label={option.label}
              size="small"
              clickable
              variant={
                (
                  Array.isArray(activeFilters[filter.key])
                    ? activeFilters[filter.key].includes(option.value)
                    : activeFilters[filter.key] === option.value
                )
                  ? "filled"
                  : "outlined"
              }
              onClick={() => {
                if (filter.multiple) {
                  const current = activeFilters[filter.key] || [];
                  const newValue = current.includes(option.value)
                    ? current.filter((v) => v !== option.value)
                    : [...current, option.value];
                  onFilterChange(filter.key, newValue);
                } else {
                  const newValue =
                    activeFilters[filter.key] === option.value
                      ? ""
                      : option.value;
                  onFilterChange(filter.key, newValue);
                }
              }}
              sx={{
                fontSize: "12px",
                height: 24,
              }}
            />
          )),
        )}
      </Box>
    </Box>
  );
};

// PropTypes
SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  suggestions: PropTypes.array,
  onSuggestionSelect: PropTypes.func,
  showSuggestions: PropTypes.bool,
  loading: PropTypes.bool,
};

FilterPanel.propTypes = {
  filters: PropTypes.array.isRequired,
  activeFilters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

FilterControl.propTypes = {
  filter: PropTypes.object.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
};

SortControl.propTypes = {
  sortOptions: PropTypes.array.isRequired,
  sortBy: PropTypes.string.isRequired,
  sortOrder: PropTypes.oneOf(["asc", "desc"]).isRequired,
  onSortChange: PropTypes.func.isRequired,
};

AdvancedSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
  searchValue: PropTypes.string,
  filters: PropTypes.array,
  activeFilters: PropTypes.object,
  sortOptions: PropTypes.array,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.oneOf(["asc", "desc"]),
  suggestions: PropTypes.array,
  showSuggestions: PropTypes.bool,
  loading: PropTypes.bool,
  placeholder: PropTypes.string,
  showQuickFilters: PropTypes.bool,
};

QuickFilters.propTypes = {
  filters: PropTypes.array.isRequired,
  activeFilters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default AdvancedSearch;
export { SearchInput, FilterPanel, SortControl, QuickFilters };
