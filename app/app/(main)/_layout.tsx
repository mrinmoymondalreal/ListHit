import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { initSocket, listenToServer } from "~/hooks/emitter";
import { initRun } from "~/hooks/store";

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

export default function RootLayout() {
  const { isSignedIn, isLoaded, userId } = useAuth();

  if (isLoaded && !isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  const socket = initSocket(userId!);
  listenToServer(socket);
  initRun().then(() => console.log("Database initialized"));

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="list/[id]"
        options={{
          headerShown: false,
        }}
      />
      {/* <Stack.Screen name="+not-found" /> */}
    </Stack>
  );
}
