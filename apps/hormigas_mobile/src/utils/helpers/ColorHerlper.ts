import { Color, Shade } from "../constants/Colors"

const bgMap: Record<Color, Partial<Record<Shade, string>>> = {
  blue: { 200: 'bg-blue-200', 600: 'bg-blue-600' },
  green: { 200: 'bg-green-200', 600: 'bg-green-600' },
  purple: { 200: 'bg-purple-200', 600: 'bg-purple-600' },
  yellow: { 200: 'bg-yellow-200', 600: 'bg-yellow-600' },
  red: { 200: 'bg-red-200', 600: 'bg-red-600' },
  gray: { 200: 'bg-gray-200', 600: 'bg-gray-600' },
  pink: { 200: 'bg-pink-200', 600: 'bg-pink-600' },
  indigo: { 200: 'bg-indigo-200', 600: 'bg-indigo-600' },
  orange: { 200: 'bg-orange-200', 600: 'bg-orange-600' }
}

const borderMap: Record<Color, Partial<Record<Shade, string>>> = {
  blue: { 300: 'border-blue-300' },
  green: { 300: 'border-green-300' },
  purple: { 300: 'border-purple-300' },
  yellow: { 300: 'border-yellow-300' },
  red: { 300: 'border-red-300' },
  gray: { 300: 'border-gray-300' },
  pink: { 300: 'border-pink-300' },
  indigo: { 300: 'border-indigo-300' },
  orange: { 300: 'border-orange-300' },
}

const textMap: Record<Color, Partial<Record<Shade, string>>> = {
  blue: { 600: 'text-blue-600' },
  green: { 600: 'text-green-600' },
  purple: { 600: 'text-purple-600' },
  yellow: { 600: 'text-yellow-600' },
  red: { 600: 'text-red-600' },
  gray: { 600: 'text-gray-600' },
  pink: { 600: 'text-pink-600' },
  indigo: { 600: 'text-indigo-600' },
  orange: { 600: 'text-orange-600' },
}

export const bgClass = (color: Color, shade: Shade) => bgMap[color][shade] ?? 'bg-gray-600'
export const borderClass = (color: Color, shade: Shade) => borderMap[color][shade] ?? 'border-gray-300'
export const textClass = (color: Color, shade: Shade) => textMap[color][shade] ?? 'text-gray-600'