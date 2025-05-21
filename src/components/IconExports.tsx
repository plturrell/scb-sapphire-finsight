// This file centralizes all icon exports to ensure they're properly bundled
import {
  Folder as FolderIcon,
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
export const Briefcase = FolderIcon; // Using Folder as a replacement for Briefcase
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
  Briefcase, // This is now using Folder icon as a replacement
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
