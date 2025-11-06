import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Windows USA Brand Colors
        primary: {
          DEFAULT: '#E11B37', // Windows USA Red
          dark: '#C0152F',
          light: '#F02D4A',
        },
        navy: {
          DEFAULT: '#001F5B', // Windows USA Dark Blue
          dark: '#001540',
          light: '#003080',
        },
        gray: {
          light: '#EEEEEE', // Windows USA Background
          DEFAULT: '#CCCCCC',
          dark: '#999999',
        },
        background: "#EEEEEE",
        foreground: "#001F5B",
      },
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

