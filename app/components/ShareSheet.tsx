import React, { useRef, useMemo, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAtom } from "jotai";
import { useColorScheme } from "~/hooks/useColorScheme";
import { Text } from "./ui/text";
import { Button } from "./ui/button";
import { BackHandler, Share, ToastAndroid, View } from "react-native";
import { shareSheetAtom } from "~/lib/hooks";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";

import { useAuth } from "@clerk/clerk-expo";
import { Sharing } from "~/constants/Share";
import { getFullList } from "~/hooks/emitter";

export const ShareSheet = () => {
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["90%"], []);

  const [isOpen, setOpen] = useAtom(shareSheetAtom);

  const { userId } = useAuth();
  const code = Sharing.current + "";

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.expand();
      getFullList(Sharing.current as string).then((data) => {
        Sharing.data = data;
      });
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

  async function handleCopy() {
    try {
      await Clipboard.setStringAsync(code);
      ToastAndroid.showWithGravity(
        "Code Copied!!",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      await Share.share({
        title: "Share via Code: ",
        message: "Paste the code in your app to get the list\n Code: " + code,
      });
    } catch (error) {
      console.log(error);
    }
  }

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
          <View className="justify-center items-center gap-5 overflow-hidden">
            <View>
              <Text className="text-xl">Ask your friend to scan QR</Text>
            </View>
            <View
              style={{
                width: 300,
                height: 300,
                borderRadius: 20,
              }}
              className="overflow-hidden bg-white justify-center items-center"
            >
              <QRCode
                size={300 - 30}
                value={JSON.stringify({
                  table_unique_id: code,
                  fromUserId: userId,
                })}
                // logo={{uri: base64Logo}}
                // logoSize={30}
                // logoBackgroundColor='transparent'
              />
            </View>
            <View className="w-full justify-center items-center">
              <View className="absolute h-px w-full bg-gray-300" />
              <Text className="text-sm -mt-px bg-black px-2">OR</Text>
            </View>
          </View>
          <View className="items-center">
            <Text className="text-xl">Share via code</Text>
          </View>
          <View>
            <Text>{code}</Text>
          </View>
          <Button onPress={handleCopy}>
            <Text>Copy Code</Text>
          </Button>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};
