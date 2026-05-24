import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, MessageSquare, History, Search } from 'lucide-react';

const items = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/upload', icon: Upload, label: 'Upload' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/search', icon: Search, label: 'Search' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="flex justify-around py-2">
        {items.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
              location.pathname === path
                ? 'text-primary-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
