import { useEffect, useState } from "react";
import { View } from "react-native";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Text } from "./ui/text";
export default function InputControl({
  value = "",
  name,
  label,
  formData,
  error,
  ...props
}: {
  name: string;
  label: string;
  error?: string;
  formData: { [key: string]: string };
  value?: string;
  [key: string]: any;
}) {
  const [_value, setValue] = useState<string>(value);
  useEffect(() => {
    formData[name] = _value;
  }, [_value]);

  return (
    <View style={{ gap: 10 }}>
      <Label>{label}: </Label>
      <Input
        keyboardType="name-phone-pad"
        placeholder={`Enter ${label}`}
        value={_value}
        onChangeText={setValue}
        className="bg-zinc-900 border-white/40 native:h-16"
        {...props}
      />
      {error && <Text className="text-sm text-red-400">Error: {error}</Text>}
    </View>
  );
}
