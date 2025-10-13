import React, { useState, useEffect, useCallback } from 'react';
import {
  FiBell,
  FiMail,
  FiMessageSquare,
  FiSmartphone,
  FiSettings,
  FiCheck,
  FiX,
  FiClock,
  FiVolume2,
  FiVolumeX,
  FiToggleLeft,
  FiToggleRight,
  FiSave,
  FiRefreshCw,
} from 'react-icons/fi';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { Slider } from '../ui/Slider';
import { TimePicker } from '../ui/TimePicker';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';

/**
 * NotificationPreferences - Comprehensive notification preference management interface
 *
 * Features:
 * - Multi-channel notification preferences (email, SMS, push, in-app)
 * - Notification type filtering and priority settings
 * - Quiet hours configuration
 * - Frequency and batching preferences
 * - Sound and vibration settings
 * - Template and language preferences
 * - Advanced delivery optimization settings
 * - Real-time preference updates
 * - Export/import preferences
 */
const NotificationPreferences = ({
  isOpen = false,
  onClose = () => {},
  userId = null,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('channels');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Custom hook for preference management
  const {
    preferences,
    isLoading: preferencesLoading,
    error,
    updatePreferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
    refreshPreferences,
  } = useNotificationPreferences(userId);

  // Local preference state
  const [localPreferences, setLocalPreferences] = useState({
    channels: {
      email: { enabled: true, frequency: 'immediate' },
      sms: { enabled: false, frequency: 'daily' },
      push: { enabled: true, frequency: 'immediate' },
      inApp: { enabled: true, frequency: 'immediate' },
      slack: { enabled: false, frequency: 'immediate' },
      teams: { enabled: false, frequency: 'immediate' },
    },
    types: {
      user: { enabled: true, priority: 'all' },
      system: { enabled: true, priority: 'high' },
      church: { enabled: true, priority: 'all' },
      business: { enabled: true, priority: 'normal' },
      security: { enabled: true, priority: 'all' },
      workflow: { enabled: true, priority: 'high' },
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      allowUrgent: true,
    },
    delivery: {
      batching: false,
      batchInterval: 60,
      maxBatchSize: 10,
      smartTiming: true,
      respectUserActivity: true,
    },
    interface: {
      sound: true,
      vibration: true,
      volume: 0.7,
      soundTheme: 'default',
      showPreviews: true,
      markReadOnClick: true,
      autoArchive: false,
      autoArchiveDays: 30,
    },
    advanced: {
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      emailTemplate: 'default',
      consolidateDigests: true,
      enableAnalytics: true,
      debugMode: false,
    },
  });

  // Sync local preferences with fetched preferences
  useEffect(() => {
    if (preferences && Object.keys(preferences).length > 0) {
      setLocalPreferences((prev) => ({
        ...prev,
        ...preferences,
      }));
    }
  }, [preferences]);

  // Track changes
  useEffect(() => {
    setHasChanges(
      JSON.stringify(localPreferences) !== JSON.stringify(preferences)
    );
  }, [localPreferences, preferences]);

  // Handle preference update
  const updateLocalPreference = useCallback((section, key, value) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]:
          typeof value === 'object'
            ? { ...prev[section][key], ...value }
            : value,
      },
    }));
  }, []);

  // Handle nested preference update
  const updateNestedPreference = useCallback(
    (section, parentKey, childKey, value) => {
      setLocalPreferences((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [parentKey]: {
            ...prev[section][parentKey],
            [childKey]: value,
          },
        },
      }));
    },
    []
  );

  // Save preferences
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    setSaveStatus(null);

    try {
      await updatePreferences(localPreferences);
      setSaveStatus('success');
      setHasChanges(false);

      setTimeout(() => setSaveStatus(null), 3000);
    } catch (_error) {
      // console.error('Failed to save preferences:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [localPreferences, updatePreferences]);

  // Reset preferences
  const handleReset = useCallback(async () => {
    if (
      typeof window !== "undefined" && window.confirm(
        'Are you sure you want to reset all preferences to default?'
      )
    ) {
      setIsLoading(true);
      try {
        await resetPreferences();
        await refreshPreferences();
        setSaveStatus('reset');
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (_error) {
        // console.error('Failed to reset preferences:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 5000);
      } finally {
        setIsLoading(false);
      }
    }
  }, [resetPreferences, refreshPreferences]);

  // Export preferences
  const handleExport = useCallback(async () => {
    try {
      const exported = await exportPreferences();
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = typeof document !== "undefined" && document.createElement('a');
      link.href = url;
      link.download = `notification-preferences-${new Date().toISOString().split('T')[0]}.json`;
      typeof document !== "undefined" && document.body.appendChild(link);
      link.click();
      typeof document !== "undefined" && document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSaveStatus('exported');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (_error) {
      // console.error('Failed to export preferences:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 5000);
    }
  }, [exportPreferences]);

  // Frequency options
  const frequencyOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily Digest' },
    { value: 'weekly', label: 'Weekly Summary' },
    { value: 'never', label: 'Never' },
  ];

  // Priority options
  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent Only' },
    { value: 'high', label: 'High & Urgent' },
    { value: 'normal', label: 'Normal & Above' },
    { value: 'never', label: 'Never' },
  ];

  // Sound theme options
  const soundThemeOptions = [
    { value: 'default', label: 'Default' },
    { value: 'subtle', label: 'Subtle' },
    { value: 'professional', label: 'Professional' },
    { value: 'cheerful', label: 'Cheerful' },
    { value: 'custom', label: 'Custom' },
  ];

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
  ];

  // Render channel preferences
  const renderChannelPreferences = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Delivery Channels
        </h3>
        <div className='space-y-4'>
          {Object.entries(localPreferences.channels).map(
            ([channel, settings]) => {
              const channelIcons = {
                email: FiMail,
                sms: FiMessageSquare,
                push: FiSmartphone,
                inApp: FiBell,
                slack: FiMessageSquare,
                teams: FiMessageSquare,
              };

              const Icon = channelIcons[channel] || FiBell;

              return (
                <Card key={channel} className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <Icon className='w-5 h-5 text-gray-600' />
                      <span className='font-medium text-gray-900 capitalize'>
                        {channel === 'inApp' ? 'In-App' : channel}
                      </span>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onChange={(enabled) =>
                        updateNestedPreference(
                          'channels',
                          channel,
                          'enabled',
                          enabled
                        )
                      }
                    />
                  </div>

                  {settings.enabled && (
                    <div className='ml-8'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Frequency
                      </label>
                      <Select
                        value={settings.frequency}
                        onChange={(frequency) =>
                          updateNestedPreference(
                            'channels',
                            channel,
                            'frequency',
                            frequency
                          )
                        }
                        options={frequencyOptions}
                        className='w-full'
                      />
                    </div>
                  )}
                </Card>
              );
            }
          )}
        </div>
      </div>
    </div>
  );

  // Render type preferences
  const renderTypePreferences = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Notification Types
        </h3>
        <div className='space-y-4'>
          {Object.entries(localPreferences.types).map(([type, settings]) => (
            <Card key={type} className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <span className='font-medium text-gray-900 capitalize'>
                  {type}
                </span>
                <Switch
                  checked={settings.enabled}
                  onChange={(enabled) =>
                    updateNestedPreference('types', type, 'enabled', enabled)
                  }
                />
              </div>

              {settings.enabled && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Priority Level
                  </label>
                  <Select
                    value={settings.priority}
                    onChange={(priority) =>
                      updateNestedPreference(
                        'types',
                        type,
                        'priority',
                        priority
                      )
                    }
                    options={priorityOptions}
                    className='w-full'
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Render quiet hours preferences
  const renderQuietHoursPreferences = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>Quiet Hours</h3>
        <Card className='p-4'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center space-x-3'>
              <FiVolumeX className='w-5 h-5 text-gray-600' />
              <span className='font-medium text-gray-900'>
                Enable Quiet Hours
              </span>
            </div>
            <Switch
              checked={localPreferences.quietHours.enabled}
              onChange={(enabled) =>
                updateLocalPreference('quietHours', 'enabled', enabled)
              }
            />
          </div>

          {localPreferences.quietHours.enabled && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Start Time
                  </label>
                  <TimePicker
                    value={localPreferences.quietHours.startTime}
                    onChange={(time) =>
                      updateLocalPreference('quietHours', 'startTime', time)
                    }
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    End Time
                  </label>
                  <TimePicker
                    value={localPreferences.quietHours.endTime}
                    onChange={(time) =>
                      updateLocalPreference('quietHours', 'endTime', time)
                    }
                  />
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>
                  Allow urgent notifications
                </span>
                <Switch
                  checked={localPreferences.quietHours.allowUrgent}
                  onChange={(allowUrgent) =>
                    updateLocalPreference(
                      'quietHours',
                      'allowUrgent',
                      allowUrgent
                    )
                  }
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  // Render delivery preferences
  const renderDeliveryPreferences = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Delivery Options
        </h3>
        <div className='space-y-4'>
          <Card className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <span className='font-medium text-gray-900'>
                Batch Notifications
              </span>
              <Switch
                checked={localPreferences.delivery.batching}
                onChange={(batching) =>
                  updateLocalPreference('delivery', 'batching', batching)
                }
              />
            </div>

            {localPreferences.delivery.batching && (
              <div className='space-y-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Batch Interval (minutes)
                  </label>
                  <Slider
                    value={localPreferences.delivery.batchInterval}
                    onChange={(batchInterval) =>
                      updateLocalPreference(
                        'delivery',
                        'batchInterval',
                        batchInterval
                      )
                    }
                    min={5}
                    max={240}
                    step={5}
                    className='w-full'
                  />
                  <span className='text-sm text-gray-500'>
                    {localPreferences.delivery.batchInterval} minutes
                  </span>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Max Batch Size
                  </label>
                  <Slider
                    value={localPreferences.delivery.maxBatchSize}
                    onChange={(maxBatchSize) =>
                      updateLocalPreference(
                        'delivery',
                        'maxBatchSize',
                        maxBatchSize
                      )
                    }
                    min={1}
                    max={50}
                    step={1}
                    className='w-full'
                  />
                  <span className='text-sm text-gray-500'>
                    {localPreferences.delivery.maxBatchSize} notifications
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card className='p-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-gray-900'>Smart Timing</span>
                <Switch
                  checked={localPreferences.delivery.smartTiming}
                  onChange={(smartTiming) =>
                    updateLocalPreference(
                      'delivery',
                      'smartTiming',
                      smartTiming
                    )
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='font-medium text-gray-900'>
                  Respect User Activity
                </span>
                <Switch
                  checked={localPreferences.delivery.respectUserActivity}
                  onChange={(respectUserActivity) =>
                    updateLocalPreference(
                      'delivery',
                      'respectUserActivity',
                      respectUserActivity
                    )
                  }
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render interface preferences
  const renderInterfacePreferences = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Interface Settings
        </h3>
        <div className='space-y-4'>
          <Card className='p-4'>
            <h4 className='font-medium text-gray-900 mb-3'>Sound & Alerts</h4>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>Enable Sound</span>
                <Switch
                  checked={localPreferences.interface.sound}
                  onChange={(sound) =>
                    updateLocalPreference('interface', 'sound', sound)
                  }
                />
              </div>

              {localPreferences.interface.sound && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Volume
                    </label>
                    <Slider
                      value={localPreferences.interface.volume}
                      onChange={(volume) =>
                        updateLocalPreference('interface', 'volume', volume)
                      }
                      min={0}
                      max={1}
                      step={0.1}
                      className='w-full'
                    />
                    <span className='text-sm text-gray-500'>
                      {Math.round(localPreferences.interface.volume * 100)}%
                    </span>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Sound Theme
                    </label>
                    <Select
                      value={localPreferences.interface.soundTheme}
                      onChange={(soundTheme) =>
                        updateLocalPreference(
                          'interface',
                          'soundTheme',
                          soundTheme
                        )
                      }
                      options={soundThemeOptions}
                      className='w-full'
                    />
                  </div>
                </>
              )}

              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>Enable Vibration</span>
                <Switch
                  checked={localPreferences.interface.vibration}
                  onChange={(vibration) =>
                    updateLocalPreference('interface', 'vibration', vibration)
                  }
                />
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <h4 className='font-medium text-gray-900 mb-3'>Display Options</h4>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>Show Previews</span>
                <Switch
                  checked={localPreferences.interface.showPreviews}
                  onChange={(showPreviews) =>
                    updateLocalPreference(
                      'interface',
                      'showPreviews',
                      showPreviews
                    )
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>
                  Mark as Read on Click
                </span>
                <Switch
                  checked={localPreferences.interface.markReadOnClick}
                  onChange={(markReadOnClick) =>
                    updateLocalPreference(
                      'interface',
                      'markReadOnClick',
                      markReadOnClick
                    )
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>Auto Archive</span>
                <Switch
                  checked={localPreferences.interface.autoArchive}
                  onChange={(autoArchive) =>
                    updateLocalPreference(
                      'interface',
                      'autoArchive',
                      autoArchive
                    )
                  }
                />
              </div>

              {localPreferences.interface.autoArchive && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Archive after (days)
                  </label>
                  <Slider
                    value={localPreferences.interface.autoArchiveDays}
                    onChange={(autoArchiveDays) =>
                      updateLocalPreference(
                        'interface',
                        'autoArchiveDays',
                        autoArchiveDays
                      )
                    }
                    min={1}
                    max={90}
                    step={1}
                    className='w-full'
                  />
                  <span className='text-sm text-gray-500'>
                    {localPreferences.interface.autoArchiveDays} days
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render advanced preferences
  const renderAdvancedPreferences = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Advanced Settings
        </h3>
        <div className='space-y-4'>
          <Card className='p-4'>
            <h4 className='font-medium text-gray-900 mb-3'>Localization</h4>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Language
                </label>
                <Select
                  value={localPreferences.advanced.language}
                  onChange={(language) =>
                    updateLocalPreference('advanced', 'language', language)
                  }
                  options={languageOptions}
                  className='w-full'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Timezone
                </label>
                <select
                  value={localPreferences.advanced.timezone}
                  onChange={(e) =>
                    updateLocalPreference(
                      'advanced',
                      'timezone',
                      e.target.value
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  {Intl.supportedValuesOf('timeZone').map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <h4 className='font-medium text-gray-900 mb-3'>Email Settings</h4>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Email Template
              </label>
              <Select
                value={localPreferences.advanced.emailTemplate}
                onChange={(emailTemplate) =>
                  updateLocalPreference(
                    'advanced',
                    'emailTemplate',
                    emailTemplate
                  )
                }
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'minimal', label: 'Minimal' },
                  { value: 'detailed', label: 'Detailed' },
                  { value: 'modern', label: 'Modern' },
                ]}
                className='w-full'
              />
            </div>
          </Card>

          <Card className='p-4'>
            <h4 className='font-medium text-gray-900 mb-3'>System Options</h4>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>
                  Consolidate Digests
                </span>
                <Switch
                  checked={localPreferences.advanced.consolidateDigests}
                  onChange={(consolidateDigests) =>
                    updateLocalPreference(
                      'advanced',
                      'consolidateDigests',
                      consolidateDigests
                    )
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>Enable Analytics</span>
                <Switch
                  checked={localPreferences.advanced.enableAnalytics}
                  onChange={(enableAnalytics) =>
                    updateLocalPreference(
                      'advanced',
                      'enableAnalytics',
                      enableAnalytics
                    )
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700'>Debug Mode</span>
                <Switch
                  checked={localPreferences.advanced.debugMode}
                  onChange={(debugMode) =>
                    updateLocalPreference('advanced', 'debugMode', debugMode)
                  }
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // Tab configuration
  const tabs = [
    { id: 'channels', label: 'Channels', icon: FiBell },
    { id: 'types', label: 'Types', icon: FiSettings },
    { id: 'schedule', label: 'Schedule', icon: FiClock },
    { id: 'delivery', label: 'Delivery', icon: FiMessageSquare },
    { id: 'interface', label: 'Interface', icon: FiVolume2 },
    { id: 'advanced', label: 'Advanced', icon: FiSettings },
  ];

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Notification Preferences'
      size='lg'
    >
      <div className='flex h-96'>
        {/* Sidebar */}
        <div className='w-48 border-r border-gray-200 pr-4'>
          <nav className='space-y-1'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className='w-4 h-4 mr-3' />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className='flex-1 pl-6'>
          <div className='h-full overflow-y-auto'>
            {preferencesLoading ? (
              <div className='flex items-center justify-center h-32'>
                <LoadingSpinner size='md' />
              </div>
            ) : error ? (
              <div className='text-center py-8'>
                <p className='text-red-600 mb-4'>Failed to load preferences</p>
                <Button onClick={refreshPreferences} variant='outline'>
                  <FiRefreshCw className='w-4 h-4 mr-2' />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {activeTab === 'channels' && renderChannelPreferences()}
                {activeTab === 'types' && renderTypePreferences()}
                {activeTab === 'schedule' && renderQuietHoursPreferences()}
                {activeTab === 'delivery' && renderDeliveryPreferences()}
                {activeTab === 'interface' && renderInterfacePreferences()}
                {activeTab === 'advanced' && renderAdvancedPreferences()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='mt-6 flex items-center justify-between border-t border-gray-200 pt-4'>
        <div className='flex items-center space-x-2'>
          <Button onClick={handleExport} variant='outline' size='sm'>
            Export
          </Button>

          <Button
            onClick={handleReset}
            variant='outline'
            size='sm'
            className='text-red-600 hover:text-red-700'
          >
            Reset
          </Button>
        </div>

        <div className='flex items-center space-x-2'>
          {saveStatus && (
            <span
              className={`text-sm ${
                saveStatus === 'success' ||
                saveStatus === 'reset' ||
                saveStatus === 'exported'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {saveStatus === 'success' && 'Preferences saved'}
              {saveStatus === 'reset' && 'Preferences reset'}
              {saveStatus === 'exported' && 'Preferences exported'}
              {saveStatus === 'error' && 'Failed to save'}
            </span>
          )}

          <Button onClick={onClose} variant='outline'>
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className='flex items-center'
          >
            {isLoading ? (
              <LoadingSpinner size='sm' className='mr-2' />
            ) : (
              <FiSave className='w-4 h-4 mr-2' />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationPreferences;
