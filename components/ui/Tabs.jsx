import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Tabs = ({ defaultValue = '', children, className = '', ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const tabsList = React.Children.toArray(children).find(
    child => child.type === TabsList
  );
  
  const tabsContent = React.Children.toArray(children).filter(
    child => child.type === TabsContent
  );

  return (
    <div className={`w-full ${className}`} {...props}>
      {React.cloneElement(tabsList, { activeTab, setActiveTab })}
      {tabsContent.map(content => 
        React.cloneElement(content, { activeTab, key: content.props.value })
      )}
    </div>
  );
};

const TabsList = ({ children, className = '', activeTab, setActiveTab, ...props }) => {
  return (
    <div
      className={`border-b border-gray-200 ${className}`}
      {...props}
    >
      <nav className="-mb-px flex space-x-8">
        {React.Children.map(children, child =>
          React.cloneElement(child, { activeTab, setActiveTab })
        )}
      </nav>
    </div>
  );
};

const TabsTrigger = ({ children, value, className = '', activeTab, setActiveTab, ...props }) => {
  const isActive = activeTab === value;
  
  return (
    <button
      className={`py-2 px-1 border-b-2 font-medium text-sm ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } ${className}`}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, className = '', activeTab, ...props }) => {
  if (activeTab !== value) return null;
  
  return (
    <div
      className={`mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Tabs.propTypes = {
  defaultValue: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TabsList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  activeTab: PropTypes.string,
  setActiveTab: PropTypes.func,
};

TabsTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  activeTab: PropTypes.string,
  setActiveTab: PropTypes.func,
};

TabsContent.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  activeTab: PropTypes.string,
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
