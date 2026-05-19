import { Appearance } from 'react-native'
import { TouchableOpacity } from 'react-native'
import { Moon, Sun } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { THEME_STORAGE_KEY } from '@/app/_layout'

export default function ThemeToggle () {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  const toggle = async () => {
    const next = isDark ? 'light' : 'dark'
    Appearance.setColorScheme(next)
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next)
  }

  return (
    <TouchableOpacity onPress={toggle} className='p-2'>
      {isDark
        ? <Sun size={20} color='#a1a1aa' />
        : <Moon size={20} color='#71717a' />
      }
    </TouchableOpacity>
  )
}
