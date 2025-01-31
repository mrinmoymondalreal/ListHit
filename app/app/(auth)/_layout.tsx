import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import "react-native-reanimated";

export default function Layout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href={"/(main)"} />;
  }

  return (
    <Stack screenOptions={{ animation: "fade_from_bottom" }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
