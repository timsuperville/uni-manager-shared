/**
 * AuthLayout Component
 * Unified authentication layout with app-specific branding
 */
import React from 'react';
import { getCurrentAppConfig } from '../config/appConfigs.js';

const AuthLayout = ({
  children,
  showLogo = true,
  showBackground = true,
  className = '',
}) => {
  const appConfig = getCurrentAppConfig();

  return (
    <div className={`min-h-screen flex ${className} overflow-hidden bg-gray-50 dark:bg-gray-900`}>
      {/* Background Pattern - Left Side */}
      {showBackground && (
        <div className='hidden lg:flex lg:flex-1 lg:relative overflow-hidden'>
          <div
            className={`absolute inset-0 bg-gradient-to-br ${appConfig.branding.gradientFrom} ${appConfig.branding.gradientTo} animate-gradient-xy`}
          >
            {/* Decorative Circles */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
              <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl mix-blend-overlay animate-blob"></div>
              <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-purple-300 blur-3xl mix-blend-overlay animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-pink-300 blur-3xl mix-blend-overlay animate-blob animation-delay-4000"></div>
            </div>

            {/* Pattern overlay */}
            <div className='absolute inset-0 bg-black/10 backdrop-blur-[1px]'>
              <svg
                className='absolute inset-0 h-full w-full'
                fill='none'
                viewBox='0 0 100 100'
                preserveAspectRatio='none'
              >
                <defs>
                  <pattern
                    id='grid'
                    width='10'
                    height='10'
                    patternUnits='userSpaceOnUse'
                  >
                    <path
                      d='M 10 0 L 0 0 0 10'
                      fill='none'
                      stroke='rgba(255,255,255,0.1)'
                      strokeWidth='0.5'
                    />
                  </pattern>
                </defs>
                <rect width='100' height='100' fill='url(#grid)' />
              </svg>
            </div>
          </div>

          {/* Content overlay */}
          <div className='relative z-10 flex flex-col justify-center px-16 py-16 w-full max-w-2xl mx-auto'>
            <div className='text-white space-y-8 animate-slideRightFade'>
              {showLogo && (
                <div>
                  <div className="inline-block p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-6 border border-white/20 shadow-xl">
                    {/* Replace with actual logo if available, leveraging appConfig icon or text */}
                    <span className="text-4xl">{appConfig.branding.icon || '🚀'}</span>
                  </div>
                  <h1 className='text-5xl font-extrabold tracking-tight mb-2 drop-shadow-sm'>
                    {appConfig.appName}
                  </h1>
                  <div className='w-24 h-1.5 bg-white/40 rounded-full backdrop-blur-sm'></div>
                </div>
              )}

              <div className='space-y-6'>
                <h2 className='text-3xl font-light text-white/90'>Welcome to our platform</h2>
                <p className='text-xl text-white/80 max-w-md leading-relaxed'>
                  Secure, reliable, and built with your privacy in mind.
                </p>

                <div className='space-y-5 text-white/90 pt-4'>
                  {[
                    {
                      text: 'Secure authentication', icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      )
                    },
                    {
                      text: 'Privacy protected', icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      )
                    },
                    {
                      text: 'Always available', icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )
                    }
                  ].map((feature, idx) => (
                    <div key={idx} className='flex items-center space-x-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors'>
                      <div className="p-2 bg-white/10 rounded-lg">
                        <svg className='w-6 h-6' fill='none' stroke="currentColor" viewBox='0 0 24 24'>{feature.icon}</svg>
                      </div>
                      <span className="font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className='flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-20'>
        <div className='w-full max-w-md mx-auto'>
          {/* Mobile logo */}
          {showLogo && (
            <div className='lg:hidden text-center mb-10'>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl shadow-lg mb-4">
                {appConfig.branding.icon || '🚀'}
              </div>
              <h1
                className={`text-3xl font-bold bg-gradient-to-r ${appConfig.branding.gradientFrom} ${appConfig.branding.gradientTo} bg-clip-text text-transparent`}
              >
                {appConfig.appName}
              </h1>
            </div>
          )}

          {children}

          {/* Footer */}
          <div className='mt-8 text-center'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              © {new Date().getFullYear()} {appConfig.appName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
