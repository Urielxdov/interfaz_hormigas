import Header from "@/src/utils/components/Header";
import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";


export default function InventoryLayout() {
    return(
        <SafeAreaView className="flex-1" edges={['top']}>
            <Header/>
            <Slot/>
        </SafeAreaView>
    )
}