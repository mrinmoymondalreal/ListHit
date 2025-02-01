import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function Page() {
  const { isSignedIn } = useAuth();
  return <Redirect href={isSignedIn ? "/(main)" : "/(auth)"} />;
}
