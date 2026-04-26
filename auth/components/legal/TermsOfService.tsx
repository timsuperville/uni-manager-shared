import React from "react";
import { AuthContainer } from "../_authUI/AuthContainer";
import { AuthCardContent } from "../_authUI/AuthCardContent";
import { getCurrentAppConfig } from "../../config/appConfigs";
import { useNavigate } from "react-router-dom";

const TermsOfService: React.FC = () => {
  const config = getCurrentAppConfig();
  const navigate = useNavigate();

  return (
    <AuthContainer maxWidth="lg">
      <AuthCardContent>
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 animate-float"
            style={{
              background: `linear-gradient(135deg, ${config.branding.gradientFrom}, ${config.branding.gradientTo})`,
              boxShadow: `0 10px 30px -10px ${config.branding.primaryColor}`,
            }}
          >
            {config.ui.icon}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 space-y-6 max-h-[50vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          <p>
            Welcome to {config.appName}. By accessing or using our services, you
            agree to be bound by these Terms of Service.
          </p>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By creating an account, accessing, or using the Service, you
              signify your agreement to these terms. If you do not agree to
              these terms, you may not access or use the Service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              2. User Conduct
            </h2>
            <p className="leading-relaxed">
              You agree not to use the service for any unlawful purpose or in
              any way that interrupts, damages, impairs, or renders the service
              less efficient. You are solely responsible for all acts or
              omissions that occur under your account.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              3. Sovereign Privacy &amp; Data
            </h2>
            <p className="leading-relaxed">
              Our use of your data is strictly governed by our Privacy Policy
              and Sovereign Privacy principles. We do not sell your personal
              data. You retain ownership of your data, and we act solely as a
              fiduciary processor.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              4. Service Modifications &amp; Availability
            </h2>
            <p className="leading-relaxed">
              We reserve the right to modify or discontinue, temporarily or
              permanently, the Service (or any part thereof) with or without
              notice.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium hover:underline focus:outline-none transition-colors cursor-pointer"
            style={{ color: config.branding.primaryColor }}
          >
            &larr; Go Back
          </button>
        </div>
      </AuthCardContent>
    </AuthContainer>
  );
};

export default TermsOfService;
