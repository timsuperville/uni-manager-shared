import React, { createContext, useContext } from 'react';
import { getSharedEnvironmentConfig } from '../core/config/environment.ts';

// Simple API provider for shared functionality
const ApiContext = createContext({});

export const ApiProvider = ({ children }) => {
  const config = getSharedEnvironmentConfig();

  const apiValue = {
    // Basic API configuration that can be extended
    baseURL: config.api.baseUrl,
    timeout: config.api.timeout,
    environment: config.environment,
    // Add common API methods here as needed
  };

  return <ApiContext.Provider value={apiValue}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export default ApiProvider;
