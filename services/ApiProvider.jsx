import React, { createContext, useContext } from "react";

// Simple API provider for shared functionality
const ApiContext = createContext({});

export const ApiProvider = ({ children }) => {
  const apiValue = {
    // Basic API configuration that can be extended
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
    // Add common API methods here as needed
  };

  return <ApiContext.Provider value={apiValue}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};

export default ApiProvider;
