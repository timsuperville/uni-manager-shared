/**
 * Example implementation of Universal Login Form in Admin App
 * This demonstrates how to use the UniversalLoginForm component
 */

import React from "react";
import { UniversalLoginForm } from "@shared/auth/components/UniversalLoginForm.jsx";
import { useNavigate } from "react-router-dom";

export function AdminLoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (result) => {
    console.log("Admin login successful:", result);
    // Navigate to admin dashboard
    navigate("/dashboard");
  };

  const handleLoginError = (error) => {
    console.error("Admin login failed:", error);
    // Could show toast notification or additional error handling
  };

  return (
    <UniversalLoginForm
      appType="admin"
      theme="default"
      onSuccess={handleLoginSuccess}
      onError={handleLoginError}
      showRememberMe={true}
      showRegistration={false}
      redirectPath="/dashboard"
    />
  );
}

// Example usage in different apps:

// Church App
export function ChurchLoginPage() {
  return (
    <UniversalLoginForm
      appType="church"
      theme="default"
      redirectPath="/services"
      showRememberMe={true}
    />
  );
}

// Business App
export function BusinessLoginPage() {
  return (
    <UniversalLoginForm
      appType="business"
      theme="minimal"
      redirectPath="/overview"
      showRememberMe={true}
      showRegistration={true}
    />
  );
}

// Custom themed login
export function CustomLoginPage() {
  return (
    <UniversalLoginForm
      appType="default"
      appTitle="Custom Application"
      appDescription="Welcome to our custom portal"
      theme="dark"
      redirectPath="/custom-dashboard"
    />
  );
}
