import React, { useState, useEffect, useCallback } from "react";
import {
  FiBell,
  FiMail,
  FiMessageSquare,
  FiSmartphone,
  FiSettings,
  FiClock,
  FiVolume2,
  FiVolumeX,
  FiSave,
  FiRefreshCw,
  FiDownload,
} from "react-icons/fi";
import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";
import type { NotificationPreferences as StoredPreferences } from "../../hooks/useNotificationPreferences";
import {
  Button,
  Card,
  Switch,
  Select,
  TimePicker,
  LoadingSpinner,
  Modal,
} from "@shared/components/ui";
import { Slider } from "@shared/components/ui/Slider";

// ── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = "success" | "error" | "reset" | "exported" | null;
type ActiveTab =
  | "channels"
  | "types"
  | "schedule"
  | "delivery"
  | "interface"
  | "advanced";

interface ChannelSettings {
  enabled: boolean;
  frequency: string;
}

interface TypeSettings {
  enabled: boolean;
  priority: string;
}

interface QuietHoursSettings {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  allowUrgent: boolean;
}

interface DeliverySettings {
  batching: boolean;
  batchInterval: number;
  maxBatchSize: number;
  smartTiming: boolean;
  respectUserActivity: boolean;
}

interface InterfaceSettings {
  sound: boolean;
  vibration: boolean;
  volume: number;
  soundTheme: string;
  showPreviews: boolean;
  markReadOnClick: boolean;
  autoArchive: boolean;
  autoArchiveDays: number;
}

interface AdvancedSettings {
  language: string;
  timezone: string;
  emailTemplate: string;
  consolidateDigests: boolean;
  enableAnalytics: boolean;
  debugMode: boolean;
}

interface LocalPreferences {
  channels: Record<string, ChannelSettings>;
  types: Record<string, TypeSettings>;
  quietHours: QuietHoursSettings;
  delivery: DeliverySettings;
  interface: InterfaceSettings;
  advanced: AdvancedSettings;
}

interface TabConfig {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SelectOption {
  value: string;
  label: string;
}

interface NotificationPreferencesProps {
  isOpen?: boolean;
  onClose?: () => void;
  userId?: string | null;
}

// ── Default state ─────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: LocalPreferences = {
  channels: {
    email: { enabled: true, frequency: "immediate" },
    sms: { enabled: false, frequency: "daily" },
    push: { enabled: true, frequency: "immediate" },
    inApp: { enabled: true, frequency: "immediate" },
    slack: { enabled: false, frequency: "immediate" },
    teams: { enabled: false, frequency: "immediate" },
  },
  types: {
    user: { enabled: true, priority: "all" },
    system: { enabled: true, priority: "high" },
    church: { enabled: true, priority: "all" },
    business: { enabled: true, priority: "normal" },
    security: { enabled: true, priority: "all" },
    workflow: { enabled: true, priority: "high" },
  },
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
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
    soundTheme: "default",
    showPreviews: true,
    markReadOnClick: true,
    autoArchive: false,
    autoArchiveDays: 30,
  },
  advanced: {
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailTemplate: "default",
    consolidateDigests: true,
    enableAnalytics: true,
    debugMode: false,
  },
};

const CHANNEL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  email: FiMail,
  sms: FiMessageSquare,
  push: FiSmartphone,
  inApp: FiBell,
  slack: FiMessageSquare,
  teams: FiMessageSquare,
};

// ── Options ───────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: SelectOption[] = [
  { value: "immediate", label: "Immediate" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Summary" },
  { value: "never", label: "Never" },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent Only" },
  { value: "high", label: "High & Urgent" },
  { value: "normal", label: "Normal & Above" },
  { value: "never", label: "Never" },
];

const SOUND_THEME_OPTIONS: SelectOption[] = [
  { value: "default", label: "Default" },
  { value: "subtle", label: "Subtle" },
  { value: "professional", label: "Professional" },
  { value: "cheerful", label: "Cheerful" },
  { value: "custom", label: "Custom" },
];

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
];

