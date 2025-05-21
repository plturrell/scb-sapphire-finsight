/**
 * Internationalization (i18n) System for SCB Sapphire FinSight
 * 
 * This module provides translation support across the application
 * with support for multiple languages, formatting, and locale-specific features.
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Supported languages
export type SupportedLocale = 
  'en' | // English (default)
  'zh' | // Chinese
  'ms' | // Malay
  'th' | // Thai
  'vi' | // Vietnamese
  'ko' | // Korean
  'ja' | // Japanese
  'ar';  // Arabic

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = 'en';

// Right-to-left languages
export const RTL_LOCALES: SupportedLocale[] = ['ar'];

// Context for storing current locale
export interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  isRTL: boolean;
}

// Create context with default values
export const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string) => key,
  formatNumber: (num: number) => num.toString(),
  formatDate: (date: Date | string | number) => new Date(date).toLocaleDateString(),
  formatCurrency: (amount: number) => amount.toString(),
  isRTL: false,
});

// Translation files - these would normally be loaded dynamically
// For demo purposes, we include a subset here directly
const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.refresh': 'Refresh',
    'common.noData': 'No data available',
    'common.close': 'Close',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Reports',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.help': 'Help',
    
    // Dashboard
    'dashboard.title': 'Financial Dashboard',
    'dashboard.summary': 'Financial Summary',
    'dashboard.metrics': 'Key Metrics',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.alerts': 'Alerts',
    
    // Charts
    'chart.noData': 'No data available for this chart',
    'chart.loading': 'Loading chart data...',
    'chart.error': 'Unable to load chart data',
    'chart.downloadSuccess': 'Chart downloaded successfully',
    'chart.aiEnhanced': 'AI Enhanced',
    
    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
    'settings.accessibility': 'Accessibility',
    'settings.profile': 'Profile',
    
    // Accessibility
    'a11y.title': 'Accessibility Settings',
    'a11y.theme': 'Display Theme',
    'a11y.motion': 'Animation & Motion',
    'a11y.textSize': 'Text Size',
    'a11y.highContrast': 'High Contrast Mode',
    'a11y.reduceSidebars': 'Reduce Sidebars',
    'a11y.hideNotifications': 'Hide Notifications',
    'a11y.resetSettings': 'Reset All Settings',
    'a11y.reduceMotion': 'Reduced Motion',
    'a11y.prefSaved': 'Your accessibility preferences are saved locally',
    
    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    
    // Financial
    'financial.revenue': 'Revenue',
    'financial.expenses': 'Expenses',
    'financial.profit': 'Profit',
    'financial.loss': 'Loss',
    'financial.assets': 'Assets',
    'financial.liabilities': 'Liabilities',
    'financial.equity': 'Equity',
    'financial.cashFlow': 'Cash Flow',
    'financial.forecast': 'Forecast',
    'financial.actual': 'Actual',
    'financial.budget': 'Budget',
    'financial.variance': 'Variance',
  },
  
  zh: {
    // Common - Chinese translations
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.retry': '重试',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.sort': '排序',
    'common.refresh': '刷新',
    'common.noData': '无可用数据',
    'common.close': '关闭',
    
    // Navigation
    'nav.dashboard': '仪表板',
    'nav.reports': '报告',
    'nav.analytics': '分析',
    'nav.settings': '设置',
    'nav.help': '帮助',
    
    // Dashboard
    'dashboard.title': '财务仪表板',
    'dashboard.summary': '财务摘要',
    'dashboard.metrics': '关键指标',
    'dashboard.recentActivity': '近期活动',
    'dashboard.alerts': '提醒',
    
    // Charts
    'chart.noData': '此图表无可用数据',
    'chart.loading': '加载图表数据...',
    'chart.error': '无法加载图表数据',
    'chart.downloadSuccess': '图表下载成功',
    'chart.aiEnhanced': 'AI 增强',
    
    // Settings
    'settings.title': '设置',
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.notifications': '通知',
    'settings.accessibility': '无障碍',
    'settings.profile': '个人资料',
    
    // Accessibility
    'a11y.title': '无障碍设置',
    'a11y.theme': '显示主题',
    'a11y.motion': '动画与动效',
    'a11y.textSize': '文字大小',
    'a11y.highContrast': '高对比度模式',
    'a11y.reduceSidebars': '减小侧边栏',
    'a11y.hideNotifications': '隐藏通知',
    'a11y.resetSettings': '重置所有设置',
    'a11y.reduceMotion': '减少动效',
    'a11y.prefSaved': '您的无障碍偏好已本地保存',
    
    // Theme
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.system': '系统',
    
    // Financial
    'financial.revenue': '收入',
    'financial.expenses': '支出',
    'financial.profit': '利润',
    'financial.loss': '亏损',
    'financial.assets': '资产',
    'financial.liabilities': '负债',
    'financial.equity': '权益',
    'financial.cashFlow': '现金流',
    'financial.forecast': '预测',
    'financial.actual': '实际',
    'financial.budget': '预算',
    'financial.variance': '差异',
  },
  
  // Provide partial translations for other languages
  // In a real application, these would be complete
  ms: {
    'common.loading': 'Memuatkan...',
    'common.error': 'Ralat',
    'common.save': 'Simpan',
    'nav.dashboard': 'Papan Pemuka',
    // Add other translations as needed
  },
  
  th: {
    'common.loading': 'กำลังโหลด...',
    'common.error': 'ข้อผิดพลาด',
    'common.save': 'บันทึก',
    'nav.dashboard': 'แดชบอร์ด',
    // Add other translations as needed
  },
  
  vi: {
    'common.loading': 'Đang tải...',
    'common.error': 'Lỗi',
    'common.save': 'Lưu',
    'nav.dashboard': 'Bảng điều khiển',
    // Add other translations as needed
  },
  
  ko: {
    'common.loading': '로딩 중...',
    'common.error': '오류',
    'common.save': '저장',
    'nav.dashboard': '대시보드',
    // Add other translations as needed
  },
  
  ja: {
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.save': '保存',
    'nav.dashboard': 'ダッシュボード',
    // Add other translations as needed
  },
  
  ar: {
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.save': 'حفظ',
    'nav.dashboard': 'لوحة المعلومات',
    // Add other translations as needed
  },
};

// Provider component for i18n
export interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  // Get initial locale from localStorage or browser settings if available
  const getInitialLocale = (): SupportedLocale => {
    if (typeof window === 'undefined') return initialLocale;
    
    const savedLocale = localStorage.getItem('scb-locale') as SupportedLocale | null;
    if (savedLocale && Object.keys(translations).includes(savedLocale)) {
      return savedLocale;
    }
    
    // Try to match browser language
    const browserLang = navigator.language.split('-')[0] as SupportedLocale;
    if (Object.keys(translations).includes(browserLang)) {
      return browserLang;
    }
    
    return initialLocale;
  };
  
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);
  const isRTL = RTL_LOCALES.includes(locale);
  
  // Update locale and save to localStorage
  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('scb-locale', newLocale);
      
      // Update HTML dir attribute for RTL languages
      if (RTL_LOCALES.includes(newLocale)) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
      
      // Update HTML lang attribute
      document.documentElement.lang = newLocale;
    }
  };
  
  // Initialize locale from localStorage or browser on mount
  useEffect(() => {
    const initialLocale = getInitialLocale();
    setLocale(initialLocale);
  }, []);
  
  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Get translation for current locale, fallback to default locale, then key itself
    const translation = 
      (translations[locale] && translations[locale][key]) ||
      (translations[DEFAULT_LOCALE] && translations[DEFAULT_LOCALE][key]) ||
      key;
    
    // Replace parameters if any
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, value]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(value)),
        translation
      );
    }
    
    return translation;
  };
  
  // Format number according to locale
  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale, options).format(num);
  };
  
  // Format date according to locale
  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
  };
  
  // Format currency according to locale
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  const value = {
    locale,
    setLocale,
    t,
    formatNumber,
    formatDate,
    formatCurrency,
    isRTL,
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook for using i18n throughout the application
export function useI18n() {
  const context = useContext(I18nContext);
  
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
}

// Export locale names for UI display
export const localeNames: Record<SupportedLocale, string> = {
  en: 'English',
  zh: '中文',
  ms: 'Bahasa Melayu',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  ko: '한국어',
  ja: '日本語',
  ar: 'العربية',
};

export default {
  I18nProvider,
  useI18n,
  DEFAULT_LOCALE,
  RTL_LOCALES,
  localeNames,
};