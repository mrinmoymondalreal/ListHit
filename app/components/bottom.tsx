import React, { useRef, useMemo, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAtom, useSetAtom } from "jotai";
import { editSheetAtom, isCurrentListAtom } from "~/lib/hooks";
import { useColorScheme } from "~/hooks/useColorScheme";
import { Text } from "./ui/text";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { addList, deleteList, getListDetail, updateList } from "~/hooks/store";
import { ColorValue, Dimensions, Modal, Pressable, View } from "react-native";
import { Trash2Icon } from "lucide-react-native";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { COLORS } from "~/lib/constant";
import { EMOJIS } from "~/lib/constants";

function DeleteButton({ id }: { id: number }) {
  const setClose = useSetAtom(editSheetAtom);

  async function handleDelete() {
    await deleteList(id);
    setClose(false);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={"secondary"} size={"icon"}>
          <Trash2Icon color={"white"} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="mx-5">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure to delete the list?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will delete all the items inside
            the list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Cancel</Text>
          </AlertDialogCancel>
          <AlertDialogAction onPress={handleDelete}>
            <Text>Continue</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ColorSelector({
  color,
  large,
}: {
  color: ColorValue;
  large?: boolean;
}) {
  return (
    <View
      style={{
        width: large ? 40 : 30,
        height: large ? 40 : 30,
        borderRadius: "100%",
        borderWidth: 2.5,
        borderColor: color,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: large ? 30 : 20,
          height: large ? 30 : 20,
          borderRadius: "100%",
          backgroundColor: color,
        }}
      ></View>
    </View>
  );
}

export const BottomEditSheet = () => {
  const sheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["50%", "80%"], []);

  const [isEditSheetOpen, setEditSheetOpen] = useAtom(editSheetAtom);
  const [currentList, setCurrentList] = useAtom(isCurrentListAtom);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState(
    COLORS[Math.floor(Math.random() * COLORS.length)]
  );
  const [emoji, setEmoji] = React.useState(
    EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
  );

  const [selectColor, setSelectColor] = React.useState(false);
  const [selectEmoji, setSelectEmoji] = React.useState(false);

  useEffect(() => {
    if (isEditSheetOpen) {
      sheetRef.current?.expand();
      if (currentList) {
        getListDetail(currentList).then((details) => {
          if (details.length > 0) {
            setTitle(details[0].title);
            setDescription(details[0].description);
            setColor(details[0].color);
            setEmoji(details[0].tag);
          }
        });
      }
    } else {
      sheetRef.current?.close();
      setCurrentList(null);
      setTitle("");
      setDescription("");
    }
  }, [isEditSheetOpen]);

  async function handleSave() {
    try {
      if (currentList) {
        await updateList(currentList, title, description, color, emoji);
      } else await addList(title, description, color, emoji);
      setEditSheetOpen(false);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <GestureHandlerRootView
      style={{
        position: "absolute",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        display: isEditSheetOpen ? "flex" : "none",
        top: useSafeAreaInsets().top,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 999,
      }}
    >
      <Modal
        onRequestClose={() => {
          setSelectEmoji(false);
        }}
        visible={selectEmoji}
        animationType="slide"
      >
        <View
          style={{
            width: Dimensions.get("screen").width,
            height: Dimensions.get("screen").height,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              borderRadius: 20,
              elevation: 5,
              gap: 20,
              width: 300,
              padding: 20,
              backgroundColor: "white",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View className="flex-row gap-5 justify-center items-center flex-wrap">
              {EMOJIS.map((emoji, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setEmoji(emoji);
                    setSelectEmoji(false);
                  }}
                >
                  <Button>
                    <Text style={{ fontSize: 20, lineHeight: 21 }}>
                      {emoji}
                    </Text>
                  </Button>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => {
                setSelectEmoji(false);
              }}
            >
              <Button variant={"secondary"}>
                <Text>Close</Text>
              </Button>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        onRequestClose={() => {
          setSelectColor(false);
        }}
        visible={selectColor}
        animationType="slide"
      >
        <View
          style={{
            width: Dimensions.get("screen").width,
            height: Dimensions.get("screen").height,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              borderRadius: 20,
              elevation: 5,
              gap: 20,
              width: 300,
              padding: 20,
              backgroundColor: "white",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View className="flex-row gap-5 justify-center items-center flex-wrap">
              {COLORS.map((color, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setColor(color);
                    setSelectColor(false);
                  }}
                >
                  <Button>
                    <ColorSelector color={color} large />
                  </Button>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => {
                setSelectColor(false);
              }}
            >
              <Button variant={"secondary"}>
                <Text>Close</Text>
              </Button>
            </Pressable>
          </View>
        </View>
      </Modal>
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={0}
        onChange={(event) => {
          if (event == -1) {
            setEditSheetOpen(false);
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
          <View className="flex-row justify-between items-center">
            <Text style={{ fontSize: 30, lineHeight: 30 }}>
              {currentList ? "Edit Details" : "Add New List"}
            </Text>

            {currentList && <DeleteButton id={currentList} />}
          </View>
          <View className="flex-row justify-between items-center">
            <Button
              variant={"secondary"}
              style={{ height: 50 }}
              onPress={() => setSelectColor(true)}
            >
              <ColorSelector color={color} />
            </Button>
            <Button variant={"secondary"} onPress={() => setSelectEmoji(true)}>
              <Text>{emoji}</Text>
            </Button>
          </View>
          <Input
            placeholder={`Enter List Name`}
            className="border-white/40 native:h-16"
            value={title}
            onChangeText={(text) => setTitle(text)}
          />
          <Textarea
            placeholder={`Enter Description`}
            className="border-white/40 py-4"
            value={description}
            onChangeText={(text) => setDescription(text)}
          />
          <Button onPress={handleSave}>
            <Text>{currentList ? "Update" : "Add"}</Text>
          </Button>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};
