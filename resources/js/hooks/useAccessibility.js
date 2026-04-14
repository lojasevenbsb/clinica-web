import { useState, useEffect, useCallback } from 'react';

const FONT_SIZES = [
    { key: 'sm', label: 'A', px: 14, title: 'Fonte Pequena' },
    { key: 'md', label: 'A', px: 16, title: 'Fonte Normal' },
    { key: 'lg', label: 'A', px: 19, title: 'Fonte Grande' },
];

const LS_FONT  = 'a11y_font';
const LS_THEME = 'a11y_theme';

function applyFont(px) {
    document.documentElement.style.fontSize = px + 'px';
}

function applyTheme(dark) {
    if (dark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

export function useAccessibility() {
    const [fontKey, setFontKey] = useState(() => {
        const saved = localStorage.getItem(LS_FONT) || 'md';
        // Apply immediately to avoid FOUC
        const size = FONT_SIZES.find(f => f.key === saved) || FONT_SIZES[1];
        applyFont(size.px);
        return saved;
    });
    const [dark, setDark] = useState(() => {
        const isDark = localStorage.getItem(LS_THEME) === 'dark';
        applyTheme(isDark);
        return isDark;
    });

    // Apply on mount and whenever values change
    useEffect(() => {
        const size = FONT_SIZES.find(f => f.key === fontKey) || FONT_SIZES[1];
        applyFont(size.px);
        localStorage.setItem(LS_FONT, fontKey);
    }, [fontKey]);

    useEffect(() => {
        applyTheme(dark);
        localStorage.setItem(LS_THEME, dark ? 'dark' : 'light');
    }, [dark]);

    const toggleTheme = useCallback(() => setDark(d => !d), []);

    const cycleFont = useCallback((key) => setFontKey(key), []);

    return { fontKey, dark, toggleTheme, cycleFont, FONT_SIZES };
}
