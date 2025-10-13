// Feedback Quick Action Component
// Provides easy access to feedback submission across all applications

import React, { useState } from 'react';

export const FeedbackQuickAction = ({
  size = 'default',
  variant = 'button',
  position = 'bottom-right',
  showLabel = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    type: 'general',
    priority: 'medium',
    category: 'feedback',
    title: '',
    description: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const enhancedFeedback = {
        ...feedback,
        timestamp: new Date().toISOString(),
        url: typeof window !== "undefined" && window.location.href,
        userAgent: typeof navigator !== "undefined" && navigator.userAgent,
        appType: process.env.VITE_APP_TYPE || 'unknown',
        context: {
          pathname: typeof window !== "undefined" && window.location.pathname,
          search: typeof window !== "undefined" && window.location.search,
          referrer: typeof document !== "undefined" && document.referrer,
          viewport: {
            width: typeof window !== "undefined" && window.innerWidth,
            height: typeof window !== "undefined" && window.innerHeight
          },
          screen: {
            width: screen.width,
            height: screen.height
          },
          performance: {
            memory: performance.memory ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize
            } : null,
            connection: typeof navigator !== "undefined" && navigator.connection ? {
              effectiveType: typeof navigator !== "undefined" && navigator.connection.effectiveType,
              downlink: typeof navigator !== "undefined" && navigator.connection.downlink
            } : null
          }
        }
      };

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedFeedback)
      });

      if (response.ok) {
        setSubmitted(true);
        setFeedback({
          type: 'general',
          priority: 'medium',
          category: 'feedback',
          title: '',
          description: '',
          email: ''
        });

        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (_error) {
      // console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sizeClasses = {
    small: 'w-10 h-10',
    default: 'w-12 h-12',
    large: 'w-14 h-14'
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
    'inline': 'relative'
  };

  if (variant === 'floating') {
    return (
      <>
        {/* Floating Action Button */}
        <div className={`${positionClasses[position]} z-40`}>
          <button
            onClick={() => setIsOpen(true)}
            className={`${sizeClasses[size]} bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group`}
            title='Send Feedback'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-2.725.689a1.125 1.125 0 01-1.375-1.375l.688-2.725A8.962 8.962 0 013 12C3 7.582 6.582 4 12 4s8 3.582 8 8z' />
            </svg>
            {showLabel && (
              <span className='absolute right-full mr-3 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                Send Feedback
              </span>
            )}
          </button>
        </div>

        {/* Feedback Modal */}
        {isOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
              <div className='p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>Send Feedback</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>

                {submitted ? (
                  <div className='text-center py-8'>
                    <svg className='w-16 h-16 text-green-500 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                    <h4 className='text-lg font-medium text-gray-900 mb-2'>Thank you!</h4>
                    <p className='text-gray-600'>Your feedback has been submitted successfully.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Type
                        </label>
                        <select
                          value={feedback.type}
                          onChange={(e) => setFeedback({...feedback, type: e.target.value})}
                          className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          <option value='general'>General Feedback</option>
                          <option value='bug_report'>Bug Report</option>
                          <option value='feature_request'>Feature Request</option>
                          <option value='improvement'>Improvement</option>
                          <option value='question'>Question</option>
                          <option value='complaint'>Complaint</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Priority
                        </label>
                        <select
                          value={feedback.priority}
                          onChange={(e) => setFeedback({...feedback, priority: e.target.value})}
                          className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          <option value='low'>Low</option>
                          <option value='medium'>Medium</option>
                          <option value='high'>High</option>
                          <option value='urgent'>Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Title
                      </label>
                      <input
                        type='text'
                        value={feedback.title}
                        onChange={(e) => setFeedback({...feedback, title: e.target.value})}
                        placeholder='Brief summary of your feedback'
                        className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Description
                      </label>
                      <textarea
                        value={feedback.description}
                        onChange={(e) => setFeedback({...feedback, description: e.target.value})}
                        placeholder='Please provide detailed feedback...'
                        rows={4}
                        className='w-full border border-gray-300 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Email (optional)
                      </label>
                      <input
                        type='email'
                        value={feedback.email}
                        onChange={(e) => setFeedback({...feedback, email: e.target.value})}
                        placeholder='your@email.com'
                        className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Provide your email if you'd like a response
                      </p>
                    </div>

                    <div className='flex justify-end space-x-3 pt-4'>
                      <button
                        type='button'
                        onClick={() => setIsOpen(false)}
                        className='px-4 py-2 text-gray-600 hover:text-gray-800'
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type='submit'
                        disabled={isSubmitting || !feedback.title || !feedback.description}
                        className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {isSubmitting ? 'Submitting...' : 'Send Feedback'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Regular button variant
  return (
    <button
      onClick={() => setIsOpen(true)}
      className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
    >
      <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-2.725.689a1.125 1.125 0 01-1.375-1.375l.688-2.725A8.962 8.962 0 013 12C3 7.582 6.582 4 12 4s8 3.582 8 8z' />
      </svg>
      Feedback
    </button>
  );
};

export default FeedbackQuickAction;