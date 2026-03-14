import type { CSSProperties, SVGProps } from 'react';

/**
 * Base props for all icon components exported from @shared/components/icons.
 * All props are optional — icons render at size 16 with currentColor by default.
 */
export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  sw?: number;
  style?: CSSProperties;
}

declare const ChevronDownIcon: React.FC<IconProps>;
declare const ChevronUpIcon: React.FC<IconProps>;
declare const ChevronRightIcon: React.FC<IconProps>;
declare const XIcon: React.FC<IconProps>;
declare const PlusIcon: React.FC<IconProps>;
declare const SearchIcon: React.FC<IconProps>;
declare const DownloadIcon: React.FC<IconProps>;
declare const ExportIcon: React.FC<IconProps>;
declare const RefreshIcon: React.FC<IconProps>;
declare const UploadIcon: React.FC<IconProps>;
declare const AlertIcon: React.FC<IconProps>;
declare const AlertCircleIcon: React.FC<IconProps>;
declare const CheckIcon: React.FC<IconProps>;
declare const BanIcon: React.FC<IconProps>;
declare const TrendUpIcon: React.FC<IconProps>;
declare const TrendDownIcon: React.FC<IconProps>;
declare const UsersIcon: React.FC<IconProps>;
declare const UserIcon: React.FC<IconProps>;
declare const ShieldIcon: React.FC<IconProps>;
declare const ShieldSolidIcon: React.FC<IconProps>;
declare const ShieldCheckIcon: React.FC<IconProps>;
declare const ShieldOffIcon: React.FC<IconProps>;
declare const ScanIcon: React.FC<IconProps>;
declare const CopyIcon: React.FC<IconProps>;
declare const LockIcon: React.FC<IconProps>;
declare const EyeIcon: React.FC<IconProps>;
declare const EyeOffIcon: React.FC<IconProps>;
declare const KeyIcon: React.FC<IconProps>;
declare const SmartphoneIcon: React.FC<IconProps>;
declare const ServerIcon: React.FC<IconProps>;
declare const BarChartIcon: React.FC<IconProps>;

export {
  ChevronDownIcon, ChevronUpIcon, ChevronRightIcon, XIcon, PlusIcon,
  SearchIcon, DownloadIcon, ExportIcon, RefreshIcon, UploadIcon,
  AlertIcon, AlertCircleIcon, CheckIcon, BanIcon,
  TrendUpIcon, TrendDownIcon,
  UsersIcon, UserIcon,
  ShieldIcon, ShieldSolidIcon, ShieldCheckIcon, ShieldOffIcon,
  ScanIcon, CopyIcon, LockIcon, EyeIcon, EyeOffIcon, KeyIcon, SmartphoneIcon,
  ServerIcon, BarChartIcon,
};
