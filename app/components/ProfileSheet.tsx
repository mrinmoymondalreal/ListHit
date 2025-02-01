import React, { useRef, useMemo, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAtom, useSetAtom } from "jotai";
import { useColorScheme } from "~/hooks/useColorScheme";
import { Text } from "./ui/text";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { BackHandler, View } from "react-native";
import { profileSheetAtom } from "~/lib/hooks";
import { useAuth, useUser } from "@clerk/clerk-expo";

export const ProfileSheet = () => {
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["50%"], []);

  const [isOpen, setOpen] = useAtom(profileSheetAtom);

  const { user } = useUser();
  const { signOut } = useAuth();

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }

    const handleBackPress = () => {
      if (isOpen) {
        sheetRef.current?.close();
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => backHandler.remove();
  }, [isOpen]);

  return (
    <GestureHandlerRootView
      style={{
        position: "absolute",
        backgroundColor:
          useColorScheme() == "dark"
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(0, 0, 0, 0.2)",
        display: isOpen ? "flex" : "none",
        top: useSafeAreaInsets().top,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 999,
      }}
    >
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={0}
        onChange={(event) => {
          if (event == -1) {
            setOpen(false);
          }
        }}
        enableDynamicSizing={false}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: useColorScheme() == "dark" ? "black" : "white",
        }}
        handleIndicatorStyle={{
          backgroundColor: useColorScheme() == "dark" ? "white" : "black",
        }}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: 30,
            paddingVertical: 35,
            gap: 20,
          }}
        >
          <View>
            <Text className="text-xl">Logged In as: </Text>
            <Text className="text-2xl">
              {user?.emailAddresses[0].emailAddress}
            </Text>
          </View>
          <Button onPress={() => signOut()}>
            <Text>Logout</Text>
          </Button>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};
