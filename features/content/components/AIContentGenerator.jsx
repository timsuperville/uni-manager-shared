import React, { useState, useCallback } from 'react';
import {
  Sparkles,
  Wand2,
  Target,
  Users,
  Volume2,
  FileText,
  Globe,
  Tag,
  Lightbulb,
  Clock,
  BarChart3,
  Settings,
  Play,
  RefreshCw,
  Copy,
  Download,
  Check,
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Switch,
  Slider,
  LoadingSpinner,
  Progress,
  Alert,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../../ui';
import { useContentGeneration } from '../hooks/useContentGeneration';

/**
 * AIContentGenerator Component
 *
 * Advanced AI-powered content generation interface providing:
 * - Intelligent prompt engineering and optimization
 * - Multi-format content generation (articles, blogs, documentation)
 * - Tone and style customization
 * - Target audience configuration
 * - SEO optimization settings
 * - Content length and structure control
 * - Real-time generation progress
 * - Content preview and editing
 * - Template library and presets
 * - Bulk generation capabilities
 */
const AIContentGenerator = ({ onGenerate, onCancel }) => {
  // State management
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('article');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('general');
  const [length, setLength] = useState('medium');
  const [format, setFormat] = useState('markdown');
  const [style, setStyle] = useState('informative');
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [includeOutline, setIncludeOutline] = useState(true);
  const [seoOptimized, setSeoOptimized] = useState(true);
  const [creativityLevel, setCreativityLevel] = useState(50);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'generating', 'preview'

  // Custom hooks
  const {
    generateContent,
    optimizePrompt,
    getTemplates,
    analyzeTopic,
    loading,
    error,
    progress,
  } = useContentGeneration();

  // Content type options
  const contentTypes = [
    {
      value: 'article',
      label: 'Article',
      icon: FileText,
      description: 'In-depth informational content',
    },
    {
      value: 'blog',
      label: 'Blog Post',
      icon: Lightbulb,
      description: 'Engaging personal or brand content',
    },
    {
      value: 'documentation',
      label: 'Documentation',
      icon: Settings,
      description: 'Technical guides and manuals',
    },
    {
      value: 'tutorial',
      label: 'Tutorial',
      icon: Play,
      description: 'Step-by-step instructional content',
    },
    {
      value: 'marketing',
      label: 'Marketing Copy',
      icon: Target,
      description: 'Promotional and sales content',
    },
    {
      value: 'announcement',
      label: 'Announcement',
      icon: Volume2,
      description: 'News and update content',
    },
    {
      value: 'guide',
      label: 'Guide',
      icon: Users,
      description: 'Comprehensive how-to content',
    },
    {
      value: 'faq',
      label: 'FAQ',
      icon: Clock,
      description: 'Question and answer format',
    },
    {
      value: 'reference',
      label: 'Reference',
      icon: BarChart3,
      description: 'Quick lookup information',
    },
    {
      value: 'educational',
      label: 'Educational',
      icon: Globe,
      description: 'Learning-focused content',
    },
  ];

  const toneOptions = [
    {
      value: 'professional',
      label: 'Professional',
      description: 'Formal and business-appropriate',
    },
    {
      value: 'casual',
      label: 'Casual',
      description: 'Friendly and conversational',
    },
    {
      value: 'creative',
      label: 'Creative',
      description: 'Artistic and imaginative',
    },
    {
      value: 'technical',
      label: 'Technical',
      description: 'Precise and detailed',
    },
    {
      value: 'friendly',
      label: 'Friendly',
      description: 'Warm and approachable',
    },
    {
      value: 'formal',
      label: 'Formal',
      description: 'Official and structured',
    },
  ];

  const audienceOptions = [
    {
      value: 'general',
      label: 'General Public',
      description: 'Broad audience appeal',
    },
    {
      value: 'technical',
      label: 'Technical Experts',
      description: 'Industry professionals',
    },
    {
      value: 'business',
      label: 'Business Leaders',
      description: 'Executives and managers',
    },
    {
      value: 'academic',
      label: 'Academic',
      description: 'Students and researchers',
    },
    {
      value: 'marketing',
      label: 'Marketing Teams',
      description: 'Marketing professionals',
    },
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (300-500 words)', tokens: 500 },
    { value: 'medium', label: 'Medium (800-1200 words)', tokens: 1500 },
    { value: 'long', label: 'Long (1500-2500 words)', tokens: 3000 },
    { value: 'extended', label: 'Extended (3000+ words)', tokens: 4000 },
  ];

  const formatOptions = [
    {
      value: 'markdown',
      label: 'Markdown',
      description: 'Clean formatting with headers',
    },
    { value: 'html', label: 'HTML', description: 'Web-ready markup' },
    { value: 'plain', label: 'Plain Text', description: 'Simple text format' },
    {
      value: 'rich-text',
      label: 'Rich Text',
      description: 'Formatted document style',
    },
  ];

  const styleOptions = [
    {
      value: 'informative',
      label: 'Informative',
      description: 'Educational and fact-based',
    },
    {
      value: 'persuasive',
      label: 'Persuasive',
      description: 'Convincing and influential',
    },
    {
      value: 'entertaining',
      label: 'Entertaining',
      description: 'Engaging and fun',
    },
    {
      value: 'instructional',
      label: 'Instructional',
      description: 'Teaching and guidance',
    },
    {
      value: 'narrative',
      label: 'Narrative',
      description: 'Story-telling approach',
    },
  ];

  // Handle keyword management
  const addKeyword = useCallback(() => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords((prev) => [...prev, keywordInput.trim()]);
      setKeywordInput('');
    }
  }, [keywordInput, keywords]);

  const removeKeyword = useCallback((keywordToRemove) => {
    setKeywords((prev) =>
      prev.filter((keyword) => keyword !== keywordToRemove)
    );
  }, []);

  // Handle content generation
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      return;
    }

    setCurrentStep('generating');

    try {
      const generationOptions = {
        type: contentType,
        tone,
        audience,
        length,
        format,
        style,
        keywords,
        language,
        includeOutline,
        seoOptimized,
        creativityLevel: creativityLevel / 100,
        customInstructions: customInstructions.trim() || undefined,
        template: useTemplate ? selectedTemplate : undefined,
      };

      const result = await generateContent(prompt, generationOptions);

      if (result.success) {
        setGeneratedContent(result.content);
        setCurrentStep('preview');
      } else {
        setCurrentStep('input');
      }
    } catch (_error) {
      // console.error('Content generation failed:', error);
      setCurrentStep('input');
    }
  }, [
    prompt,
    contentType,
    tone,
    audience,
    length,
    format,
    style,
    keywords,
    language,
    includeOutline,
    seoOptimized,
    creativityLevel,
    customInstructions,
    useTemplate,
    selectedTemplate,
    generateContent,
  ]);

  // Handle prompt optimization
  const handleOptimizePrompt = useCallback(async () => {
    if (!prompt.trim()) return;

    try {
      const optimizedPrompt = await optimizePrompt(prompt, {
        type: contentType,
        audience,
        keywords,
      });

      if (optimizedPrompt) {
        setPrompt(optimizedPrompt);
      }
    } catch (_error) {
      // console.error('Prompt optimization failed:', error);
    }
  }, [prompt, contentType, audience, keywords, optimizePrompt]);

  // Handle topic analysis
  const handleAnalyzeTopic = useCallback(async () => {
    if (!prompt.trim()) return;

    try {
      const analysis = await analyzeTopic(prompt);

      if (analysis) {
        // Auto-populate suggestions based on analysis
        if (analysis.suggestedKeywords) {
          setKeywords((prev) => [
            ...new Set([...prev, ...analysis.suggestedKeywords]),
          ]);
        }
        if (analysis.recommendedTone) {
          setTone(analysis.recommendedTone);
        }
        if (analysis.targetAudience) {
          setAudience(analysis.targetAudience);
        }
      }
    } catch (_error) {
      // console.error('Topic analysis failed:', error);
    }
  }, [prompt, analyzeTopic]);

  // Handle template selection
  const handleTemplateChange = useCallback((templateId) => {
    setSelectedTemplate(templateId);
    // Load template content if available
    // This would typically fetch template details from the backend
  }, []);

  // Render generation progress
  const renderProgress = () => {
    if (currentStep !== 'generating') return null;

    return (
      <div className='space-y-4'>
        <div className='text-center'>
          <LoadingSpinner size='lg' />
          <h3 className='text-lg font-semibold mt-4'>Generating Content</h3>
          <p className='text-gray-600'>
            Creating your {contentType} with AI...
          </p>
        </div>

        {progress && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>{progress.stage}</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} />
          </div>
        )}

        <div className='text-sm text-gray-500 space-y-1'>
          <div className='flex items-center gap-2'>
            <Check className='w-4 h-4 text-green-500' />
            Analyzing prompt and requirements
          </div>
          <div className='flex items-center gap-2'>
            <Check className='w-4 h-4 text-green-500' />
            Optimizing for SEO and readability
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='w-4 h-4 text-yellow-500' />
            Generating content with AI
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='w-4 h-4 text-gray-400' />
            Analyzing and optimizing output
          </div>
        </div>
      </div>
    );
  };

  // Render content preview
  const renderPreview = () => {
    if (currentStep !== 'preview' || !generatedContent) return null;

    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Generated Content Preview</h3>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentStep('input')}
            >
              <RefreshCw className='w-4 h-4' />
              Regenerate
            </Button>
            <Button variant='outline' size='sm'>
              <Copy className='w-4 h-4' />
              Copy
            </Button>
            <Button variant='outline' size='sm'>
              <Download className='w-4 h-4' />
              Export
            </Button>
          </div>
        </div>

        {/* Content analysis */}
        {generatedContent.analysis && (
          <div className='grid grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {generatedContent.analysis.quality?.overallScore || 0}%
                </div>
                <div className='text-sm text-gray-600'>Quality Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {generatedContent.analysis.seo?.score || 0}%
                </div>
                <div className='text-sm text-gray-600'>SEO Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {generatedContent.wordCount || 0}
                </div>
                <div className='text-sm text-gray-600'>Words</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <div className='text-2xl font-bold text-orange-600'>
                  {generatedContent.readingTime || 0}min
                </div>
                <div className='text-sm text-gray-600'>Read Time</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content preview */}
        <Card>
          <CardHeader>
            <h4 className='font-semibold'>{generatedContent.title}</h4>
            <div className='flex items-center gap-2'>
              <Badge variant='outline'>{generatedContent.type}</Badge>
              <Badge variant='outline'>{generatedContent.tone}</Badge>
              <Badge variant='outline'>{generatedContent.language}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='prose max-w-none'>
              <div className='bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto'>
                <pre className='whitespace-pre-wrap text-sm'>
                  {generatedContent.content}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        {generatedContent.analysis?.suggestions && (
          <Card>
            <CardHeader>
              <h4 className='font-semibold'>AI Suggestions</h4>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {generatedContent.analysis.suggestions.map(
                  (suggestion, index) => (
                    <Alert
                      key={index}
                      variant={
                        suggestion.priority === 'high' ? 'warning' : 'info'
                      }
                    >
                      <Lightbulb className='w-4 h-4' />
                      <div>
                        <div className='font-medium'>{suggestion.type}</div>
                        <div className='text-sm'>{suggestion.description}</div>
                      </div>
                    </Alert>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className='flex justify-end gap-3'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onGenerate(generatedContent)}>
            Use This Content
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <div className='p-2 bg-blue-100 rounded-lg'>
          <Sparkles className='w-6 h-6 text-blue-600' />
        </div>
        <div>
          <h2 className='text-xl font-semibold'>AI Content Generator</h2>
          <p className='text-gray-600'>
            Create high-quality content with artificial intelligence
          </p>
        </div>
      </div>

      {error && (
        <Alert variant='error'>
          <div>
            <div className='font-medium'>Generation Failed</div>
            <div className='text-sm'>{error}</div>
          </div>
        </Alert>
      )}

      {currentStep === 'generating' && renderProgress()}
      {currentStep === 'preview' && renderPreview()}

      {currentStep === 'input' && (
        <Tabs defaultValue='basic' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='basic'>Basic Settings</TabsTrigger>
            <TabsTrigger value='advanced'>Advanced Options</TabsTrigger>
            <TabsTrigger value='templates'>Templates</TabsTrigger>
          </TabsList>

          <TabsContent value='basic' className='space-y-6'>
            {/* Main prompt */}
            <Card>
              <CardHeader>
                <h3 className='font-semibold'>Content Prompt</h3>
                <p className='text-sm text-gray-600'>
                  Describe what you want to create. Be specific about your goals
                  and requirements.
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='Write an article about the benefits of renewable energy for small businesses, focusing on cost savings and environmental impact...'
                  rows={4}
                  className='resize-none'
                />

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleOptimizePrompt}
                  >
                    <Wand2 className='w-4 h-4' />
                    Optimize Prompt
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleAnalyzeTopic}
                  >
                    <BarChart3 className='w-4 h-4' />
                    Analyze Topic
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Content type */}
            <Card>
              <CardHeader>
                <h3 className='font-semibold'>Content Type</h3>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 lg:grid-cols-3 gap-3'>
                  {contentTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <div
                        key={type.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          contentType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setContentType(type.value)}
                      >
                        <div className='flex items-center gap-2 mb-1'>
                          <IconComponent className='w-4 h-4' />
                          <span className='font-medium'>{type.label}</span>
                        </div>
                        <p className='text-xs text-gray-600'>
                          {type.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Basic options */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <h3 className='font-semibold'>Tone & Style</h3>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Tone
                    </label>
                    <Select value={tone} onValueChange={setTone}>
                      {toneOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Style
                    </label>
                    <Select value={style} onValueChange={setStyle}>
                      {styleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className='font-semibold'>Target Audience</h3>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Audience
                    </label>
                    <Select value={audience} onValueChange={setAudience}>
                      {audienceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Length
                    </label>
                    <Select value={length} onValueChange={setLength}>
                      {lengthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <h3 className='font-semibold'>Keywords & SEO</h3>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder='Add keyword...'
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <Button onClick={addKeyword}>Add</Button>
                </div>

                {keywords.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant='outline'
                        className='cursor-pointer hover:bg-red-50'
                        onClick={() => removeKeyword(keyword)}
                      >
                        <Tag className='w-3 h-3 mr-1' />
                        {keyword}
                        <span className='ml-1'>×</span>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className='flex items-center gap-2'>
                  <Switch
                    checked={seoOptimized}
                    onCheckedChange={setSeoOptimized}
                  />
                  <label className='text-sm'>Optimize for SEO</label>
                </div>
              </CardContent>
            </Card>

            {/* Generate button */}
            <div className='flex justify-end gap-3'>
              <Button variant='outline' onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
              >
                <Sparkles className='w-4 h-4' />
                Generate Content
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='advanced' className='space-y-6'>
            {/* Advanced options */}
            <Card>
              <CardHeader>
                <h3 className='font-semibold'>Advanced Settings</h3>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium mb-2'>
                    Creativity Level: {creativityLevel}%
                  </label>
                  <Slider
                    value={[creativityLevel]}
                    onValueChange={(value) => setCreativityLevel(value[0])}
                    max={100}
                    step={10}
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>Conservative</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Format
                    </label>
                    <Select value={format} onValueChange={setFormat}>
                      {formatOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Language
                    </label>
                    <Select value={language} onValueChange={setLanguage}>
                      <option value='en'>English</option>
                      <option value='es'>Spanish</option>
                      <option value='fr'>French</option>
                      <option value='de'>German</option>
                      <option value='it'>Italian</option>
                      <option value='pt'>Portuguese</option>
                    </Select>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={includeOutline}
                      onCheckedChange={setIncludeOutline}
                    />
                    <label className='text-sm'>Include content outline</label>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2'>
                    Custom Instructions (Optional)
                  </label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder='Add specific requirements, examples, or constraints...'
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='templates' className='space-y-6'>
            {/* Template selection */}
            <Card>
              <CardHeader>
                <h3 className='font-semibold'>Content Templates</h3>
                <p className='text-sm text-gray-600'>
                  Use pre-built templates to generate structured content faster
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Switch
                    checked={useTemplate}
                    onCheckedChange={setUseTemplate}
                  />
                  <label className='text-sm'>Use template</label>
                </div>

                {useTemplate && (
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
                    {/* Template options would be loaded from backend */}
                    <div className='p-3 border rounded-lg cursor-pointer hover:border-gray-300'>
                      <h4 className='font-medium'>Blog Post Template</h4>
                      <p className='text-sm text-gray-600'>
                        Introduction, main points, conclusion
                      </p>
                    </div>
                    <div className='p-3 border rounded-lg cursor-pointer hover:border-gray-300'>
                      <h4 className='font-medium'>How-to Guide</h4>
                      <p className='text-sm text-gray-600'>
                        Step-by-step instructions format
                      </p>
                    </div>
                    <div className='p-3 border rounded-lg cursor-pointer hover:border-gray-300'>
                      <h4 className='font-medium'>Product Review</h4>
                      <p className='text-sm text-gray-600'>
                        Features, pros, cons, verdict
                      </p>
                    </div>
                    <div className='p-3 border rounded-lg cursor-pointer hover:border-gray-300'>
                      <h4 className='font-medium'>News Article</h4>
                      <p className='text-sm text-gray-600'>
                        Who, what, when, where, why
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AIContentGenerator;
