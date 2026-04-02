import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
              "inverse-primary": "#afceb8",
              "inverse-on-surface": "#eff1f0",
              "surface-tint": "#486553",
              "surface-container-highest": "#e1e3e2",
              "on-tertiary-container": "#f8fef9",
              "primary": "#466250",
              "secondary-fixed-dim": "#abcbdf",
              "surface-container-lowest": "#ffffff",
              "outline": "#727973",
              "primary-container": "#5e7b68",
              "on-secondary": "#ffffff",
              "surface-dim": "#d8dada",
              "surface-container-high": "#e6e9e8",
              "on-tertiary-fixed": "#171d1a",
              "tertiary-fixed-dim": "#c2c8c3",
              "outline-variant": "#c2c8c1",
              "surface-container-low": "#f2f4f3",
              "on-tertiary": "#ffffff",
              "on-secondary-fixed-variant": "#2c4a5b",
              "error-container": "#ffdad6",
              "surface": "#f8faf9",
              "on-primary": "#ffffff",
              "secondary-fixed": "#c7e7fb",
              "error": "#ba1a1a",
              "inverse-surface": "#2e3131",
              "tertiary": "#575d5a",
              "on-primary-fixed-variant": "#314d3c",
              "on-secondary-fixed": "#001e2c",
              "on-background": "#191c1c",
              "primary-fixed": "#caead3",
              "on-primary-fixed": "#042013",
              "background": "#f8faf9",
              "on-secondary-container": "#486678",
              "on-primary-container": "#f6fff6",
              "surface-container": "#eceeed",
              "on-error-container": "#93000a",
              "primary-fixed-dim": "#afceb8",
              "on-surface": "#191c1c",
              "on-surface-variant": "#424843",
              "on-tertiary-fixed-variant": "#424845",
              "tertiary-fixed": "#dee4df",
              "surface-variant": "#e1e3e2",
              "on-error": "#ffffff",
              "secondary-container": "#c4e4f8",
              "secondary": "#446273",
              "tertiary-container": "#707672",
              "surface-bright": "#f8faf9"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Manrope"],
              "label": ["Manrope"],
              "sans": ["Manrope", ...defaultTheme.fontFamily.sans],
              "manrope": ["Manrope", "sans-serif"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"}
        },
    },

    plugins: [forms, containerQueries],
};
