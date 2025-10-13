import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Globe,
  BarChart3,
  Sparkles,
  Calendar,
  Users,
  Tag,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Tooltip,
  Modal,
  LoadingSpinner,
  Pagination,
  Switch,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from '../../../shared/ui';
import { useContentManagement } from '../hooks/useContentManagement';
import { useDebounce } from '../../../shared/hooks';
import ContentEditor from './ContentEditor';
import ContentAnalytics from './ContentAnalytics';
import ContentPreview from './ContentPreview';
import AIContentGenerator from './AIContentGenerator';

/**
 * ContentManager Component
 *
 * Main content management interface providing:
 * - Content listing with advanced filtering and search
 * - AI-powered content generation and optimization
 * - Real-time collaboration and editing
 * - Content analytics and performance tracking
 * - Multilingual content management
 * - SEO optimization tools
 * - Workflow integration and approval processes
 * - Version control and history tracking
 */
const ContentManager = () => {
  // State management
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    status: '',
    language: 'en',
    author: '',
    qualityScore: 0,
    tags: [],
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  // Custom hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const {
    content,
    loading,
    error,
    pagination,
    metrics,
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    duplicateContent,
    analyzeContent,
    optimizeContent,
    translateContent,
    publishContent,
    archiveContent,
    generateRecommendations,
    getAnalytics,
  } = useContentManagement();

  // Fetch content when filters or search change
  useEffect(() => {
    const fetchParams = {
      page,
      search: debouncedSearchQuery,
      ...filters,
      sortBy,
      sortOrder,
    };
    fetchContent(fetchParams);
  }, [debouncedSearchQuery, filters, sortBy, sortOrder, page, fetchContent]);

  // Content type options for filtering
  const contentTypes = [
    { value: '', label: 'All Types' },
    { value: 'article', label: 'Article' },
    { value: 'blog', label: 'Blog Post' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'reference', label: 'Reference' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'guide', label: 'Guide' },
    { value: 'faq', label: 'FAQ' },
    { value: 'policy', label: 'Policy' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'technical', label: 'Technical' },
    { value: 'educational', label: 'Educational' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'business', label: 'Business' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'title', label: 'Title' },
    { value: 'qualityScore', label: 'Quality Score' },
    { value: 'seoScore', label: 'SEO Score' },
    { value: 'views', label: 'Views' },
  ];

  // Handle filter changes
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setPage(1); // Reset to first page when filtering
  }, []);

  // Handle content selection
  const handleContentSelect = useCallback((contentId, isSelected) => {
    setSelectedContent((prev) => {
      if (isSelected) {
        return [...prev, contentId];
      } else {
        return prev.filter((id) => id !== contentId);
      }
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(
    (isSelected) => {
      if (isSelected) {
        setSelectedContent(content.map((item) => item._id));
      } else {
        setSelectedContent([]);
      }
    },
    [content]
  );

  // Handle bulk operations
  const handleBulkAction = useCallback(
    async (action) => {
      if (selectedContent.length === 0) return;

      try {
        switch (action) {
          case 'publish':
            await Promise.all(selectedContent.map((id) => publishContent(id)));
            break;
          case 'archive':
            await Promise.all(selectedContent.map((id) => archiveContent(id)));
            break;
          case 'delete':
            await Promise.all(selectedContent.map((id) => deleteContent(id)));
            break;
          default:
            break;
        }
        setSelectedContent([]);
        fetchContent();
      } catch (_error) {
        // console.error('Bulk action failed:', error);
      }
    },
    [
      selectedContent,
      publishContent,
      archiveContent,
      deleteContent,
      fetchContent,
    ]
  );

  // Handle content creation
  const handleCreateContent = useCallback(() => {
    setEditingContent(null);
    setShowEditor(true);
  }, []);

  // Handle content editing
  const handleEditContent = useCallback((contentItem) => {
    setEditingContent(contentItem);
    setShowEditor(true);
  }, []);

  // Handle content preview
  const handlePreviewContent = useCallback((contentItem) => {
    setPreviewContent(contentItem);
    setShowPreview(true);
  }, []);

  // Handle AI content generation
  const handleAIGenerate = useCallback(() => {
    setShowAIGenerator(true);
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!metrics) return null;

    return {
      totalContent: metrics.totalContent || 0,
      published: metrics.publishedContent || 0,
      drafts: metrics.draftContent || 0,
      averageQuality: metrics.averageQualityScore || 0,
      totalViews: metrics.totalViews || 0,
      engagementRate: metrics.averageEngagementRate || 0,
    };
  }, [metrics]);

  // Status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', icon: Clock },
      review: { variant: 'warning', icon: AlertCircle },
      approved: { variant: 'success', icon: CheckCircle2 },
      published: { variant: 'success', icon: Eye },
      archived: { variant: 'default', icon: Archive },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className='flex items-center gap-1'>
        <IconComponent className='w-3 h-3' />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Quality score styling
  const getQualityColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Render content grid item
  const renderGridItem = (item) => (
    <Card
      key={item._id}
      className='group hover:shadow-lg transition-shadow duration-200'
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={selectedContent.includes(item._id)}
              onChange={(e) => handleContentSelect(item._id, e.target.checked)}
              className='rounded'
            />
            <div className='flex-1 min-w-0'>
              <h3 className='font-semibold text-lg truncate group-hover:text-blue-600 transition-colors'>
                {item.title}
              </h3>
              <p className='text-sm text-gray-600 mt-1'>
                {item.type} • {item.language.toUpperCase()}
              </p>
            </div>
          </div>
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreHorizontal className='w-4 h-4' />
              </Button>
            </DropdownTrigger>
            <DropdownContent align='end'>
              <DropdownItem onClick={() => handlePreviewContent(item)}>
                <Eye className='w-4 h-4' />
                Preview
              </DropdownItem>
              <DropdownItem onClick={() => handleEditContent(item)}>
                <Edit className='w-4 h-4' />
                Edit
              </DropdownItem>
              <DropdownItem onClick={() => duplicateContent(item._id)}>
                <Copy className='w-4 h-4' />
                Duplicate
              </DropdownItem>
              <DropdownItem onClick={() => analyzeContent(item._id)}>
                <BarChart3 className='w-4 h-4' />
                Analyze
              </DropdownItem>
              <DropdownItem onClick={() => optimizeContent(item._id)}>
                <Sparkles className='w-4 h-4' />
                Optimize
              </DropdownItem>
              <DropdownItem
                onClick={() => deleteContent(item._id)}
                className='text-red-600'
              >
                <Trash2 className='w-4 h-4' />
                Delete
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-3'>
          {/* Content preview */}
          <p className='text-sm text-gray-700 line-clamp-3'>
            {item.excerpt || item.summary || 'No preview available'}
          </p>

          {/* Metrics */}
          <div className='flex items-center gap-4 text-xs text-gray-500'>
            <div className='flex items-center gap-1'>
              <Eye className='w-3 h-3' />
              {item.analytics?.views || 0}
            </div>
            <div className='flex items-center gap-1'>
              <Star className='w-3 h-3' />
              <span className={getQualityColor(item.qualityScore)}>
                {item.qualityScore}%
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <TrendingUp className='w-3 h-3' />
              {item.seoScore}%
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant='outline' className='text-xs'>
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant='outline' className='text-xs'>
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Status and metadata */}
          <div className='flex items-center justify-between'>
            {getStatusBadge(item.status)}
            <div className='flex items-center gap-2'>
              {item.collaborators && item.collaborators.length > 0 && (
                <div className='flex items-center'>
                  <Users className='w-3 h-3 text-gray-400' />
                  <span className='text-xs text-gray-500 ml-1'>
                    {item.collaborators.length}
                  </span>
                </div>
              )}
              <span className='text-xs text-gray-500'>
                {new Date(item.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render content list item
  const renderListItem = (item) => (
    <Card key={item._id} className='mb-2'>
      <CardContent className='py-4'>
        <div className='flex items-center gap-4'>
          <input
            type='checkbox'
            checked={selectedContent.includes(item._id)}
            onChange={(e) => handleContentSelect(item._id, e.target.checked)}
            className='rounded'
          />

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-3'>
              <h3
                className='font-semibold truncate hover:text-blue-600 transition-colors cursor-pointer'
                onClick={() => handlePreviewContent(item)}
              >
                {item.title}
              </h3>
              {getStatusBadge(item.status)}
            </div>
            <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
              <span>{item.type}</span>
              <span>{item.language.toUpperCase()}</span>
              <span>{item.wordCount} words</span>
              <span>{item.readingTime}min read</span>
            </div>
          </div>

          <div className='flex items-center gap-6 text-sm'>
            <div className='text-center'>
              <div className='text-gray-900 font-medium'>
                {item.analytics?.views || 0}
              </div>
              <div className='text-gray-500 text-xs'>Views</div>
            </div>
            <div className='text-center'>
              <div
                className={`font-medium ${getQualityColor(item.qualityScore)}`}
              >
                {item.qualityScore}%
              </div>
              <div className='text-gray-500 text-xs'>Quality</div>
            </div>
            <div className='text-center'>
              <div className='text-gray-900 font-medium'>{item.seoScore}%</div>
              <div className='text-gray-500 text-xs'>SEO</div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Avatar
              src={item.createdBy?.avatar}
              alt={item.createdBy?.name}
              size='sm'
            />
            <div className='text-sm'>
              <div className='text-gray-900'>{item.createdBy?.name}</div>
              <div className='text-gray-500'>
                {new Date(item.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreHorizontal className='w-4 h-4' />
              </Button>
            </DropdownTrigger>
            <DropdownContent align='end'>
              <DropdownItem onClick={() => handlePreviewContent(item)}>
                <Eye className='w-4 h-4' />
                Preview
              </DropdownItem>
              <DropdownItem onClick={() => handleEditContent(item)}>
                <Edit className='w-4 h-4' />
                Edit
              </DropdownItem>
              <DropdownItem onClick={() => duplicateContent(item._id)}>
                <Copy className='w-4 h-4' />
                Duplicate
              </DropdownItem>
              <DropdownItem onClick={() => analyzeContent(item._id)}>
                <BarChart3 className='w-4 h-4' />
                Analyze
              </DropdownItem>
              <DropdownItem onClick={() => optimizeContent(item._id)}>
                <Sparkles className='w-4 h-4' />
                Optimize
              </DropdownItem>
              <DropdownItem
                onClick={() => deleteContent(item._id)}
                className='text-red-600'
              >
                <Trash2 className='w-4 h-4' />
                Delete
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && !content.length) {
    return (
      <div className='flex items-center justify-center h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Content Management
          </h1>
          <p className='text-gray-600 mt-1'>
            Create, manage, and optimize content with AI-powered tools
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button variant='outline' onClick={() => setShowAnalytics(true)}>
            <BarChart3 className='w-4 h-4' />
            Analytics
          </Button>
          <Button variant='outline' onClick={handleAIGenerate}>
            <Sparkles className='w-4 h-4' />
            AI Generate
          </Button>
          <Button onClick={handleCreateContent}>
            <Plus className='w-4 h-4' />
            Create Content
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className='grid grid-cols-6 gap-4'>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.totalContent}
              </div>
              <div className='text-sm text-gray-600'>Total Content</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {stats.published}
              </div>
              <div className='text-sm text-gray-600'>Published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {stats.drafts}
              </div>
              <div className='text-sm text-gray-600'>Drafts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div
                className={`text-2xl font-bold ${getQualityColor(stats.averageQuality)}`}
              >
                {stats.averageQuality}%
              </div>
              <div className='text-sm text-gray-600'>Avg Quality</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {stats.totalViews}
              </div>
              <div className='text-sm text-gray-600'>Total Views</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <div className='text-2xl font-bold text-indigo-600'>
                {stats.engagementRate}%
              </div>
              <div className='text-sm text-gray-600'>Engagement</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className='bg-white p-4 rounded-lg shadow-sm border'>
        <div className='flex items-center gap-4 mb-4'>
          <div className='flex-1'>
            <Input
              placeholder='Search content...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterChange('type', value)}
            placeholder='Type'
          >
            {contentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
            placeholder='Status'
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>

          <Select
            value={sortBy}
            onValueChange={setSortBy}
            placeholder='Sort by'
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Button
            variant='outline'
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        {/* Bulk actions */}
        {selectedContent.length > 0 && (
          <div className='flex items-center gap-2 p-3 bg-blue-50 rounded-lg'>
            <span className='text-sm text-blue-700'>
              {selectedContent.length} item(s) selected
            </span>
            <Button size='sm' onClick={() => handleBulkAction('publish')}>
              Publish
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleBulkAction('archive')}
            >
              Archive
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setSelectedContent([])}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* View toggle */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setView('grid')}
          >
            <Grid className='w-4 h-4' />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setView('list')}
          >
            <List className='w-4 h-4' />
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-600'>
            {pagination?.totalItems || 0} items
          </span>
          {selectedContent.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={
                selectedContent.length === content.length
                  ? () => handleSelectAll(false)
                  : () => handleSelectAll(true)
              }
            >
              {selectedContent.length === content.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      {/* Content list */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-700'>{error}</p>
        </div>
      )}

      {content.length === 0 && !loading ? (
        <div className='text-center py-12'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No content found
          </h3>
          <p className='text-gray-600 mb-4'>
            Create your first piece of content to get started
          </p>
          <Button onClick={handleCreateContent}>
            <Plus className='w-4 h-4' />
            Create Content
          </Button>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {content.map(renderGridItem)}
            </div>
          ) : (
            <div className='space-y-2'>{content.map(renderListItem)}</div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className='flex justify-center'>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showEditor && (
        <Modal
          open={showEditor}
          onClose={() => setShowEditor(false)}
          size='full'
        >
          <ContentEditor
            content={editingContent}
            onSave={(savedContent) => {
              setShowEditor(false);
              setEditingContent(null);
              fetchContent();
            }}
            onCancel={() => {
              setShowEditor(false);
              setEditingContent(null);
            }}
          />
        </Modal>
      )}

      {showPreview && previewContent && (
        <Modal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          size='lg'
        >
          <ContentPreview
            content={previewContent}
            onEdit={() => {
              setShowPreview(false);
              handleEditContent(previewContent);
            }}
            onClose={() => setShowPreview(false)}
          />
        </Modal>
      )}

      {showAnalytics && (
        <Modal
          open={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          size='xl'
        >
          <ContentAnalytics onClose={() => setShowAnalytics(false)} />
        </Modal>
      )}

      {showAIGenerator && (
        <Modal
          open={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
          size='lg'
        >
          <AIContentGenerator
            onGenerate={(generatedContent) => {
              setShowAIGenerator(false);
              setEditingContent(generatedContent);
              setShowEditor(true);
            }}
            onCancel={() => setShowAIGenerator(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ContentManager;
