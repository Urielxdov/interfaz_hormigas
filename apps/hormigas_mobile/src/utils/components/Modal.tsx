import { ReactNode, useEffect, useState } from "react";
import {
  Modal as NativeModal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import ButtonCustom from "./ButtonCustom";
import { X } from "lucide-react-native";
import { bgClass } from "../helpers/ColorHerlper";

type ModalVariant = "confirm" | "info";

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  variant?: ModalVariant;
  onSubmit?: () => void;
  submitTitle?: string;
}

export default function Modal({
  children,
  isOpen,
  onClose,
  variant = "confirm",
  onSubmit,
  submitTitle,
}: ModalProps) {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  return (
    <NativeModal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg max-h-[90%]">
          <View className="flex w-2/12">
            <ButtonCustom
              onPress={handleClose}
              icon={X}
              iconColor="black"
              bgColor={bgClass("gray", 200)}
            />
          </View>

          <ScrollView
            className="mb-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {children}
          </ScrollView>

          <View className="flex-row justify-end gap-3">
            {variant === "info" ? (
              <Pressable
                className="rounded-lg bg-black px-4 py-3"
                onPress={handleClose}
              >
                <Text className="font-semibold text-white">Aceptar</Text>
              </Pressable>
            ) : (
              onSubmit && (
                <Pressable
                  className="rounded-lg bg-black px-4 py-3"
                  onPress={onSubmit}
                >
                  <Text className="font-semibold text-white">
                    {submitTitle ?? "Confirmar"}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        </View>
      </View>
    </NativeModal>
  );
}