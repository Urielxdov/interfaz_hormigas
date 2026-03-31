// constants/Colors.ts
export const COLORS = {
  blue: 'blue',
  red: 'red',
  green: 'green',
  yellow: 'yellow',
  gray: 'gray',
  purple: 'purple',
  pink: 'pink',
  indigo: 'indigo',
  orange: 'orange',
  white: 'white',
  black: 'black'
} as const

export const SHADES = {
  50: 50,
  100: 100,
  200: 200,
  300: 300,
  400: 400,
  500: 500,
  600: 600,
  700: 700,
  800: 800,
  900: 900,
} as const



export type Color = keyof typeof COLORS
export type Shade = keyof typeof SHADES