/* eslint-env browser, es2020 */
/* global document, window */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";

// Import UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  Badge,
  Progress,
  Alert,
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../shared/ui";

// Import hooks
import useContentManagement from "../hooks/useContentManagement";

/**
 * ContentAnalytics Component
 *
 * Comprehensive analytics dashboard for content performance including:
 * - Real-time performance metrics and engagement tracking
 * - SEO analysis with keyword ranking and optimization insights
 * - Content quality assessment with readability and engagement scores
 * - Audience insights with demographic and behavioral analytics
 * - Comparative analysis against similar content and industry benchmarks
 * - Trend analysis with historical performance data
 * - AI-powered recommendations for content optimization
 * - Social media performance tracking and viral potential assessment
 * - Content lifecycle analytics from creation to archive
 * - Revenue attribution and conversion tracking
 */
const ContentAnalytics = ({
  contentId = null,
  timeframe = "30d",
  showComparison = true,
  showRecommendations = true,
  className = "",
}) => {
  // State management
  const [analytics, setAnalytics] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedMetric, setSelectedMetric] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // Detailed analytics state
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [seoInsights, setSeoInsights] = useState(null);
  const [audienceData, setAudienceData] = useState(null);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [contentHealth, setContentHealth] = useState(null);

  // Hooks
  const { getAnalytics, getContentMetrics } = useContentManagement();

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get main analytics
      const analyticsData = await getAnalytics(contentId, selectedTimeframe);
      setAnalytics(analyticsData);

      if (analyticsData) {
        // Extract detailed sections
        setPerformanceMetrics(analyticsData.performance || {});
        setSeoInsights(analyticsData.seo || {});
        setAudienceData(analyticsData.audience || {});
        setTrendAnalysis(analyticsData.trends || {});
        setContentHealth(analyticsData.health || {});

        // Load comparison data if enabled
        if (showComparison && analyticsData.comparison) {
          setComparisonData(analyticsData.comparison);
        }

        // Load AI recommendations if enabled
        if (showRecommendations && analyticsData.recommendations) {
          setRecommendations(analyticsData.recommendations);
        }
      }
    } catch (_error) {
      // console.error('Analytics loading failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [
    contentId,
    selectedTimeframe,
    showComparison,
    showRecommendations,
    getAnalytics,
  ]);

  // Load analytics on mount and when dependencies change
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Calculate performance score
  const performanceScore = useMemo(() => {
    if (!performanceMetrics) return 0;

    const scores = [
      performanceMetrics.viewsScore || 0,
      performanceMetrics.engagementScore || 0,
      performanceMetrics.shareScore || 0,
      performanceMetrics.conversionScore || 0,
    ];

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  }, [performanceMetrics]);

  // Format numbers for display
  const formatNumber = useCallback((num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || "0";
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value, precision = 1) => {
    return `${(value || 0).toFixed(precision)}%`;
  }, []);

  // Get metric color based on performance
  const getMetricColor = useCallback(
    (value, thresholds = { good: 70, moderate: 40 }) => {
      if (value >= thresholds.good) return "text-green-600";
      if (value >= thresholds.moderate) return "text-yellow-600";
      return "text-red-600";
    },
    [],
  );

  // Render overview metrics
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(performanceMetrics?.totalViews || 0)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span
              className={getMetricColor(performanceMetrics?.viewsGrowth || 0)}
            >
              {performanceMetrics?.viewsGrowth > 0 ? "+" : ""}
              {formatPercentage(performanceMetrics?.viewsGrowth)}
            </span>
            <span className="ml-1">vs last period</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(performanceMetrics?.engagementRate || 0)}
          </div>
          <Progress
            value={performanceMetrics?.engagementRate || 0}
            className="mt-2"
          />
          <div className="text-xs text-gray-600 mt-1">
            Industry avg:{" "}
            {formatPercentage(performanceMetrics?.industryAvgEngagement || 0)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className={getMetricColor(seoInsights?.overallScore || 0)}>
              {seoInsights?.overallScore || 0}
            </span>
            <span className="text-sm text-gray-600">/100</span>
          </div>
          <div className="text-sm text-gray-600">
            Keywords: {seoInsights?.keywordCount || 0} ranked
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className={getMetricColor(performanceScore)}>
              {performanceScore}
            </span>
            <span className="text-sm text-gray-600">/100</span>
          </div>
          <Badge
            variant={
              performanceScore > 70
                ? "success"
                : performanceScore > 40
                  ? "warning"
                  : "destructive"
            }
            className="mt-1"
          >
            {performanceScore > 70
              ? "Excellent"
              : performanceScore > 40
                ? "Good"
                : "Needs Improvement"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );

  // Render performance details
  const renderPerformance = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
          <CardDescription>
            Detailed analysis of content performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Engagement Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Time on Page</span>
                  <span className="font-medium">
                    {performanceMetrics?.timeOnPage || "0:00"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bounce Rate</span>
                  <span className="font-medium">
                    {formatPercentage(performanceMetrics?.bounceRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pages per Session</span>
                  <span className="font-medium">
                    {performanceMetrics?.pagesPerSession || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Return Visitors</span>
                  <span className="font-medium">
                    {formatPercentage(performanceMetrics?.returnVisitors)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Social Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Shares</span>
                  <span className="font-medium">
                    {formatNumber(performanceMetrics?.totalShares || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Comments</span>
                  <span className="font-medium">
                    {formatNumber(performanceMetrics?.comments || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Likes/Reactions</span>
                  <span className="font-medium">
                    {formatNumber(performanceMetrics?.reactions || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Viral Coefficient</span>
                  <span className="font-medium">
                    {(performanceMetrics?.viralCoefficient || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {trendAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
            <CardDescription>Performance trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatPercentage(trendAnalysis.growthRate)}
                </div>
                <div className="text-sm text-gray-600">Growth Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {trendAnalysis.peakDay || "N/A"}
                </div>
                <div className="text-sm text-gray-600">
                  Peak Performance Day
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(trendAnalysis.projectedViews || 0)}
                </div>
                <div className="text-sm text-gray-600">
                  Projected Views (30d)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render SEO insights
  const renderSEO = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO Analysis</CardTitle>
          <CardDescription>
            Search engine optimization insights and keyword performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Overall SEO Health</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Title Optimization</span>
                  <div className="flex items-center">
                    <Progress
                      value={seoInsights?.titleScore || 0}
                      className="w-20 mr-2"
                    />
                    <span className="text-sm font-medium">
                      {seoInsights?.titleScore || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Meta Description</span>
                  <div className="flex items-center">
                    <Progress
                      value={seoInsights?.metaScore || 0}
                      className="w-20 mr-2"
                    />
                    <span className="text-sm font-medium">
                      {seoInsights?.metaScore || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Content Optimization</span>
                  <div className="flex items-center">
                    <Progress
                      value={seoInsights?.contentScore || 0}
                      className="w-20 mr-2"
                    />
                    <span className="text-sm font-medium">
                      {seoInsights?.contentScore || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Technical SEO</span>
                  <div className="flex items-center">
                    <Progress
                      value={seoInsights?.technicalScore || 0}
                      className="w-20 mr-2"
                    />
                    <span className="text-sm font-medium">
                      {seoInsights?.technicalScore || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Keyword Performance</h4>
              {seoInsights?.keywords && seoInsights.keywords.length > 0 ? (
                <div className="space-y-2">
                  {seoInsights.keywords.slice(0, 5).map((keyword, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{keyword.term}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          #{keyword.rank || "N/A"}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {formatNumber(keyword.searches || 0)} searches
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No keyword data available
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {seoInsights?.opportunities && seoInsights.opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SEO Opportunities</CardTitle>
            <CardDescription>
              Recommended optimizations to improve search rankings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seoInsights.opportunities.map((opportunity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded"
                >
                  <Badge variant="outline" className="mt-0.5">
                    {opportunity.impact || "Medium"}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {opportunity.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {opportunity.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Render audience insights
  const renderAudience = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audience Demographics</CardTitle>
          <CardDescription>
            Insights about your content audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-3">Age Distribution</h4>
              {audienceData?.ageGroups ? (
                <div className="space-y-2">
                  {Object.entries(audienceData.ageGroups).map(
                    ([ageGroup, percentage]) => (
                      <div
                        key={ageGroup}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{ageGroup}</span>
                        <div className="flex items-center">
                          <Progress value={percentage} className="w-16 mr-2" />
                          <span className="text-sm">
                            {formatPercentage(percentage)}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No age data available
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3">Geographic Distribution</h4>
              {audienceData?.countries ? (
                <div className="space-y-2">
                  {audienceData.countries.slice(0, 5).map((country, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{country.name}</span>
                      <span className="text-sm font-medium">
                        {formatPercentage(country.percentage)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No geographic data available
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3">Device Usage</h4>
              {audienceData?.devices ? (
                <div className="space-y-2">
                  {Object.entries(audienceData.devices).map(
                    ([device, percentage]) => (
                      <div
                        key={device}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm capitalize">{device}</span>
                        <span className="text-sm font-medium">
                          {formatPercentage(percentage)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No device data available
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audience Behavior</CardTitle>
          <CardDescription>
            How your audience interacts with your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Reading Patterns</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Read Time</span>
                  <span className="font-medium">
                    {audienceData?.avgReadTime || "0:00"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completion Rate</span>
                  <span className="font-medium">
                    {formatPercentage(audienceData?.completionRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Scroll Depth</span>
                  <span className="font-medium">
                    {formatPercentage(audienceData?.scrollDepth)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Engagement Patterns</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Peak Engagement Time</span>
                  <span className="font-medium">
                    {audienceData?.peakEngagementTime || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Social Share Rate</span>
                  <span className="font-medium">
                    {formatPercentage(audienceData?.shareRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Return Rate</span>
                  <span className="font-medium">
                    {formatPercentage(audienceData?.returnRate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render recommendations
  const renderRecommendations = () =>
    showRecommendations &&
    recommendations.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>
            Data-driven suggestions to improve content performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 border rounded-lg"
              >
                <Badge
                  variant={
                    recommendation.priority === "high"
                      ? "destructive"
                      : recommendation.priority === "medium"
                        ? "warning"
                        : "secondary"
                  }
                  className="mt-0.5"
                >
                  {recommendation.priority || "Low"} Priority
                </Badge>
                <div className="flex-1">
                  <div className="font-medium">{recommendation.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {recommendation.description}
                  </div>
                  {recommendation.expectedImpact && (
                    <div className="text-sm text-green-600 mt-2">
                      Expected impact: {recommendation.expectedImpact}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline">
                          Apply
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Apply this recommendation</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button size="sm" variant="ghost">
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );

  // Main component render
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Analytics</h2>
          <p className="text-gray-600">
            {contentId
              ? "Individual content analysis"
              : "Overall content performance"}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>

          <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <p>Failed to load analytics: {error}</p>
          <Button variant="outline" onClick={loadAnalytics} className="mt-2">
            Retry
          </Button>
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      )}

      {/* Analytics content */}
      {!loading && analytics && (
        <>
          {/* Overview metrics */}
          {renderOverview()}

          {/* Detailed analytics tabs */}
          <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {renderRecommendations()}
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              {renderPerformance()}
            </TabsContent>

            <TabsContent value="seo" className="mt-6">
              {renderSEO()}
            </TabsContent>

            <TabsContent value="audience" className="mt-6">
              {renderAudience()}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* No data state */}
      {!loading && !error && !analytics && (
        <div className="text-center py-12">
          <div className="text-gray-600 mb-4">No analytics data available</div>
          <Button onClick={loadAnalytics}>Load Analytics</Button>
        </div>
      )}
    </div>
  );
};

ContentAnalytics.propTypes = {
  contentId: PropTypes.string,
  timeframe: PropTypes.string,
  showComparison: PropTypes.bool,
  showRecommendations: PropTypes.bool,
  className: PropTypes.string,
};

export default ContentAnalytics;
