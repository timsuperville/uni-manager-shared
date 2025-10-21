/**
 * SSO App Switcher Component
 *
 * Provides a unified interface for switching between applications
 * Displays available apps based on user permissions
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSSO } from '../context/SSOContext.jsx';
import './AppSwitcher.css';

const AppSwitcher = () => {
  const {
    currentApp,
    availableApps,
    switchToApp,
    hasAppPermission,
    getAppInfo,
    ssoLoading,
    ssoError,
  } = useSSO();

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleAppSwitch = async (appId) => {
    if (appId === currentApp || switching) return;

    try {
      setSwitching(appId);
      setIsOpen(false);
      await switchToApp(appId);
    } catch (error) {
      console.error('App switch failed:', error);
      // Error handling is managed by SSOContext
    } finally {
      setSwitching(null);
    }
  };

  const getCurrentAppInfo = () => {
    return getAppInfo(currentApp);
  };

  const getAppIcon = (appId) => {
    const icons = {
      church: '⛪',
      admin: '🔧',
      business: '💼',
      home: '🏠',
      personal: '👤',
      playback: '▶️',
    };
    return icons[appId] || '📱';
  };

  const getAppDisplayName = (appId) => {
    const names = {
      church: 'Church Management',
      admin: 'Administration',
      business: 'Business Tools',
      home: 'Home Services',
      personal: 'Personal Dashboard',
      playback: 'Media Playback',
    };
    return names[appId] || 'Unknown App';
  };

  if (ssoLoading || !currentApp) {
    return (
      <div className='app-switcher loading'>
        <div className='app-switcher-button disabled'>
          <span className='app-icon'>📱</span>
          <span className='app-name'>Loading...</span>
        </div>
      </div>
    );
  }

  const filteredApps = availableApps.filter(
    (app) => app.id !== currentApp && hasAppPermission(app.id)
  );

  return (
    <div className='app-switcher' ref={dropdownRef}>
      <button
        className={`app-switcher-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        <span className='app-icon'>{getAppIcon(currentApp)}</span>
        <span className='app-name'>{getAppDisplayName(currentApp)}</span>
        <span className='dropdown-arrow'>▼</span>
      </button>

      {isOpen && (
        <div className='app-switcher-dropdown' role='listbox'>
          <div className='dropdown-header'>
            <span>Switch Application</span>
          </div>

          {filteredApps.length === 0 ? (
            <div className='no-apps'>
              <span>No other apps available</span>
            </div>
          ) : (
            <div className='app-list'>
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  className={`app-option ${switching === app.id ? 'switching' : ''}`}
                  onClick={() => handleAppSwitch(app.id)}
                  disabled={switching}
                  role='option'
                >
                  <span className='app-icon'>{getAppIcon(app.id)}</span>
                  <div className='app-details'>
                    <span className='app-name'>
                      {getAppDisplayName(app.id)}
                    </span>
                    <span className='app-description'>{app.description}</span>
                  </div>
                  {switching === app.id && (
                    <span className='switching-indicator'>🔄</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className='dropdown-footer'>
            <span className='current-app'>
              Currently in: {getAppDisplayName(currentApp)}
            </span>
          </div>
        </div>
      )}

      {ssoError && (
        <div className='sso-error' role='alert'>
          <span className='error-icon'>⚠️</span>
          <span className='error-message'>{ssoError}</span>
        </div>
      )}

      {switching && (
        <div className='switching-overlay'>
          <div className='switching-message'>
            <span className='switching-icon'>🔄</span>
            <span>Switching to {getAppDisplayName(switching)}...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppSwitcher;
