import React from 'react';
import { AuthContainer } from '../_authUI/AuthContainer';
import { AuthCardContent } from '../_authUI/AuthCardContent';
import { getCurrentAppConfig } from '../../config/appConfigs';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
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
              boxShadow: `0 10px 30px -10px ${config.branding.primaryColor}`
            }}
          >
            {config.ui.icon}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 space-y-6 max-h-[50vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          <p>
            At {config.appName}, we take your privacy extremely seriously. We
            believe in Sovereign Privacy, meaning your data belongs to you.
          </p>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              1. Information We Collect
            </h2>
            <p className="leading-relaxed">
              We collect information you provide directly to us, such as when
              you create or modify your account. This may include your name,
              email address, password, profile photo, and other information
              necessary for the operation of the Service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              2. How We Use Information
            </h2>
            <p className="leading-relaxed">
              We use the information we collect to provide, maintain, and
              improve our services, to develop new features, and to protect{' '}
              {config.appName} and our users. We do not sell your personal data
              to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              3. Sovereign Telemetry
            </h2>
            <p className="leading-relaxed">
              We collect operational telemetry and crash reports to ensure
              system resonance and health. This data is strictly scrubbed of
              Personally Identifiable Information (PII) before transmission to
              our diagnostics center.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              4. Your Rights
            </h2>
            <p className="leading-relaxed">
              You have the right to access, update, or delete your information
              at any time. You can export your entire dataset in an
              interoperable format directly from your Security Dashboard.
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

export default PrivacyPolicy;
