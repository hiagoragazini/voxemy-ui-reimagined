
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				'3xl': '1800px',
				'4xl': '2100px',
			},
			fontFamily: {
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'"SF Pro Display"',
					'Roboto',
					'sans-serif'
				],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					apple: '#0066CC', // Azul Apple - cor principal
					'apple-dark': '#004C99',
					'apple-light': '#3399FF',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Apple-specific colors with blue theme
				apple: {
					bg: '#f5f5f7',
					text: {
						primary: '#1d1d1f',
						secondary: '#86868b',
						tertiary: '#6e6e73',
					},
					success: '#34c759',
					warning: '#ff9500',
					error: '#ff3b30',
					card: 'rgba(255, 255, 255, 0.8)',
					border: 'rgba(0, 0, 0, 0.1)'
				},
				// Blue color system replacing purple/violet
				blue: {
					50: '#E6F0FF',
					100: '#CCE0FF',
					200: '#99C2FF',
					300: '#66A3FF',
					400: '#3385FF',
					500: '#0066CC', // Primary blue
					600: '#0052A3',
					700: '#003D7A',
					800: '#002952',
					900: '#001429',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			letterSpacing: {
				'tighter': '-0.5px',
				'tight': '-0.3px',
			},
			boxShadow: {
				'apple': '0 2px 12px rgba(0, 0, 0, 0.05)',
				'apple-hover': '0 4px 16px rgba(0, 0, 0, 0.08)',
				'blue': '0 2px 12px rgba(0, 102, 204, 0.15)',
				'blue-hover': '0 4px 16px rgba(0, 102, 204, 0.25)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
						opacity: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					},
					to: {
						height: '0',
						opacity: '0'
					}
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'pulse': {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' },
					'100%': { transform: 'scale(1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-in-1': 'fade-in 0.3s ease-out 0.1s forwards',
				'fade-in-2': 'fade-in 0.3s ease-out 0.2s forwards',
				'fade-in-3': 'fade-in 0.3s ease-out 0.3s forwards',
				'pulse': 'pulse 2s infinite',
			},
			backdropFilter: {
				'apple': 'blur(20px)',
			},
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }) {
			const newUtilities = {
				'.glass-morphism': {
					'backdrop-filter': 'blur(20px)',
					'background-color': 'rgba(255, 255, 255, 0.8)',
					'border': '1px solid rgba(0, 0, 0, 0.1)',
				},
				'.text-gradient-primary': {
					'background': 'linear-gradient(to right, #0066CC, #3399FF)',
					'background-clip': 'text',
					'-webkit-background-clip': 'text',
					'color': 'transparent',
				},
				'.status-indicator-active': {
					'animation': 'pulse 2s infinite',
				},
			};
			addUtilities(newUtilities);
		},
	],
} satisfies Config;
