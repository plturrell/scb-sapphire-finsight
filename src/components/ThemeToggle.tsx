import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center p-1 rounded-lg border border-[rgb(var(--scb-border))] bg-white dark:bg-gray-800 shadow-sm">
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center justify-center p-2 rounded-md transition-all ${
          theme === 'light' 
            ? 'bg-primary text-white' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Light mode"
      >
        <Sun size={18} />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center justify-center p-2 rounded-md transition-all ${
          theme === 'dark' 
            ? 'bg-primary text-white' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="Dark mode"
      >
        <Moon size={18} />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`flex items-center justify-center p-2 rounded-md transition-all ${
          theme === 'system' 
            ? 'bg-primary text-white' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        aria-label="System theme"
      >
        <Monitor size={18} />
      </button>
    </div>
  );
}