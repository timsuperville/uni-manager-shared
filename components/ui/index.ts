// UI Components — Liquid Glass Design System
// All components use CSS custom properties (var(--*)) so they automatically
// adopt each app's colour palette (home=emerald, church=violet, admin=cobalt, etc.)

export { default as Button } from "./Button";
export { default as UserAvatar } from "./UserAvatar";
export type { UserAvatarProps, UserAvatarUser } from "./UserAvatar";
export { default as Logo } from "./Logo";
export { default as AppLogo } from "./AppLogo";
export { Card, CardHeader, CardContent, CardTitle, CardBody } from "./Card";
export { DashboardCard, StatCard, ActionCard } from "./DashboardCard";
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./Table";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
export { Badge } from "./Badge";
export { Input, Select, Textarea } from "./Input";
export { Progress, CircularProgress } from "./Progress";
export { Switch } from "./Switch";
export { ProgressCard, QuickActionCard } from "./CompositeCards";
export { SignaturePad } from "./SignaturePad";

// Liquid Glass primitives (CSS vars — zero hardcoded colours)
export { ProgressBar, default as ProgressBarDefault } from "./ProgressBar";
export { Toggle } from "./Toggle";
export { Modal } from "./Modal";
export { Panel } from "./Panel";
export { Spinner } from "./Spinner";
export { EmptyState } from "./EmptyState";
export { OptionCard } from "./OptionCard";
export { SectionCard } from "./SectionCard";
export { FormField } from "./FormField";
export { WizardStepper } from "./WizardStepper";
export { RankMedal } from "./RankMedal";
export { Alert, AlertTitle, AlertDescription } from "./Alert";

// Liquid Glass form primitives (inline-style, CSS token—based)
export { GlassInput } from "./GlassInput";
export { GlassSelect } from "./GlassSelect";
export { FormSelect } from "./FormSelect";
export { Chip, CHIP_VARIANTS } from "./Chip";
export type { ChipProps } from "./Chip";
export { StatusBadge, STATUS_VARIANTS } from "./StatusBadge";
export { Sparkline } from "./Sparkline";
export { SearchInput } from "./SearchInput";
export { DatePicker } from "./DatePicker";
export { TimePicker } from "./TimePicker";

// Notification-layer primitives
export { Avatar } from "./Avatar";
export { LoadingSpinner } from "./LoadingSpinner";
export { Dropdown } from "./Dropdown";
export { default as DropdownSelect } from "./Select";
export { Pagination } from "./Pagination";
export { StatsStrip } from "./StatsStrip";
export { PageHeader } from "./PageHeader";
export { SectionTabBar } from "./SectionTabBar";

// Typography primitives
export { Heading } from "./Heading";
export { Text } from "./Text";
// TextArea — alias for Textarea (capitalization variant used in groups feature)
export { Textarea as TextArea } from "./Input";
