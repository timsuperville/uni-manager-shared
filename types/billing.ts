/**
 * @shared/types/billing — Canonical Billing & Subscription Contracts
 *
 * Types for tenant subscription tiers, dynamic add-ons, and payment portal sessions.
 */

export type TenantSubscriptionTier =
  | 'free'
  | 'starter'
  | 'professional'
  | 'enterprise';

export type TenantSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'suspended';

export interface TenantAddOnProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: 'month' | 'year';
  isActive: boolean;
  featureFlag: string;
  icon?: string;
  benefits: string[];
}

export interface TenantBillingSubscription {
  tier: TenantSubscriptionTier;
  planName: string;
  status: TenantSubscriptionStatus;
  renewalDate?: string;
  amountCents?: number;
  currency?: string;
  interval?: 'month' | 'year';
  activeAddOnIds: string[];
  hasCustomerPortal: boolean;
  hasPaymentMethod: boolean;
}

export interface TenantOrganizationSummary {
  id: string;
  name: string;
  industry?: string;
  timezone: string;
  country: string;
  status: string;
}

export interface TenantBillingOverview {
  tenant: TenantOrganizationSummary;
  subscription: TenantBillingSubscription;
  availableAddOns: TenantAddOnProduct[];
}

export interface CustomerPortalSessionResponse {
  url: string;
}

export interface ToggleAddOnRequest {
  addOnId: string;
  enabled: boolean;
}

export interface ToggleAddOnResponse {
  activeAddOnIds: string[];
  message: string;
}
