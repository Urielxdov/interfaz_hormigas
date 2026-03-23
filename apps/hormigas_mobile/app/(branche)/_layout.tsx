import Header from "@/src/utils/components/Header";
import {  Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";


export default function BrancheLayout() {
    return(
        <SafeAreaView className="flex-1" edges={['top']}>
            <Header/>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='index'/>
                <Stack.Screen name='newBranch'/>
            </Stack>
        </SafeAreaView>
    )
}