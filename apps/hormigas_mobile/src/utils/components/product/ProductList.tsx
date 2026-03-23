import { LucideIcon } from "lucide-react-native"
import { FlatList, Text } from "react-native"
import { View } from "react-native"
import ProductCard, { ProductCardProps } from "./ProductCard"


interface ProductListProps {
    title: string
    description: string
    icon: LucideIcon
    products: ProductCardProps[]
}


export default function ProductList({
    title,
    description,
    icon: Icon,
    products
}: ProductListProps) {
    return(
        <View className="flex flex-col border rounded-t-xl rounded-b-xl border-gray-200">
            <View className='p-2'>
                <View className='flex flex-row items-center gap-3'>
                <Icon size={40} color='blue'/>
                <Text className='font-bold text-2xl'>{title}</Text>
                </View>
                <Text className='text-gray-600'>{description}</Text>
            </View>
            <FlatList
                data={products}
                keyExtractor={item => item.sku}
                scrollEnabled={false}
                renderItem={({item}) => <ProductCard {...item}/>}
            />
        </View>
    )
}