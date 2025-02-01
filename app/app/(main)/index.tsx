import { router, useFocusEffect } from "expo-router";
import {
  ChevronRight,
  Plus,
  ScanQrCode,
  Share2Icon,
  UserCircle2Icon,
} from "lucide-react-native";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import HeaderView from "~/components/HeaderView";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

import React, { useEffect } from "react";

import { BottomEditSheet } from "~/components/bottom";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSetAtom } from "jotai";
import {
  editSheetAtom,
  isCurrentListAtom,
  profileSheetAtom,
  scannerSheetAtom,
  shareSheetAtom,
} from "~/lib/hooks";
import { getAllListItems, getAllLists } from "~/hooks/store";
import { emitter } from "~/hooks/emitter";

import { ListsScheme } from "~/hooks/database";

import * as Haptics from "expo-haptics";
import { ProfileSheet } from "~/components/ProfileSheet";
import { ScannerSheet } from "~/components/ScannerSheet";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Sharing } from "~/constants/Share";
import { ShareSheet } from "~/components/ShareSheet";
import { useIconColor } from "~/constants/Colors";

function RightAction({
  prog,
  drag,
  handleShare,
}: {
  prog: SharedValue<number>;
  drag: SharedValue<number>;
  handleShare: () => void;
}) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            prog.get(),
            [0, 1, 2],
            [100, 20, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const IconColor = useIconColor();

  return (
    <Animated.View
      style={[{ justifyContent: "center", paddingRight: 20 }, styleAnimation]}
    >
      <Button variant={"secondary"} size={"icon"} onPress={handleShare}>
        <Share2Icon color={IconColor} />
      </Button>
    </Animated.View>
  );
}

function ListItem({ item }: { item: ListsScheme }) {
  const [totalItems, setTotal] = React.useState(0);
  const setEditSheetOpen = useSetAtom(editSheetAtom);
  const setCurrentList = useSetAtom(isCurrentListAtom);

  const setShareSheetOpen = useSetAtom(shareSheetAtom);

  useEffect(() => {
    const updateNumber = () =>
      getAllListItems(item.id).then((res) => {
        setTotal(res.length);
      });
    updateNumber();
    emitter.on("list-item-update", updateNumber);
    emitter.on("list-item-update-v2", updateNumber);

    return () => {
      emitter.off("list-item-update");
      emitter.off("list-item-update-v2");
    };
  }, []);

  function handleShare() {
    Sharing.current = item.unique_id as string;
    setShareSheetOpen(true);
    return;
  }
  const IconColor = useIconColor();

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={(prog, drag) => (
        <RightAction handleShare={handleShare} prog={prog} drag={drag} />
      )}
      enableTrackpadTwoFingerGesture
    >
      <Pressable
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setEditSheetOpen(true);
          setCurrentList(item.id);
        }}
        className="flex-row gap-2 items-center justify-between"
      >
        <Pressable>
          <View
            className="w-16 aspect-square rounded-lg flex justify-center items-center"
            style={{ backgroundColor: item.color }}
          >
            <Text className="text-3xl">{item.tag}</Text>
          </View>
        </Pressable>
        <View className="flex-1 mx-4">
          <Text className="text-xl font-semibold">{item.title}</Text>
          <Text className="text-gray-400">{totalItems} products</Text>
        </View>
        <View>
          <Button
            //@ts-ignore
            onPress={() => router.push(`/list/${item.id}`)}
            variant={"secondary"}
            size={"icon"}
          >
            <ChevronRight size={30} color={IconColor} />
          </Button>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export default function Page() {
  const setEditSheetOpen = useSetAtom(editSheetAtom);
  const setProfileSheetOpen = useSetAtom(profileSheetAtom);
  const setScannerSheetOpen = useSetAtom(scannerSheetAtom);
  const [data, setData] = React.useState<ListsScheme[]>([]);
  useEffect(() => {
    getAllLists().then((res) => {
      setData(res);
    });

    emitter.on("list-update", () => {
      getAllLists().then((res) => {
        setData(res);
      });
    });

    return () => {
      emitter.off("list-update");
    };
  }, []);

  const IconColor = useIconColor();

  return (
    <GestureHandlerRootView>
      <ShareSheet />
      <ScannerSheet />
      <ProfileSheet />
      <BottomEditSheet />
      <SafeAreaView style={{ flex: 1 }}>
        <HeaderView
          title={"List Hit"}
          headerRight={
            <View className="flex-row gap-2">
              <Button
                variant={"ghost"}
                size={"icon"}
                className="py-4"
                onPress={() => setEditSheetOpen(true)}
              >
                <Plus color={IconColor} size={25} />
              </Button>
              <Button
                onPress={() => setScannerSheetOpen(true)}
                variant={"ghost"}
                size={"icon"}
                className="py-4"
              >
                <ScanQrCode color={IconColor} size={25} />
              </Button>
              <Button
                onPress={() => setProfileSheetOpen(true)}
                variant={"ghost"}
                size={"icon"}
                className="py-4"
              >
                <UserCircle2Icon color={IconColor} size={25} />
              </Button>
            </View>
          }
        >
          <ScrollView horizontal>
            <FlatList
              style={{
                paddingHorizontal: 20,
                width: Dimensions.get("screen").width,
              }}
              contentContainerStyle={{ gap: 20 }}
              data={data}
              renderItem={({ item, index }) => {
                return <ListItem item={item} key={index} />;
              }}
            />
          </ScrollView>
          <View style={{ height: 300 }} />
        </HeaderView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
