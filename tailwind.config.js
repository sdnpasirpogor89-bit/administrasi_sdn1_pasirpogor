// tailwind.config.js - VERSI LENGKAP DENGAN TEMA MERAH GELAP & RESPONSIVE
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ✅ Pakai class-based dark mode
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      // ✅ WARNA TEMA MERAH GELAP (Red-950)
      colors: {
        // Primary colors - Red theme
        primary: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a", // Warna utama untuk light mode
        },
        // Secondary colors - Complementary
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Success, Warning, Error
        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          700: "#15803d",
        },
        warning: {
          50: "#fefce8",
          500: "#eab308",
          700: "#a16207",
        },
        error: {
          50: "#fef2f2",
          500: "#ef4444",
          700: "#b91c1c",
        },
        // Background colors untuk dark/light mode
        background: {
          light: "#fef2f2", // red-50
          dark: "#111827", // gray-900
        },
      },

      // ✅ TYPOGRAPHY RESPONSIVE
      fontSize: {
        // Mobile First - base untuk HP kecil
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
        "5xl": ["3rem", { lineHeight: "1" }], // 48px

        // Responsive variants
        "heading-sm": ["1.25rem", { lineHeight: "1.75rem" }],
        "heading-base": ["1.5rem", { lineHeight: "2rem" }],
        "heading-lg": ["1.875rem", { lineHeight: "2.25rem" }],

        "@sm": {
          "heading-sm": ["1.5rem", { lineHeight: "2rem" }],
          "heading-base": ["1.875rem", { lineHeight: "2.25rem" }],
          "heading-lg": ["2.25rem", { lineHeight: "2.5rem" }],
        },
      },

      // ✅ SPACING UNTUK RESPONSIVE
      spacing: {
        touch: "44px", // Minimum touch target untuk mobile
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",

        // Responsive spacing increments
        xs: "0.5rem", // 8px - Mobile
        sm: "1rem", // 16px - Mobile/Tablet
        md: "1.5rem", // 24px - Tablet
        lg: "2rem", // 32px - Desktop
        xl: "3rem", // 48px - Desktop Large
      },

      // ✅ BREAKPOINTS CUSTOM (Mobile First)
      screens: {
        xs: "375px", // HP kecil
        sm: "640px", // HP besar/Tablet kecil
        md: "768px", // Tablet
        lg: "1024px", // Desktop kecil
        xl: "1280px", // Desktop medium
        "2xl": "1536px", // Desktop besar
      },

      // ✅ CONTAINER RESPONSIVE
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem", // Mobile
          sm: "1.5rem", // Tablet
          lg: "2rem", // Desktop
        },
      },

      // ✅ BORDER RADIUS RESPONSIVE
      borderRadius: {
        none: "0",
        sm: "0.375rem", // 6px - Mobile
        DEFAULT: "0.5rem", // 8px - Default
        md: "0.75rem", // 12px - Tablet
        lg: "1rem", // 16px - Desktop
        full: "9999px",
      },

      // ✅ BOX SHADOW UNTUK DARK/LIGHT MODE
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",

        // Dark mode shadows
        "dark-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        "dark-md":
          "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
        "dark-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
      },

      // ✅ ANIMATIONS UNTUK MOBILE FRIENDLY
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },

      // ✅ TRANSITIONS
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
        colors: "background-color, border-color, color, fill, stroke",
      },

      // ✅ CUSTOM UTILITIES
      minHeight: {
        "screen-mobile": "100vh", // Fallback
        screen: "100dvh", // Dynamic viewport height untuk mobile
      },

      height: {
        "screen-mobile": "100vh",
        screen: "100dvh",
      },
    },
  },

  // ✅ PLUGINS TAMBAHAN
  plugins: [
    require("@tailwindcss/forms"), // Untuk styling form yang better
    require("@tailwindcss/typography"), // Untuk typography yang konsisten
    function ({ addUtilities }) {
      addUtilities({
        // Safe area utilities untuk notch phones
        ".pb-safe": {
          "padding-bottom": "env(safe-area-inset-bottom)",
        },
        ".pt-safe": {
          "padding-top": "env(safe-area-inset-top)",
        },
        ".pl-safe": {
          "padding-left": "env(safe-area-inset-left)",
        },
        ".pr-safe": {
          "padding-right": "env(safe-area-inset-right)",
        },

        // Touch target utilities
        ".touch-target": {
          "min-height": "44px",
          "min-width": "44px",
        },

        // Prevent text size adjustment on iOS
        ".text-size-adjust-none": {
          "-webkit-text-size-adjust": "none",
          "text-size-adjust": "none",
        },

        // Better scrolling for mobile
        ".scrollbar-gutter": {
          "scrollbar-gutter": "stable",
        },

        // Dark mode specific
        ".dark\\:invert": {
          "@media (prefers-color-scheme: dark)": {
            filter: "invert(1)",
          },
        },
      });
    },
  ],

  // ✅ CORE PLUGINS YANG DIPAKAI
  corePlugins: {
    // Pastikan core plugins aktif
    preflight: true,
    container: true,
    accessibility: true,
  },
};