const TABS: TabConfig[] = [
  { id: "channels", label: "Channels", icon: FiBell },
  { id: "types", label: "Types", icon: FiSettings },
  { id: "schedule", label: "Schedule", icon: FiClock },
  { id: "delivery", label: "Delivery", icon: FiMessageSquare },
  { id: "interface", label: "Interface", icon: FiVolume2 },
  { id: "advanced", label: "Advanced", icon: FiSettings },
];

// ── Component ─────────────────────────────────────────────────────────────────

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
const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  isOpen = false,
  onClose = () => {},
  userId = null,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("channels");
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const {
    preferences,
    isLoading: preferencesLoading,
    error,
    updatePreferences,
    resetPreferences,
    exportPreferences,
    refreshPreferences,
  } = useNotificationPreferences(userId);

  const [localPreferences, setLocalPreferences] =
    useState<LocalPreferences>(DEFAULT_PREFERENCES);

  // Sync from server
  useEffect(() => {
    if (preferences && Object.keys(preferences).length > 0) {
      setLocalPreferences((prev) => ({
        ...prev,
        ...(preferences as unknown as Partial<LocalPreferences>),
      }));
    }
  }, [preferences]);

  // Track changes
  useEffect(() => {
    setHasChanges(
      JSON.stringify(localPreferences) !== JSON.stringify(preferences),
    );
  }, [localPreferences, preferences]);

  // ── Updaters ───────────────────────────────────────────────────────────────

  const updateLocalPreference = useCallback(
    <K extends keyof LocalPreferences>(
      section: K,
      key: keyof LocalPreferences[K],
      value: unknown,
    ) => {
      setLocalPreferences((prev) => {
        const sectionData = prev[section] as Record<string, unknown>;
        const existing = sectionData[key as string];
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [key]:
              typeof value === "object" &&
              value !== null &&
              typeof existing === "object" &&
              existing !== null
                ? {
                    ...(existing as Record<string, unknown>),
                    ...(value as Record<string, unknown>),
                  }
                : value,
          },
        };
      });
    },
    [],
  );

  const updateNestedPreference = useCallback(
    <K extends keyof LocalPreferences>(
      section: K,
      parentKey: string,
      childKey: string,
      value: unknown,
    ) => {
      setLocalPreferences((prev) => {
        const sectionData = prev[section] as unknown as Record<
          string,
          Record<string, unknown>
        >;
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [parentKey]: {
              ...sectionData[parentKey],
              [childKey]: value,
            },
          },
        };
      });
    },
    [],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    setSaveStatus(null);
    try {
      await updatePreferences(localPreferences as unknown as StoredPreferences);
      setSaveStatus("success");
      setHasChanges(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [localPreferences, updatePreferences]);

  const handleReset = useCallback(() => setConfirmReset(true), []);

  const handleResetConfirmed = useCallback(async () => {
    setConfirmReset(false);
    setIsLoading(true);
    try {
      await resetPreferences();
      await refreshPreferences();
      setSaveStatus("reset");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setIsLoading(false);
    }
  }, [resetPreferences, refreshPreferences]);

  const handleExport = useCallback(async () => {
    try {
      const exported = await exportPreferences();
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `notification-preferences-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSaveStatus("exported");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 5000);
    }
  }, [exportPreferences]);

  // ── Tab renderers ──────────────────────────────────────────────────────────

  const renderChannelPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-() tracking-tight mb-4">
          Delivery Channels
        </h3>
        <div className="space-y-4">
          {Object.entries(localPreferences.channels).map(
            ([channel, settings]) => {
              const Icon = CHANNEL_ICONS[channel] ?? FiBell;
              return (
                <div
                  key={channel}
                  className="p-5 glass-card rounded-2xl border border-()"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-() border border-() border-opacity-30">
                        <Icon className="w-5 h-5 text-()" />
                      </div>
                      <span className="font-semibold text-() capitalize">
                        {channel === "inApp" ? "In-App" : channel}
                      </span>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const enabled = e.target.checked;
                        updateNestedPreference(
                          "channels",
                          channel,
                          "enabled",
                          enabled,
                        );
                      }}
                    />
                  </div>
                  {settings.enabled && (
                    <div className="ml-[3.25rem] mt-2">
                      <label className="block text-xs font-bold text-() uppercase tracking-wider mb-2">
                        Frequency
                      </label>
                      <Select
                        value={settings.frequency}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const frequency = e.target.value;
                          updateNestedPreference(
                            "channels",
                            channel,
                            "frequency",
                            frequency,
                          );
                        }}
                        options={FREQUENCY_OPTIONS}
                        className="w-full max-w-xs focus:ring-() border-() bg-() text-()"
                      />
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );

  const renderTypePreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-() tracking-tight mb-4">
          Notification Types
        </h3>
        <div className="space-y-4">
          {Object.entries(localPreferences.types).map(([type, settings]) => (
            <div
              key={type}
              className="p-5 glass-card rounded-2xl border border-()"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-() capitalize">{type}</span>
                <Switch
                  checked={settings.enabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const enabled = e.target.checked;
                    updateNestedPreference("types", type, "enabled", enabled);
                  }}
                />
              </div>
              {settings.enabled && (
                <div className="mt-2 text-left w-full justify-start text-()">
                  <label className="block text-xs font-bold text-() uppercase tracking-wider mb-2">
                    Priority Level
                  </label>
                  <Select
                    value={settings.priority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const priority = e.target.value;
                      updateNestedPreference(
                        "types",
                        type,
                        "priority",
                        priority,
                      );
                    }}
                    options={PRIORITY_OPTIONS}
                    className="w-full max-w-xs focus:ring-() border-() bg-() text-()"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuietHoursPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-() tracking-tight mb-4">
          Quiet Hours
        </h3>
        <div className="p-5 glass-card rounded-2xl border border-()">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-() border border-() border-opacity-30">
                <FiVolumeX className="w-5 h-5 text-()" />
              </div>
              <span className="font-semibold text-()">Enable Quiet Hours</span>
            </div>
            <Switch
              checked={localPreferences.quietHours.enabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const enabled = e.target.checked;
                updateLocalPreference("quietHours", "enabled", enabled);
              }}
            />
          </div>
          {localPreferences.quietHours.enabled && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-() uppercase tracking-wider mb-2">
                    Start Time
                  </label>
                  <TimePicker
                    value={localPreferences.quietHours.startTime}
                    onChange={(time: string) => {
                      updateLocalPreference("quietHours", "startTime", time);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <TimePicker
                    value={localPreferences.quietHours.endTime}
                    onChange={(time: string) => {
                      updateLocalPreference("quietHours", "endTime", time);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-()">
                <span className="text-sm font-semibold text-()">
                  Allow urgent notifications
                </span>
                <Switch
                  checked={localPreferences.quietHours.allowUrgent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const allowUrgent = e.target.checked;
                    updateLocalPreference(
                      "quietHours",
                      "allowUrgent",
                      allowUrgent,
                    );
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDeliveryPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-() tracking-tight mb-4">
          Delivery Options
        </h3>
        <div className="space-y-4">
          <div className="p-5 glass-card rounded-2xl border border-()">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-()">Batch Notifications</span>
              <Switch
                checked={localPreferences.delivery.batching}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const batching = e.target.checked;
                  updateLocalPreference("delivery", "batching", batching);
                }}
              />
            </div>
            {localPreferences.delivery.batching && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-() uppercase tracking-wider mb-2">
                    Batch Interval (minutes)
                  </label>
                  <Slider
                    value={localPreferences.delivery.batchInterval}
                    onChange={(batchInterval: number) =>
                      updateLocalPreference(
                        "delivery",
                        "batchInterval",
                        batchInterval,
                      )
                    }
                    min={5}
                    max={240}
                    step={5}
                    className="w-full accent-() py-2"
                  />
                  <span className="text-sm font-medium text-() mt-1 inline-block">
                    {localPreferences.delivery.batchInterval} minutes
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-() uppercase tracking-wider mb-2">
                    Max Batch Size
                  </label>
                  <Slider
                    value={localPreferences.delivery.maxBatchSize}
                    onChange={(maxBatchSize: number) =>
                      updateLocalPreference(
                        "delivery",
                        "maxBatchSize",
                        maxBatchSize,
                      )
                    }
                    min={1}
                    max={50}
                    step={1}
                    className="w-full accent-() py-2"
                  />
                  <span className="text-sm font-medium text-() mt-1 inline-block">
                    {localPreferences.delivery.maxBatchSize} notifications
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="p-5 glass-card rounded-2xl border border-()">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-()">Smart Timing</span>
                <Switch
                  checked={localPreferences.delivery.smartTiming}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const smartTiming = e.target.checked;
                    updateLocalPreference(
                      "delivery",
                      "smartTiming",
                      smartTiming,
                    );
                  }}
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-()">
                  Respect User Activity
                </span>
                <Switch
                  checked={localPreferences.delivery.respectUserActivity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const respectUserActivity = e.target.checked;
                    updateLocalPreference(
                      "delivery",
                      "respectUserActivity",
                      respectUserActivity,
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterfacePreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-() tracking-tight mb-4">
          Interface Settings
        </h3>
        <div className="space-y-4">
          <div className="p-5 glass-card rounded-2xl border border-()">
            <h4 className="font-semibold text-() mb-4">Sound & Alerts</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Enable Sound</span>
                <Switch
                  checked={localPreferences.interface.sound}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const sound = e.target.checked;
                    updateLocalPreference("interface", "sound", sound);
                  }}
                />
              </div>
              {localPreferences.interface.sound && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volume
                    </label>
                    <Slider
                      value={localPreferences.interface.volume}
                      onChange={(volume: number) =>
                        updateLocalPreference("interface", "volume", volume)
                      }
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">
                      {Math.round(localPreferences.interface.volume * 100)}%
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sound Theme
                    </label>
                    <Select
                      value={localPreferences.interface.soundTheme}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const soundTheme = e.target.value;
                        updateLocalPreference(
                          "interface",
                          "soundTheme",
                          soundTheme,
                        );
                      }}
                      options={SOUND_THEME_OPTIONS}
                      className="w-full"
                    />
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Enable Vibration</span>
                <Switch
                  checked={localPreferences.interface.vibration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const vibration = e.target.checked;
                    updateLocalPreference("interface", "vibration", vibration);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="p-5 glass-card rounded-2xl border border-()">
            <h4 className="font-semibold text-() mb-4">Display Options</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show Previews</span>
                <Switch
                  checked={localPreferences.interface.showPreviews}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const showPreviews = e.target.checked;
                    updateLocalPreference(
                      "interface",
                      "showPreviews",
                      showPreviews,
                    );
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Mark as Read on Click
                </span>
                <Switch
                  checked={localPreferences.interface.markReadOnClick}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const markReadOnClick = e.target.checked;
                    updateLocalPreference(
                      "interface",
                      "markReadOnClick",
                      markReadOnClick,
                    );
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Auto Archive</span>
                <Switch
                  checked={localPreferences.interface.autoArchive}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const autoArchive = e.target.checked;
                    updateLocalPreference(
                      "interface",
                      "autoArchive",
                      autoArchive,
                    );
                  }}
                />
              </div>
              {localPreferences.interface.autoArchive && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Archive after (days)
                  </label>
                  <Slider
                    value={localPreferences.interface.autoArchiveDays}
                    onChange={(autoArchiveDays: number) =>
                      updateLocalPreference(
                        "interface",
                        "autoArchiveDays",
                        autoArchiveDays,
                      )
                    }
                    min={1}
                    max={90}
                    step={1}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500">
                    {localPreferences.interface.autoArchiveDays} days
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedPreferences = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-() tracking-tight mb-4">
          Advanced Settings
        </h3>
        <div className="space-y-4">
          <div className="p-5 glass-card rounded-2xl border border-()">
            <h4 className="font-semibold text-() mb-4">Localization</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <Select
                  value={localPreferences.advanced.language}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const language = e.target.value;
                    updateLocalPreference("advanced", "language", language);
                  }}
                  options={LANGUAGE_OPTIONS}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={localPreferences.advanced.timezone}
                  onChange={(e) =>
                    updateLocalPreference(
                      "advanced",
                      "timezone",
                      e.target.value,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Intl.supportedValuesOf("timeZone").map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="p-5 glass-card rounded-2xl border border-()">
            <h4 className="font-semibold text-() mb-4">Email Settings</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Template
              </label>
              <Select
                value={localPreferences.advanced.emailTemplate}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const emailTemplate = e.target.value;
                  updateLocalPreference(
                    "advanced",
                    "emailTemplate",
                    emailTemplate,
                  );
                }}
                options={[
                  { value: "default", label: "Default" },
                  { value: "minimal", label: "Minimal" },
                  { value: "detailed", label: "Detailed" },
                  { value: "modern", label: "Modern" },
                ]}
                className="w-full"
              />
            </div>
          </div>
          <div className="p-5 glass-card rounded-2xl border border-()">
            <h4 className="font-semibold text-() mb-4">System Options</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Consolidate Digests
                </span>
                <Switch
                  checked={localPreferences.advanced.consolidateDigests}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const consolidateDigests = e.target.checked;
                    updateLocalPreference(
                      "advanced",
                      "consolidateDigests",
                      consolidateDigests,
                    );
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Enable Analytics</span>
                <Switch
                  checked={localPreferences.advanced.enableAnalytics}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const enableAnalytics = e.target.checked;
                    updateLocalPreference(
                      "advanced",
                      "enableAnalytics",
                      enableAnalytics,
                    );
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Debug Mode</span>
                <Switch
                  checked={localPreferences.advanced.debugMode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const debugMode = e.target.checked;
                    updateLocalPreference("advanced", "debugMode", debugMode);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const SAVE_STATUS_MESSAGES: Record<string, string> = {
    success: "Preferences saved",
    reset: "Preferences reset",
    exported: "Preferences exported",
    error: "Failed to save",
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Notification Preferences"
        size="lg"
      >
        <div className="flex h-[32rem]">
          {/* Sidebar */}
          <div className="w-48 border-r border-() pr-4 overflow-y-auto scrollbar-responsive">
            <nav className="space-y-1 mt-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                      activeTab === tab.id
                        ? "bg-() text-() shadow-sm border border-() border-opacity-30"
                        : "text-() hover:text-() hover:bg-() border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mr-3 ${activeTab === tab.id ? "text-()" : "opacity-70"}`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-8">
            <div className="h-full overflow-y-auto scrollbar-responsive pr-4 pb-4">
              {preferencesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingSpinner size="md" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4 font-semibold">
                    Failed to load preferences
                  </p>
                  <Button
                    onClick={refreshPreferences}
                    variant="outline"
                    className="church-cancel-btn rounded-xl"
                  >
                    <FiRefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  {activeTab === "channels" && renderChannelPreferences()}
                  {activeTab === "types" && renderTypePreferences()}
                  {activeTab === "schedule" && renderQuietHoursPreferences()}
                  {activeTab === "delivery" && renderDeliveryPreferences()}
                  {activeTab === "interface" && renderInterfacePreferences()}
                  {activeTab === "advanced" && renderAdvancedPreferences()}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-() pt-5">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="btn-ghost flex items-center shadow-sm"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={handleReset}
              className="church-cancel-btn flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center space-x-3">
            {saveStatus && (
              <span
                className={`text-sm font-medium pr-2 ${
                  saveStatus === "error" ? "text-red-500" : "text-green-500"
                }`}
              >
                {SAVE_STATUS_MESSAGES[saveStatus]}
              </span>
            )}
            <button onClick={onClose} className="btn-ghost flex items-center">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="btn-primary flex items-center focus:ring-4 focus:ring-() disabled:opacity-50"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2 border-white" />
              ) : (
                <FiSave className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset confirmation modal */}
      <Modal
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Preferences"
        size="sm"
      >
        <p className="text-sm font-medium text-()">
          Are you sure you want to reset all preferences to default? This cannot
          be undone.
        </p>
        <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-()">
          <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </button>
          <button
            className="church-cancel-btn px-4 py-2 rounded-xl text-sm font-semibold flex items-center shadow-sm"
            onClick={handleResetConfirmed}
            disabled={isLoading}
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            Reset to Default
          </button>
        </div>
      </Modal>
    </>
  );
};

export { NotificationPreferences };
export default NotificationPreferences;
