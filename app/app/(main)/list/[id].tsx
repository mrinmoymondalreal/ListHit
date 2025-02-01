import { PlusIcon, Scroll, Trash2 } from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  LinearTransition,
  SharedValue,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import HeaderView from "~/components/HeaderView";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";

import * as Haptics from "expo-haptics";
import {
  addListItem,
  deleteListItem,
  getAllListItems,
  getListDetail,
  updateListItem,
} from "~/hooks/store";
import { useLocalSearchParams, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { ListItemsScheme } from "~/hooks/database";
import { emitter } from "~/hooks/emitter";
import { useIconColor } from "~/constants/Colors";

interface ListItemsType extends ListItemsScheme {
  isEditing: boolean;
}

function RightAction({
  prog,
  drag,
  handleDelete,
}: {
  prog: SharedValue<number>;
  drag: SharedValue<number>;
  handleDelete: () => void;
}) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            prog.get(),
            [0, 1, 2],
            [100, 0, 0],
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
      <Button variant={"secondary"} size={"icon"} onPress={handleDelete}>
        <Trash2 color={IconColor} />
      </Button>
    </Animated.View>
  );
}

const Item = function ({
  title: _value,
  isDone,
  isEditing: _isEditing,
  id,
  list_id,
  handleList,
  unique_id,
}: {
  title: string;
  isDone: boolean;
  isEditing?: boolean;
  id: number;
  list_id: number;
  unique_id: string;
  handleList: React.Dispatch<React.SetStateAction<ListItemsType[]>>;
}) {
  const [checked, _setChecked] = React.useState(isDone);
  const [isEditing, _setEditing] = React.useState(_isEditing || false);
  const value = React.useRef(_value);
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    emitter.on("list-item-update-v2", (_event) => {
      let event = _event as [string, string, boolean];
      if (event[0] == unique_id) {
        value.current = event[1];
        _setChecked(event[2]);
        setCount((p) => p + 1);
      }
    });

    return () => emitter.off("list-item-update-v2");
  }, []);

  const AnimatedText = Animated.createAnimatedComponent(Text);
  const AnimatedInput = Animated.createAnimatedComponent(React.memo(Input));

  const TextAreaHeight = useSharedValue(25);

  function setChecked(v: boolean | ((prev: boolean) => boolean)) {
    _setChecked((prev) => {
      const result = typeof v === "function" ? v(prev) : v;
      updateListItem(list_id, id, value.current, result);
      return result;
    });
  }

  function setEditing(v: boolean) {
    updateListItem(list_id, id, value.current, checked);
    _setEditing(v);
  }

  async function handleDelete() {
    await deleteListItem(list_id, id);
    handleList((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={(prog, drag) => (
        <RightAction handleDelete={handleDelete} prog={prog} drag={drag} />
      )}
      enableTrackpadTwoFingerGesture
    >
      <Pressable
        onPress={() => setChecked((c) => !c)}
        onLongPress={() => setEditing(true)}
      >
        <Animated.View
          entering={SlideInDown}
          exiting={FadeOut}
          layout={LinearTransition.easing(Easing.linear)}
          className="flex-row gap-4 items-center border-b border-b-white/20 py-4 pl-5"
        >
          <Checkbox checked={checked} onCheckedChange={setChecked} />
          {isEditing ? (
            <AnimatedInput
              entering={FadeIn}
              exiting={FadeOut}
              placeholder="Enter task"
              multiline={true}
              onBlur={() => setEditing(false)}
              autoFocus
              style={{
                fontSize: 20,
                borderWidth: 0,
                width: "85%",
                padding: 0,
                height: TextAreaHeight,
                paddingHorizontal: 0,
                marginTop: 2,
                marginLeft: -10,
                backgroundColor: "transparent",
                textDecorationLine: checked ? "line-through" : "none",
              }}
              defaultValue={value.current}
              onChangeText={(text) => {
                const g = text.match(/\n/g);
                if (g && g.length! > 0) {
                  setEditing(false);
                  return;
                }
                value.current = text;
              }}
              onContentSizeChange={(event) => {
                TextAreaHeight.value = withTiming(
                  event.nativeEvent.contentSize.height,
                  { duration: 200, easing: Easing.linear }
                );
              }}
            />
          ) : (
            <AnimatedText
              entering={FadeIn}
              exiting={FadeOut}
              style={{
                fontSize: 20,
                marginTop: 5,
                paddingRight: 20,
                width: "85%",
                textDecorationLine: checked ? "line-through" : "none",
              }}
            >
              {value.current}
            </AnimatedText>
          )}
        </Animated.View>
      </Pressable>
    </ReanimatedSwipeable>
  );
};

export default function Page() {
  const { id } = useLocalSearchParams() as { id: string };
  const [data, setData] = React.useState<ListItemsType[]>([]);
  const [title, setTitle] = React.useState("");

  useEffect(() => {
    if (data.length == 0) {
      getAllListItems(parseInt(id)).then((res) => {
        setData(res.map((e) => ({ ...e, isEditing: false })));
      });
    }

    if (title.trim().length == 0)
      getListDetail(parseInt(id)).then((res) => {
        setTitle(res[0].title);
      });
  }, []);

  useEffect(() => {
    emitter.on("list-item-update-v2", (_event) => {
      console.log(_event);
      getAllListItems(parseInt(id)).then((result) => {
        let res = result.map((e) => ({ ...e, isEditing: false }));
        setData(() => res);
      });
    });
    return () => emitter.off("list-item-update-v2");
  }, []);

  async function handleAdd() {
    const _id = await addListItem(parseInt(id), "", false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData([
      ...data,
      {
        list_id: parseInt(id),
        id: _id,
        isEditing: true,
        title: "",
        isDone: false,
      },
    ]);
  }

  const IconColor = useIconColor();

  return (
    <GestureHandlerRootView>
      <HeaderView
        title={title}
        headerRight={
          <Button onPress={handleAdd} variant={"ghost"} size={"icon"}>
            <PlusIcon color={IconColor} />
          </Button>
        }
      >
        <ScrollView horizontal>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            style={{ width: Dimensions.get("screen").width }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({
              item: { id, list_id, isDone, isEditing, title, unique_id },
            }) => {
              return (
                <Item
                  list_id={list_id}
                  id={id}
                  title={title}
                  //@ts-ignore
                  isDone={isDone == 1 || isDone == true}
                  isEditing={isEditing}
                  key={unique_id!}
                  handleList={setData}
                  unique_id={unique_id || ""}
                />
              );
            }}
          />
        </ScrollView>

        <View style={{ height: 200 }}></View>
      </HeaderView>
    </GestureHandlerRootView>
  );
}
