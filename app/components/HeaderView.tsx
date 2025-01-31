import { router, useNavigation } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useColorScheme } from "~/hooks/useColorScheme";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

export default function HeaderView({
  children,
  title,
  scrollViewProps,
  headerRight,
  asChild = false,
}: {
  title: string;
  children?: React.ReactNode;
  headerRight?: React.ReactNode;
  scrollViewProps?: React.ComponentProps<typeof Animated.ScrollView>;
  asChild?: boolean;
}) {
  const scrollOffset = useSharedValue(0);

  const maxHeight = 150;
  const minHeight = 60;

  const scrollDistance = maxHeight - minHeight;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollOffset.value = event.contentOffset.y;
  });

  const stylz = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollOffset.get(),
        [0, scrollDistance],
        [maxHeight, minHeight],
        Extrapolation.CLAMP
      ),
      padding: interpolate(
        scrollOffset.get(),
        [0, scrollDistance],
        [20, 0],
        Extrapolation.CLAMP
      ),
      justifyContent:
        scrollOffset.get() > scrollDistance / 2 ? "center" : "flex-end",
    };
  });

  const textStylz = useAnimatedStyle(() => {
    return {
      fontSize: interpolate(
        scrollOffset.get(),
        [0, scrollDistance],
        [30, 20],
        Extrapolation.CLAMP
      ),
      lineHeight: interpolate(
        scrollOffset.get(),
        [0, scrollDistance],
        [30 * 2, 20 * 1.5],
        Extrapolation.CLAMP
      ),
    };
  });

  let AnimatedText = Animated.createAnimatedComponent(Text);

  const navigation = useNavigation();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: useColorScheme() === "dark" ? "black" : "white",
      }}
    >
      <Animated.View
        style={[
          stylz,
          StyleSheet.absoluteFill,
          {
            top: useSafeAreaInsets().top,
            width: "100%",
            zIndex: 99,
            padding: 20,
            justifyContent: "flex-end",
            paddingHorizontal: 20,
            transitionProperty: "all",
            transitionDuration: "0.5s",
            backgroundColor: useColorScheme() === "dark" ? "black" : "white",
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {navigation.canGoBack() && (
              <Button
                className="py-4"
                variant={"ghost"}
                size={"icon"}
                onPress={router.back}
              >
                <ArrowLeft color={"white"} size={30} />
              </Button>
            )}
            <AnimatedText style={[textStylz, { fontWeight: "900" }]}>
              {title}
            </AnimatedText>
          </View>

          {headerRight}
        </View>
      </Animated.View>
      <Animated.ScrollView
        style={{
          paddingTop: maxHeight,
        }}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        {...scrollViewProps}
      >
        {children}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
