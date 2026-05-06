import { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'
import { CheckCircle, Clock, RefreshCw } from 'lucide-react-native'
import { useSyncQueueStatus } from '../hooks/useSyncQueueStatus'

const ICON_SIZE = 18

function SpinningRefresh() {
    const rotation = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const anim = Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        )
        anim.start()
        return () => anim.stop()
    }, [rotation])

    const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

    return (
        <Animated.View style={{ transform: [{ rotate }] }}>
            <RefreshCw size={ICON_SIZE} color="#2563eb" />
        </Animated.View>
    )
}

export default function SyncQueueBadge() {
    const { pendingCount, status } = useSyncQueueStatus()

    if (status === 'done') {
        return (
            <View className="flex-row items-center gap-1">
                <CheckCircle size={ICON_SIZE} color="#16a34a" />
            </View>
        )
    }

    return (
        <View className="flex-row items-center gap-1">
            {status === 'syncing' ? (
                <SpinningRefresh />
            ) : (
                <Clock size={ICON_SIZE} color="#d97706" />
            )}
            <View className={`rounded-full px-1.5 py-0.5 ${status === 'syncing' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                <Text className={`text-xs font-semibold ${status === 'syncing' ? 'text-blue-700' : 'text-amber-700'}`}>
                    {pendingCount}
                </Text>
            </View>
        </View>
    )
}
