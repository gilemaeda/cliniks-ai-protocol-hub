
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";

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
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
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
				// Cores específicas para a área estética
				pink: {
					50: '#fef7ff',
					100: '#fdeeff',
					200: '#fdd5ff',
					300: '#fcb6ff',
					400: '#f986ff',
					500: '#f253ff',
					600: '#e931f7',
					700: '#cc1ed9',
					800: '#a61bb0',
					900: '#881c8e',
				},
				rose: {
					50: '#fff1f2',
					100: '#ffe4e6',
					200: '#fecdd3',
					300: '#fda4af',
					400: '#fb7185',
					500: '#f43f5e',
					600: '#e11d48',
					700: '#be123c',
					800: '#9f1239',
					900: '#881337',
				},
				cliniks: {
					// Nova paleta de cores da Cliniks
					gray: '#424242',
					purple: '#7f00fa',
					pink: '#fb0082',
					aqua: '#0ff0b3',
					// Mantemos as tonalidades para compatibilidade
					50: '#fef4ff',
					100: '#fce7ff',
					200: '#f9d0fe',
					300: '#f5acfc',
					400: '#7f00fa', // Atualizado para roxo
					500: '#fb0082', // Atualizado para rosa
					600: '#d128d6',
					700: '#ae1fb3',
					800: '#424242', // Atualizado para cinza
					900: '#0ff0b3', // Atualizado para verde água
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					from: {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'gradient-x': {
					'0%, 100%': {
						'background-position': '0% 50%'
					},
					'50%': {
						'background-position': '100% 50%'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						'box-shadow': '0 0 15px rgba(127,0,250,0.15)'
					},
					'50%': {
						'box-shadow': '0 0 25px rgba(251,0,130,0.25)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'gradient-slow': 'gradient-x 8s ease infinite',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
			},
			backgroundImage: {
				'gradient-aesthetic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'gradient-cliniks': 'linear-gradient(135deg, #7f00fa 0%, #fb0082 100%)', // Atualizado com as novas cores roxo e rosa
				'gradient-premium': 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
				'gradient-cliniks-full': 'linear-gradient(135deg, #7f00fa 0%, #fb0082 50%, #0ff0b3 100%)', // Novo gradiente com todas as cores
			}
		}
	},
	  plugins: [tailwindcssAnimate, tailwindcssTypography],
} satisfies Config;
