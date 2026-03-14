import React, { createContext, useContext } from "react";
import { getSharedEnvironmentConfig } from "../config/environment.ts";

interface ApiContextValue {
  baseURL: string;
  timeout: number;
  environment: string;
}

const ApiContext = createContext<ApiContextValue | null>(null);

interface ApiProviderProps {
  children: React.ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const config = getSharedEnvironmentConfig();

  const apiValue: ApiContextValue = {
    baseURL: config.api.baseUrl,
    timeout: config.api.timeout,
    environment: config.environment,
  };

  return <ApiContext.Provider value={apiValue}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiContextValue => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};

export default ApiProvider;
