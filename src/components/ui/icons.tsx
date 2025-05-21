// Centralized icon exports to ensure consistent usage across the application
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  AlertCircle,
  ArrowRight,
  Download,
  Filter,
  RefreshCw,
  BarChart,
  Info,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Zap,
  ChevronDown,
  BookOpen,
  User,
  Home,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Check,
  Plus,
  Minus,
  ExternalLink,
  Globe,
  Newspaper
} from 'lucide-react';

// Import Briefcase from IconExports
import { Icons as ImportedIcons } from '../IconExports';

// Create a combined icons object with Briefcase from IconExports
export const Icons = {
  // Use Briefcase from IconExports
  Briefcase: ImportedIcons.Briefcase,
  
  // Standard icons
  LayoutDashboard,
  FileText,
  Settings,
  AlertCircle,
  ArrowRight,
  Download,
  Filter,
  RefreshCw,
  BarChart,
  Info,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Zap,
  ChevronDown,
  BookOpen,
  User,
  Home,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Check,
  Plus,
  Minus,
  ExternalLink,
  Globe,
  Newspaper
};

// Also export individual icons for backward compatibility
export {
  LayoutDashboard,
  FileText,
  Settings,
  AlertCircle,
  ArrowRight,
  Download,
  Filter,
  RefreshCw,
  BarChart,
  Info,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Zap,
  ChevronDown,
  BookOpen,
  User,
  Home,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Check,
  Plus,
  Minus,
  ExternalLink,
  Globe,
  Newspaper
};

// Default export for convenience
export default Icons;
