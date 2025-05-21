// Global type declarations for the application

type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotificationType = 'success' | 'warning' | 'error';

interface HapticFeedback {
  /**
   * Trigger impact feedback
   * @param style The style of the impact feedback
   */
  impact: (style: HapticImpactStyle) => void;
  
  /**
   * Trigger notification feedback
   * @param type The type of notification feedback
   */
  notification: (type: HapticNotificationType) => void;
  
  /**
   * Trigger selection feedback
   */
  selection: () => void;
}

interface TelegramWebAppHapticFeedback {
  /**
   * A method tells that an impact occurred. The Telegram app may play the appropriate haptics based on style value passed.
   * @param style_impact - Style of the impact
   */
  impactOccurred: (style_impact: HapticImpactStyle) => void;
  
  /**
   * A method tells that a task or action has succeeded, failed, or produced a warning.
   * @param type - Type of the notification
   */
  notificationOccurred: (type: HapticNotificationType) => void;
  
  /**
   * A method tells that the user has changed a selection.
   */
  selectionChanged: () => void;
}

interface TelegramWebApp {
  /**
   * A method that shows a native popup with the specified parameters.
   */
  showPopup: (params: any) => void;
  
  /**
   * A method that shows a native alert dialog.
   */
  showAlert: (message: string) => void;
  
  /**
   * A method that shows a native confirmation dialog.
   */
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
  
  /**
   * Haptic feedback methods.
   */
  HapticFeedback: TelegramWebAppHapticFeedback;
  
  /**
   * The current theme parameters.
   */
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  
  /**
   * The current color scheme.
   */
  colorScheme: 'light' | 'dark';
  
  /**
   * Closes the Web App.
   */
  close: () => void;
}

declare global {
  interface Window {
    /**
     * Telegram Web App API
     */
    Telegram?: {
      WebApp: TelegramWebApp;
    };
    
    /**
     * Haptic feedback API
     */
    HapticFeedback?: HapticFeedback;
    
    /**
     * React Native WebView postMessage handler
     */
    ReactNativeWebView?: {
      postMessage: (data: string) => void;
    };
  }
}

// This export is needed to make this file a module
export {};
