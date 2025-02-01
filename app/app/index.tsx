import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { View } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";

export default function Page() {
  const { isSignedIn } = useAuth();
  return <Redirect href={isSignedIn ? "/(main)" : "/(auth)"} />;
}
