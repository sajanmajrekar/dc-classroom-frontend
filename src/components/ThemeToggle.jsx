import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const getInitialTheme = () => localStorage.getItem('academy-theme') || 'dark';

export default function ThemeToggle() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('academy-theme', theme);
    }, [theme]);

    const isLight = theme === 'light';

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
            title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
        >
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
            <span>{isLight ? 'Dark' : 'Light'}</span>
        </button>
    );
}
