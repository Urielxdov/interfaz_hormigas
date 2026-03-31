import Header from "@/src/utils/components/Header";
import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";


export default function SessionLayout() {
    return(
        <SafeAreaView className="flex-1 justify-center bg-blue-100" edges={['top']}>
            <Slot/>
        </SafeAreaView>
    )
}