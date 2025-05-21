// This file centralizes all icon exports to ensure they're properly bundled
import {
  Briefcase as BriefcaseIcon,
  LayoutDashboard as LayoutDashboardIcon,
  FileText as FileTextIcon,
  Settings as SettingsIcon,
  AlertCircle as AlertCircleIcon,
  ArrowRight as ArrowRightIcon,
  Download as DownloadIcon,
  Filter as FilterIcon,
  RefreshCw as RefreshCwIcon,
  BarChart as BarChartIcon
} from 'lucide-react';

// Re-export with explicit names to avoid bundling issues
export const Briefcase = BriefcaseIcon;
export const LayoutDashboard = LayoutDashboardIcon;
export const FileText = FileTextIcon;
export const Settings = SettingsIcon;
export const AlertCircle = AlertCircleIcon;
export const ArrowRight = ArrowRightIcon;
export const Download = DownloadIcon;
export const Filter = FilterIcon;
export const RefreshCw = RefreshCwIcon;
export const BarChart = BarChartIcon;

// Also export as a single object for convenience
export const Icons = {
  Briefcase,
  LayoutDashboard,
  FileText,
  Settings,
  AlertCircle,
  ArrowRight,
  Download,
  Filter,
  RefreshCw,
  BarChart
};
