/**
 * Mobile-Optimized Pagination Component
 * Responsive pagination with touch-friendly controls
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Pagination,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import { useResponsive } from '../utils/responsiveUtils';

const MobilePagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = true,
  showInfo = true,
  showFirstLast = false,
  compact = false,
}) => {
  const { isMobile, isTablet } = useResponsive();

  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Mobile-optimized pagination
  if (isMobile && !compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          py: 2,
          px: 1,
        }}
      >
        {/* Page Info */}
        {showInfo && (
          <Typography
            variant='body2'
            color='text.secondary'
            align='center'
            sx={{ fontSize: '14px' }}
          >
            {totalCount > 0
              ? `${startItem}-${endItem} of ${totalCount.toLocaleString()}`
              : 'No items'}
          </Typography>
        )}

        {/* Navigation Controls */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {/* First Page */}
          {showFirstLast && (
            <IconButton
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              size='large'
              sx={{
                minWidth: 48,
                minHeight: 48,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <FirstPageIcon />
            </IconButton>
          )}

          {/* Previous Page */}
          <IconButton
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            size='large'
            sx={{
              minWidth: 48,
              minHeight: 48,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <PrevIcon />
          </IconButton>

          {/* Page Indicator */}
          <Box
            sx={{
              px: 3,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 2,
              minWidth: 80,
              textAlign: 'center',
            }}
          >
            <Typography variant='body2' fontWeight='medium'>
              {currentPage} / {totalPages}
            </Typography>
          </Box>

          {/* Next Page */}
          <IconButton
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            size='large'
            sx={{
              minWidth: 48,
              minHeight: 48,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <NextIcon />
          </IconButton>

          {/* Last Page */}
          {showFirstLast && (
            <IconButton
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              size='large'
              sx={{
                minWidth: 48,
                minHeight: 48,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <LastPageIcon />
            </IconButton>
          )}
        </Box>

        {/* Page Size Selector */}
        {showPageSize && (
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <InputLabel>Items per page</InputLabel>
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(e.target.value)}
              label='Items per page'
              sx={{
                fontSize: '14px',
                '& .MuiSelect-select': {
                  py: 1,
                },
              }}
            >
              {pageSizeOptions.map((size) => (
                <MenuItem
                  key={size}
                  value={size}
                  sx={{
                    fontSize: '14px',
                    minHeight: 40,
                  }}
                >
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    );
  }

  // Compact mobile pagination
  if (isMobile && compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1,
          px: 2,
        }}
      >
        {/* Previous */}
        <IconButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          size='medium'
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          <PrevIcon />
        </IconButton>

        {/* Page Info */}
        <Typography variant='body2' color='text.secondary'>
          {currentPage} / {totalPages}
        </Typography>

        {/* Next */}
        <IconButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          size='medium'
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          <NextIcon />
        </IconButton>
      </Box>
    );
  }

  // Desktop/Tablet pagination
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        py: 2,
        px: isTablet ? 1 : 0,
      }}
    >
      {/* Results Info */}
      {showInfo && (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            fontSize: isTablet ? '13px' : '14px',
            order: isTablet ? 2 : 1,
            width: isTablet ? '100%' : 'auto',
            textAlign: isTablet ? 'center' : 'left',
          }}
        >
          Showing {startItem}-{endItem} of {totalCount.toLocaleString()} results
        </Typography>
      )}

      {/* Pagination Controls */}
      <Box
        sx={{
          order: isTablet ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
          siblingCount={isTablet ? 0 : 1}
          boundaryCount={isTablet ? 1 : 2}
          showFirstButton={!isTablet && showFirstLast}
          showLastButton={!isTablet && showFirstLast}
          size={isTablet ? 'small' : 'medium'}
          sx={{
            '& .MuiPaginationItem-root': {
              minWidth: isTablet ? 32 : 36,
              height: isTablet ? 32 : 36,
              fontSize: isTablet ? '12px' : '14px',
            },
          }}
        />

        {/* Page Size Selector */}
        {showPageSize && (
          <FormControl size='small' sx={{ minWidth: isTablet ? 100 : 120 }}>
            <InputLabel>Per page</InputLabel>
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(e.target.value)}
              label='Per page'
              sx={{
                fontSize: isTablet ? '13px' : '14px',
                '& .MuiSelect-select': {
                  py: isTablet ? 0.5 : 1,
                },
              }}
            >
              {pageSizeOptions.map((size) => (
                <MenuItem
                  key={size}
                  value={size}
                  sx={{
                    fontSize: isTablet ? '13px' : '14px',
                    minHeight: isTablet ? 36 : 40,
                  }}
                >
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    </Box>
  );
};

// Quick pagination for infinite scroll
const InfiniteScrollPagination = ({
  hasNextPage,
  loading,
  onLoadMore,
  loadMoreText = 'Load More',
  loadingText = 'Loading...',
}) => {
  const { isMobile } = useResponsive();

  if (!hasNextPage && !loading) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        py: 3,
      }}
    >
      {loading ? (
        <Typography variant='body2' color='text.secondary'>
          {loadingText}
        </Typography>
      ) : (
        <IconButton
          onClick={onLoadMore}
          disabled={loading}
          size={isMobile ? 'large' : 'medium'}
          sx={{
            minWidth: isMobile ? 48 : 44,
            minHeight: isMobile ? 48 : 44,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            px: 3,
          }}
        >
          <Typography variant='body2'>{loadMoreText}</Typography>
        </IconButton>
      )}
    </Box>
  );
};

// Simple pagination summary
const PaginationSummary = ({
  currentPage,
  pageSize,
  totalCount,
  noun = 'items',
}) => {
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <Typography variant='body2' color='text.secondary'>
      {totalCount > 0
        ? `Showing ${startItem}-${endItem} of ${totalCount.toLocaleString()} ${noun}`
        : `No ${noun} found`}
    </Typography>
  );
};

// PropTypes
MobilePagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  showPageSize: PropTypes.bool,
  showInfo: PropTypes.bool,
  showFirstLast: PropTypes.bool,
  compact: PropTypes.bool,
};

InfiniteScrollPagination.propTypes = {
  hasNextPage: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  loadMoreText: PropTypes.string,
  loadingText: PropTypes.string,
};

PaginationSummary.propTypes = {
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  noun: PropTypes.string,
};

export default MobilePagination;
export { InfiniteScrollPagination, PaginationSummary };
