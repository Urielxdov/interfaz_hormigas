import { Text, View } from "react-native"


export interface ProductCardProps {
    name: string
    sku: string
    location: string
    category: string
    stock: number
    maxStock: number
    status: 'Bajo' | 'Critico' | 'Normal'
}

const statusConfig = {
    Critico: { bg: 'bg-red-500', text: 'text-white' },
    Bajo: { bg: 'bg-orange-500', text: 'text-white' },
    Normal: { bg: 'bg-green-500', text: 'text-white' }
}

export default function ProductCard({
    name,
    sku,
    location,
    category,
    stock,
    maxStock,
    status
}: ProductCardProps) {
    const { bg, text } = statusConfig[status]
    return(
        <View className='flex-1 flex-row justify-between py-3 px-2 border-t border-gray-200'>
            <View>
                <Text className='font-bold text-xl'>{name}</Text>
                <Text className='text-gray-600'>{sku}</Text>
                <Text className='text-gray-600'>{location}  •   {category}</Text>
            </View>
            <View className='flex flex-col gap-2'>
                <View className={`flex ${bg} p-1 rounded-2xl px-2`}>
                    <Text className={`${text}`}>{status}</Text>
                </View>
                <Text>{stock}/{maxStock}</Text>
            </View>
        </View>
    )
}