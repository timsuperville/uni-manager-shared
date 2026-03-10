/**
 * Example implementation of LoginForm in various apps.
 * Demonstrates how to use the canonical LoginForm component.
 */

import React from "react";
import { LoginForm } from "../components/LoginForm";
import { useNavigate } from "react-router-dom";

export function AdminLoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (_result: unknown) => {
    navigate("/dashboard");
  };

  const handleLoginError = (_error: unknown) => {
    // Could show toast notification or additional error handling
  };

  return (
    <LoginForm
      appType="admin"
      onSuccess={handleLoginSuccess}
      onError={handleLoginError}
      showRememberMe={true}
      showRegistration={false}
      redirectPath="/dashboard"
    />
  );
}

// Church App
export function ChurchLoginPage() {
  return (
    <LoginForm
      appType="church"
      redirectPath="/services"
      showRememberMe={true}
    />
  );
}

// Business App
export function BusinessLoginPage() {
  return (
    <LoginForm
      appType="business"
      redirectPath="/overview"
      showRememberMe={true}
      showRegistration={true}
    />
  );
}

// Custom themed login
export function CustomLoginPage() {
  return (
    <LoginForm
      appType="default"
      appTitle="Custom Application"
      appDescription="Welcome to our custom portal"
      redirectPath="/custom-dashboard"
    />
  );
}
