import { Stack } from "expo-router";

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="trade" />
      <Stack.Screen name="coverage" />
      <Stack.Screen name="business" />
      <Stack.Screen name="license" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
