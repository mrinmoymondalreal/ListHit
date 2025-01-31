import {
  isClerkAPIResponseError,
  useSignIn,
  useSignUp,
} from "@clerk/clerk-expo";
import {
  ClerkAPIError,
  EmailCodeFactor,
  SignInFirstFactor,
} from "@clerk/types";
import { useRouter } from "expo-router";
import { LoaderIcon } from "lucide-react-native";
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import HeaderView from "~/components/HeaderView";
import InputControl from "~/components/InputControl";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function Page() {
  const formdata = useRef<{ code?: string; email?: string }>({});

  const [errors2, setErrors2] = React.useState<ClerkAPIError[]>();
  const [loading, setLoading] = React.useState(false);

  const { isLoaded, signUp, setActive } = useSignUp();
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const router = useRouter();

  const [pendingVerification, setPendingVerification] = React.useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (!isSignInLoaded) return;

    try {
      try {
        const resp = await signIn.create({
          identifier: formdata.current.email!,
        });
        const isEmailCodeFactor = (
          factor: SignInFirstFactor
        ): factor is EmailCodeFactor => {
          return factor.strategy === "email_code";
        };
        const emailCodeFactor =
          resp.supportedFirstFactors?.find(isEmailCodeFactor);

        if (emailCodeFactor) {
          const { emailAddressId } = emailCodeFactor;
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailAddressId,
          });
        }
      } catch (err) {
        console.error(err);
        await signUp.create({
          emailAddress: formdata.current.email,
        });
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      }

      setPendingVerification(true);
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    if (!isSignInLoaded) return;

    try {
      try {
        const signInAttempt = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: formdata.current.code!,
        });
        if (signInAttempt.status === "complete") {
          await setSignInActive({ session: signInAttempt.createdSessionId });

          router.push("/(main)");
        } else {
          console.error(signInAttempt);
        }
      } catch (err) {
        const signUpAttempt = await signUp.attemptEmailAddressVerification({
          code: formdata.current.code!,
        });

        if (signUpAttempt.status === "complete") {
          await setActive({ session: signUpAttempt.createdSessionId });
          router.replace("/(main)");
        } else {
          console.error(JSON.stringify({ signUpAttempt }, null, 2));
        }
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) setErrors2(err.errors);
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const AnimatedLoader = Animated.createAnimatedComponent(LoaderIcon);

  const sv = useSharedValue<number>(0);

  React.useEffect(() => {
    if (loading) sv.value = withRepeat(withTiming(1, { duration: 2000 }), -1);
  }, [loading]);

  const loaderStyles = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sv.get() * 360} deg` }],
  }));

  return (
    <HeaderView title={"Getting Started"}>
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
            color="white"
            size={40}
            className="animate-spin"
          />
        </View>
      )}

      <View style={{ marginBottom: 10, paddingHorizontal: 30 }}>
        <Text className="text-lg">
          {pendingVerification
            ? "Enter the verification code sent to your email"
            : "Enter your email id or Signin using Google"}
        </Text>
      </View>
      <View style={{ gap: 20, paddingHorizontal: 30 }}>
        <InputControl formData={formdata.current} name="email" label="Email" />
        <InputControl
          formData={formdata.current}
          name="code"
          label="Verification code"
          editable={pendingVerification}
        />
        {errors2 && (
          <View>
            {errors2.map((el, index) => (
              <Text className={"text-red-400"} key={index}>
                {el.longMessage}
              </Text>
            ))}
          </View>
        )}
        <View>
          <Button
            onPress={async () => {
              setLoading(true);
              // await new Promise((res) => setTimeout(res, 2000));
              if (pendingVerification) {
                await onVerifyPress();
              } else {
                await onSignUpPress();
              }
              setLoading(false);
            }}
          >
            <Text>Submit</Text>
          </Button>
        </View>
        {/* <View className="flex-row gap-2 items-center justify-center">
          <Text className="text-xl">Already a User?</Text>
          <Button variant={"ghost"} onPress={() => router.push("/")}>
            <Text className="text-xl underline">Sign Up</Text>
          </Button>
        </View> */}
      </View>
    </HeaderView>
  );
}
