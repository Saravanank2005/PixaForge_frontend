import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = ({ className = '', showLabel = true }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center ${className}`}>
      {showLabel && (
        <span className="mr-3 text-sm font-medium">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
      
      <button
        type="button"
        className="theme-toggle relative inline-flex items-center"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <span className="sr-only">
          {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        </span>
        
        <SunIcon 
          className={`absolute left-1 top-1 h-5 w-5 transform transition-opacity duration-300 ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`} 
        />
        
        <MoonIcon 
          className={`absolute right-1 top-1 h-5 w-5 transform transition-opacity duration-300 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`} 
        />
      </button>
    </div>
  );
};

export default ThemeToggle;
