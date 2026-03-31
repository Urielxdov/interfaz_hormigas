import { useWindowDimensions } from "react-native";


export default function useIsTablet() {
  const { width } = useWindowDimensions()
  return width >= 768
}