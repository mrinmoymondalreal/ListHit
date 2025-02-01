import React, { useRef, useMemo, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAtom } from "jotai";
import { useColorScheme } from "~/hooks/useColorScheme";
import { Text } from "./ui/text";
import { Button } from "./ui/button";
import { StyleSheet, View } from "react-native";
import { scannerSheetAtom } from "~/lib/hooks";
import { Input } from "./ui/input";

import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LoaderIcon } from "lucide-react-native";
import { SERVER_LINK } from "~/constants/Server";
import { useAuth } from "@clerk/clerk-expo";
import { Sharing } from "~/constants/Share";
import { getFullList, prepareList } from "~/hooks/emitter";
import { useIconColor } from "~/constants/Colors";

export const ScannerSheet = () => {
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["90%"], []);

  const [isOpen, setOpen] = useAtom(scannerSheetAtom);

  const [code, setCode] = useState("");

  const [isCameraActive, setCameraActive] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();

  const { userId } = useAuth();

  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.expand();
      setCameraActive(true);
    } else {
      sheetRef.current?.close();
      setCameraActive(false);
    }
  }, [isOpen]);

  async function handlePostCode(uniqueId: string, fromUserId: string) {
    console.log("I amhere in handlePostCode #2", "resp");
    let resp = await fetch(`${SERVER_LINK}/shared/list/${uniqueId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, fromUserId: fromUserId }),
    });
    if (resp.status !== 200) return;
    try {
      resp = await resp.json();
      prepareList(resp as any);
      setOpen(false);
    } catch (err) {
      console.log("from file ScannerSheet.tsx", err);
    }
  }

  async function handleScannedCode(scanningResult: BarcodeScanningResult) {
    try {
      const data = JSON.parse(scanningResult.data);

      let uniqueId = data.table_unique_id;
      let fromUserId = data.fromUserId;

      setLoading(true);
      if (uniqueId && fromUserId) {
        setCameraActive(false);
        setCode(uniqueId + "&" + fromUserId);
        await handlePostCode(uniqueId, fromUserId);
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      setCameraActive(true);
    }
  }

  async function handleViaCode() {
    try {
      if (code.trim() == "") return;
      setLoading(true);
      let [uniqueId, fromUserId] = code.trim().split("&") as string[];
      if (uniqueId && fromUserId) {
        setCameraActive(false);
        await handlePostCode(uniqueId, fromUserId);
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      setCameraActive(true);
    }
  }

  const AnimatedLoader = Animated.createAnimatedComponent(LoaderIcon);

  const sv = useSharedValue<number>(0);

  React.useEffect(() => {
    if (loading) sv.value = withRepeat(withTiming(1, { duration: 2000 }), -1);
  }, [loading]);

  const loaderStyles = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sv.get() * 360} deg` }],
  }));

  const IconColor = useIconColor();

  return (
    <GestureHandlerRootView
      style={{
        position: "absolute",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        display: isOpen ? "flex" : "none",
        top: useSafeAreaInsets().top,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 999,
      }}
    >
      {loading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              width: "100%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 9999,
            },
          ]}
        >
          <AnimatedLoader
            style={loaderStyles}
            color={IconColor}
            size={40}
            className="animate-spin"
          />
        </View>
      )}
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
          backgroundColor: useColorScheme() == "dark" ? "white" : "",
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
              <Text className="text-xl">Scanner QR to get list</Text>
            </View>
            <View
              style={{
                width: 300,
                height: 300,
                borderRadius: 20,
              }}
              className="overflow-hidden bg-gray-500"
            >
              {!permission || permission.status !== "granted" ? (
                <View className="px-4 py-5 gap-5">
                  <Text className="text-2xl">
                    Please Grant Camera permission to scan qr
                  </Text>
                  <Button onPress={requestPermission}>
                    <Text>Grant Permission</Text>
                  </Button>
                </View>
              ) : (
                isCameraActive && (
                  <CameraView
                    style={{
                      flex: 1,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: "white",
                    }}
                    facing={"back"}
                    onBarcodeScanned={handleScannedCode}
                  ></CameraView>
                )
              )}
            </View>
            <View className="w-full justify-center items-center">
              <View className="absolute h-px w-full bg-gray-300" />
              <Text className="text-sm -mt-px bg-black px-2">OR</Text>
            </View>
          </View>
          <View>
            <Text className="text-xl">Enter Code: </Text>
          </View>
          <View>
            <Input
              placeholder="Enter code"
              value={code}
              onChangeText={setCode}
            />
          </View>
          <Button onPress={handleViaCode}>
            <Text>Get List</Text>
          </Button>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};
