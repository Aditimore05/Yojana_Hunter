/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563EB",
          "blue-dark": "#1D4ED8",
          navy: "#102044",
          "navy-dark": "#0B152B",
          teal: "#2DC6B1",
          "teal-dark": "#1FA895",
          bg: "#F1F7FF",
          border: "#E2EAF4",
          surface: "#FFFFFF",
        },
        status: {
          eligible: {
            bg: "#E5F8EA",
            text: "#16A36A",
            border: "#B7EAC6",
          },
          almost: {
            bg: "#FFF3D2",
            text: "#D97706",
            border: "#FDE68A",
          },
          ineligible: {
            bg: "#FDE8EA",
            text: "#DC2626",
            border: "#FECDD3",
          },
          priority: {
            bg: "#FEF3C7",
            text: "#B45309",
          }
        }
      },
      boxShadow: {
        card: "0 2px 8px -1px rgba(16, 32, 68, 0.06), 0 1px 3px -1px rgba(16, 32, 68, 0.04)",
        "card-hover": "0 10px 25px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(16, 32, 68, 0.05)",
        floating: "0 20px 35px -5px rgba(16, 32, 68, 0.18), 0 10px 15px -5px rgba(16, 32, 68, 0.1)",
      },
      borderRadius: {
        card: "16px",
      }
    },
  },
  plugins: [],
}
