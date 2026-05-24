import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FileSearch, Upload, MessageSquare, BarChart3, History, Search,
  Sun, Moon, LogOut, Home, ScanText,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../store/slices/authSlice';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/ocr', label: 'OCR Viewer', icon: ScanText },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/history', label: 'History', icon: History },
  { path: '/search', label: 'Search', icon: Search },
];

export default function Navbar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { darkMode, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <FileSearch className="w-7 h-7 text-primary-600" />
            <span className="hidden sm:inline bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              DocAnalyzer
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user && (
              <>
                <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
                  {user.name}
                </span>
                <button
                  onClick={() => dispatch(logout())}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
