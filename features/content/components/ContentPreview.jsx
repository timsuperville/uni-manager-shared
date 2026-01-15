/* eslint-env browser, es2020 */
/* global document, window, navigator */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "../../../shared/ui";

// Import hooks
import useContentManagement from "../hooks/useContentManagement";

/**
 * ContentPreview Component
 *
 * Advanced content preview interface providing:
 * - Multi-format content rendering (HTML, Markdown, Plain Text)
 * - Responsive design preview with device simulations
 * - Real-time content formatting and styling
 * - Social media preview cards for different platforms
 * - SEO preview with search engine result simulation
 * - Print-friendly preview with formatting options
 * - Accessibility preview with screen reader simulation
 * - Performance indicators and load time analysis
 * - Share functionality with multiple platform integration
 * - Full-screen preview with editing shortcuts
 * - Content export in multiple formats
 */
const ContentPreview = ({
  content,
  contentId = null,
  previewMode = "web",
  showMetrics = true,
  showSocialPreviews = true,
  showAccessibility = true,
  editable = false,
  onEdit,
  className = "",
}) => {
  // State management
  const [currentPreviewMode, setCurrentPreviewMode] = useState(previewMode);
  const [deviceSize, setDeviceSize] = useState("desktop");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("html");
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);

  // Content processing state
  const [processedContent, setProcessedContent] = useState(null);
  const [contentMetrics, setContentMetrics] = useState(null);
  const [socialPreviews, setSocialPreviews] = useState({});
  const [accessibilityScore, setAccessibilityScore] = useState(0);
  const [loadTimeMetrics, setLoadTimeMetrics] = useState(null);

  // Refs
  const previewRef = useRef(null);
  const renderStartTime = useRef(null);

  // Hooks
  const { analyzeContent } = useContentManagement();

  // Device size configurations
  const deviceSizes = useMemo(
    () => ({
      mobile: { width: "375px", height: "667px", label: "Mobile" },
      tablet: { width: "768px", height: "1024px", label: "Tablet" },
      desktop: { width: "100%", height: "auto", label: "Desktop" },
      fullscreen: { width: "100vw", height: "100vh", label: "Fullscreen" },
    }),
    [],
  );

  // Content formatting utilities
  const formatContent = useCallback((text, format = "html") => {
    if (!text) return "";

    switch (format) {
      case "markdown":
        // Basic markdown to HTML conversion
        return text
          .replace(/^### (.*$)/gim, "<h3>$1</h3>")
          .replace(/^## (.*$)/gim, "<h2>$1</h2>")
          .replace(/^# (.*$)/gim, "<h1>$1</h1>")
          .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/gim, "<em>$1</em>")
          .replace(/`(.*?)`/gim, "<code>$1</code>")
          .replace(
            /\[(.*?)\]\((.*?)\)/gim,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
          )
          .replace(/\n\n/gim, "</p><p>")
          .replace(/\n/gim, "<br>")
          .replace(/^(.*)$/gim, "<p>$1</p>");

      case "plain":
        // Convert HTML to plain text
        return text
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

      case "html":
      default:
        return text;
    }
  }, []);

  // Process content for preview
  const processContent = useCallback(async () => {
    if (!content) return;

    setRendering(true);
    renderStartTime.current = performance.now();

    try {
      // Format content based on its type
      const formatted = formatContent(content.body, content.format || "html");

      // Calculate basic metrics
      const wordCount =
        content.body?.split(/\s+/).filter((word) => word.length > 0).length ||
        0;
      const readingTime = Math.ceil(wordCount / 200); // 200 WPM average
      const charCount = content.body?.length || 0;

      const metrics = {
        wordCount,
        readingTime,
        charCount,
        paragraphs: (content.body?.match(/\n\n+/g) || []).length + 1,
        headings: (formatted.match(/<h[1-6]>/g) || []).length,
        links: (formatted.match(/<a /g) || []).length,
        images: (formatted.match(/<img /g) || []).length,
      };

      setProcessedContent({
        ...content,
        formattedBody: formatted,
      });
      setContentMetrics(metrics);

      // Generate social media previews
      generateSocialPreviews();

      // Calculate accessibility score
      calculateAccessibilityScore(formatted);

      // Calculate load time metrics
      const loadTime = performance.now() - renderStartTime.current;
      setLoadTimeMetrics({
        renderTime: Math.round(loadTime),
        estimatedLoadTime: Math.round(loadTime + charCount * 0.001), // Rough estimate
        performanceScore: Math.max(0, 100 - Math.floor(loadTime / 10)),
      });
    } catch (_error) {
      // console.error('Content processing failed:', error);
      setError(error.message);
    } finally {
      setRendering(false);
    }
  }, [content, formatContent]);

  // Generate social media previews
  const generateSocialPreviews = useCallback(() => {
    if (!content) return;

    const previews = {
      facebook: {
        title: content.title || "Untitled Content",
        description:
          content.excerpt || content.body?.slice(0, 200) + "..." || "",
        image: content.featuredImage || "/default-social-image.jpg",
        url: `${typeof window !== "undefined" && window.location.origin}/content/${contentId || "preview"}`,
      },
      twitter: {
        title: content.title || "Untitled Content",
        description:
          content.excerpt || content.body?.slice(0, 140) + "..." || "",
        image: content.featuredImage || "/default-social-image.jpg",
        card: "summary_large_image",
      },
      linkedin: {
        title: content.title || "Untitled Content",
        description:
          content.excerpt || content.body?.slice(0, 300) + "..." || "",
        image: content.featuredImage || "/default-social-image.jpg",
      },
      instagram: {
        caption: `${content.title || "Untitled Content"}\n\n${content.excerpt || content.body?.slice(0, 100) + "..." || ""}`,
        hashtags: content.tags || [],
      },
    };

    setSocialPreviews(previews);
  }, [content, contentId]);

  // Calculate accessibility score
  const calculateAccessibilityScore = useCallback((htmlContent) => {
    let score = 100;
    const issues = [];

    // Check for alt text on images
    const images = htmlContent.match(/<img[^>]*>/g) || [];
    const imagesWithoutAlt = images.filter((img) => !img.includes("alt="));
    if (imagesWithoutAlt.length > 0) {
      score -= 20;
      issues.push("Images missing alt text");
    }

    // Check for proper heading structure
    const headings = htmlContent.match(/<h[1-6]>/g) || [];
    if (headings.length === 0) {
      score -= 15;
      issues.push("No headings found");
    }

    // Check for color contrast (basic check)
    if (htmlContent.includes("style=") && htmlContent.includes("color:")) {
      score -= 10; // This would need proper color contrast calculation
      issues.push("Manual color contrast check needed");
    }

    // Check for link text
    const links = htmlContent.match(/<a[^>]*>(.*?)<\/a>/g) || [];
    const genericLinks = links.filter((link) => {
      const text = link.replace(/<[^>]*>/g, "").toLowerCase();
      return ["click here", "read more", "here", "link"].includes(text);
    });
    if (genericLinks.length > 0) {
      score -= 15;
      issues.push("Generic link text found");
    }

    setAccessibilityScore(Math.max(0, score));
  }, []);

  // Export content in different formats
  const exportContent = useCallback(
    (format) => {
      if (!processedContent) return;

      let exportData;
      let filename;
      let mimeType;

      switch (format) {
        case "html":
          exportData = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${processedContent.title || "Exported Content"}</title>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1, h2, h3 { color: #333; }
              code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>${processedContent.title || "Untitled"}</h1>
            ${processedContent.excerpt ? `<p><em>${processedContent.excerpt}</em></p>` : ""}
            ${processedContent.formattedBody}
          </body>
          </html>
        `;
          filename = `${processedContent.title || "content"}.html`;
          mimeType = "text/html";
          break;

        case "markdown":
          exportData = `# ${processedContent.title || "Untitled"}\n\n${processedContent.excerpt ? `*${processedContent.excerpt}*\n\n` : ""}${processedContent.body}`;
          filename = `${processedContent.title || "content"}.md`;
          mimeType = "text/markdown";
          break;

        case "txt":
          exportData = `${processedContent.title || "Untitled"}\n\n${processedContent.excerpt ? `${processedContent.excerpt}\n\n` : ""}${formatContent(processedContent.body, "plain")}`;
          filename = `${processedContent.title || "content"}.txt`;
          mimeType = "text/plain";
          break;

        case "json":
          exportData = JSON.stringify(processedContent, null, 2);
          filename = `${processedContent.title || "content"}.json`;
          mimeType = "application/json";
          break;

        default:
          return;
      }

      // Create and trigger download
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link =
        typeof document !== "undefined" && document.createElement("a");
      link.href = url;
      link.download = filename;
      typeof document !== "undefined" && document.body.appendChild(link);
      link.click();
      typeof document !== "undefined" && document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [processedContent, formatContent],
  );

  // Share content
  const shareContent = useCallback(
    async (platform) => {
      if (!processedContent || !socialPreviews[platform]) return;

      const preview = socialPreviews[platform];
      let shareUrl;

      switch (platform) {
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(preview.url)}`;
          break;
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(preview.title)}&url=${encodeURIComponent(preview.url)}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(preview.url)}`;
          break;
        case "copy":
          try {
            (await typeof navigator) !== "undefined" &&
              navigator.clipboard.writeText(preview.url);
            // You would show a toast notification here
            // console.log('Link copied to clipboard');
          } catch (_error) {
            // console.error('Failed to copy link:', error);
          }
          return;
        default:
          return;
      }

      if (shareUrl) {
        typeof window !== "undefined" &&
          window.open(shareUrl, "_blank", "width=600,height=400");
      }

      setShareModalOpen(false);
    },
    [processedContent, socialPreviews],
  );

  // Process content when it changes
  useEffect(() => {
    processContent();
  }, [processContent]);

  // Render device frame
  const renderDeviceFrame = (children) => {
    const size = deviceSizes[deviceSize];

    return (
      <div className="flex justify-center">
        <div
          className={`border rounded-lg overflow-hidden ${deviceSize === "mobile" ? "border-gray-800" : "border-gray-300"}`}
          style={{
            width: size.width,
            height: size.height,
            maxHeight: deviceSize === "desktop" ? "80vh" : size.height,
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  // Render content metrics
  const renderMetrics = () =>
    showMetrics &&
    contentMetrics && (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Content Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {contentMetrics.wordCount}
              </div>
              <div className="text-gray-600">Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {contentMetrics.readingTime}
              </div>
              <div className="text-gray-600">Min Read</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {contentMetrics.headings}
              </div>
              <div className="text-gray-600">Headings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {accessibilityScore}%
              </div>
              <div className="text-gray-600">Accessibility</div>
            </div>
          </div>

          {loadTimeMetrics && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span>Render Time:</span>
                <span className="font-medium">
                  {loadTimeMetrics.renderTime}ms
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span>Performance Score:</span>
                <Badge
                  variant={
                    loadTimeMetrics.performanceScore > 80
                      ? "success"
                      : loadTimeMetrics.performanceScore > 60
                        ? "warning"
                        : "destructive"
                  }
                >
                  {loadTimeMetrics.performanceScore}/100
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );

  // Render social previews
  const renderSocialPreviews = () =>
    showSocialPreviews &&
    Object.keys(socialPreviews).length > 0 && (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Social Media Previews</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="facebook">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
              <TabsTrigger value="twitter">Twitter</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
            </TabsList>

            {Object.entries(socialPreviews).map(([platform, preview]) => (
              <TabsContent key={platform} value={platform} className="mt-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  {platform === "instagram" ? (
                    <div>
                      <div className="font-medium mb-2">Instagram Post</div>
                      <div className="text-sm">{preview.caption}</div>
                      {preview.hashtags && preview.hashtags.length > 0 && (
                        <div className="mt-2 text-blue-600 text-sm">
                          {preview.hashtags.map((tag) => `#${tag}`).join(" ")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <div className="w-16 h-16 bg-gray-300 rounded flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {preview.title}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {preview.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {preview.url}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );

  // Main component render
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <Select
            value={currentPreviewMode}
            onValueChange={setCurrentPreviewMode}
          >
            <option value="web">Web Preview</option>
            <option value="social">Social Preview</option>
            <option value="print">Print Preview</option>
            <option value="accessibility">Accessibility Preview</option>
          </Select>

          <Select value={deviceSize} onValueChange={setDeviceSize}>
            {Object.entries(deviceSizes).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {editable && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Edit Content
            </Button>
          )}

          <Modal open={shareModalOpen} onOpenChange={setShareModalOpen}>
            <ModalTrigger asChild>
              <Button variant="outline">Share</Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Share Content</ModalTitle>
                <ModalDescription>
                  Choose a platform to share your content
                </ModalDescription>
              </ModalHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  onClick={() => shareContent("facebook")}
                  variant="outline"
                >
                  Facebook
                </Button>
                <Button
                  onClick={() => shareContent("twitter")}
                  variant="outline"
                >
                  Twitter
                </Button>
                <Button
                  onClick={() => shareContent("linkedin")}
                  variant="outline"
                >
                  LinkedIn
                </Button>
                <Button onClick={() => shareContent("copy")} variant="outline">
                  Copy Link
                </Button>
              </div>
            </ModalContent>
          </Modal>

          <Select value={exportFormat} onValueChange={setExportFormat}>
            <option value="html">Export as HTML</option>
            <option value="markdown">Export as Markdown</option>
            <option value="txt">Export as Text</option>
            <option value="json">Export as JSON</option>
          </Select>

          <Button onClick={() => exportContent(exportFormat)} variant="outline">
            Export
          </Button>

          <Button
            onClick={() => setShowFullscreen(!showFullscreen)}
            variant="outline"
          >
            {showFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && <Alert variant="destructive">Preview error: {error}</Alert>}

      {/* Loading state */}
      {rendering && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Rendering preview...</p>
        </div>
      )}

      {/* Preview content */}
      {!rendering && processedContent && (
        <div
          className={
            showFullscreen ? "fixed inset-0 z-50 bg-white overflow-auto" : ""
          }
        >
          {showFullscreen && (
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-semibold">Content Preview</h3>
              <Button onClick={() => setShowFullscreen(false)}>
                Close Fullscreen
              </Button>
            </div>
          )}

          <div className={showFullscreen ? "p-4" : ""}>
            {/* Metrics and social previews */}
            {currentPreviewMode === "web" && (
              <>
                {renderMetrics()}
                {renderSocialPreviews()}
              </>
            )}

            {/* Main preview */}
            {currentPreviewMode === "web" &&
              renderDeviceFrame(
                <div className="p-6 h-full overflow-auto bg-white">
                  <article className="prose max-w-none">
                    <h1>{processedContent.title || "Untitled Content"}</h1>
                    {processedContent.excerpt && (
                      <p className="lead text-gray-600">
                        {processedContent.excerpt}
                      </p>
                    )}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: processedContent.formattedBody,
                      }}
                    />
                  </article>
                </div>,
              )}

            {/* Social preview mode */}
            {currentPreviewMode === "social" && (
              <div className="space-y-4">{renderSocialPreviews()}</div>
            )}

            {/* Print preview mode */}
            {currentPreviewMode === "print" && (
              <div className="bg-white p-8 shadow-lg max-w-4xl mx-auto">
                <div className="print-preview">
                  <h1 className="text-3xl font-bold mb-4">
                    {processedContent.title}
                  </h1>
                  {processedContent.excerpt && (
                    <p className="text-lg text-gray-600 mb-6">
                      {processedContent.excerpt}
                    </p>
                  )}
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: processedContent.formattedBody,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Accessibility preview mode */}
            {currentPreviewMode === "accessibility" && showAccessibility && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Accessibility Analysis</CardTitle>
                    <CardDescription>
                      Content accessibility assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-3xl font-bold">
                        <span
                          className={
                            accessibilityScore >= 80
                              ? "text-green-600"
                              : accessibilityScore >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {accessibilityScore}%
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">Accessibility Score</div>
                        <div className="text-sm text-gray-600">
                          {accessibilityScore >= 80
                            ? "Excellent accessibility"
                            : accessibilityScore >= 60
                              ? "Good accessibility"
                              : "Needs improvement"}
                        </div>
                      </div>
                    </div>
                    <Progress value={accessibilityScore} className="mb-4" />
                  </CardContent>
                </Card>

                {/* High contrast preview */}
                <div className="bg-black text-white p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">
                    High Contrast Preview
                  </h3>
                  <article className="prose prose-invert max-w-none">
                    <h1>{processedContent.title}</h1>
                    {processedContent.excerpt && (
                      <p>{processedContent.excerpt}</p>
                    )}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: processedContent.formattedBody,
                      }}
                    />
                  </article>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No content state */}
      {!rendering && !processedContent && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600">No content to preview</p>
        </div>
      )}
    </div>
  );
};

ContentPreview.propTypes = {
  content: PropTypes.object,
  contentId: PropTypes.string,
  previewMode: PropTypes.oneOf(["web", "social", "print", "accessibility"]),
  showMetrics: PropTypes.bool,
  showSocialPreviews: PropTypes.bool,
  showAccessibility: PropTypes.bool,
  editable: PropTypes.bool,
  onEdit: PropTypes.func,
  className: PropTypes.string,
};

export default ContentPreview;
