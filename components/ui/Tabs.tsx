import React, { useState } from 'react';

// ── Internal types (not exported — consumers just use value strings) ────────────

interface TabsInternalProps {
  activeTab?: string;
  setActiveTab?: (v: string) => void;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>, TabsInternalProps {
  className?: string;
}

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, TabsInternalProps {
  value: string;
}

interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement>, TabsInternalProps {
  value: string;
}

// ── Components ─────────────────────────────────────────────────────────────────

export const Tabs: React.FC<TabsProps> = ({
  defaultValue = '',
  value,
  onValueChange,
  children,
  className = '',
  ...props
}) => {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;
  const handleSetActiveTab = (v: string) => {
    if (value === undefined) setInternalTab(v);
    if (onValueChange) onValueChange(v);
  };

  const tabsList = React.Children.toArray(children).find(
    (c): c is React.ReactElement =>
      React.isValidElement(c) && c.type === TabsList
  );
  const tabsContent = React.Children.toArray(children).filter(
    (c): c is React.ReactElement =>
      React.isValidElement(c) && c.type === TabsContent
  );

  return (
    <div className={`w-full ${className}`} {...props}>
      {tabsList &&
        React.cloneElement(tabsList, {
          activeTab,
          setActiveTab: handleSetActiveTab
        })}
      {tabsContent.map(content =>
        React.cloneElement(content, { activeTab, key: content.props.value })
      )}
    </div>
  );
};

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className = '',
  activeTab,
  setActiveTab,
  ...props
}) => (
  <div
    className={`border-b border-(--glass-outline,rgba(255,255,255,0.15)) overflow-x-auto no-scrollbar ${className}`}
    {...props}
  >
    <nav className="-mb-px flex space-x-4 min-w-max px-1">
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<TabsInternalProps>, {
              activeTab,
              setActiveTab
            })
          : child
      )}
    </nav>
  </div>
);

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  children,
  value,
  className = '',
  activeTab,
  setActiveTab,
  ...props
}) => {
  const isActive = activeTab === value;
  return (
    <button
      className={`py-2 px-1 border-b-2 font-medium text-sm ${isActive ? 'border-(--primary-resonance,#4f46e5) text-(--primary-resonance,#4f46e5)' : 'border-transparent text-(--text-muted,rgba(255,255,255,0.5)) hover:text-(--text-primary,inherit) hover:border-(--glass-outline,rgba(255,255,255,0.3))'} ${className}`}
      onClick={() => setActiveTab?.(value)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({
  children,
  value,
  className = '',
  activeTab,
  ...props
}) => {
  if (activeTab !== value) return null;
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
