import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";
import { AppText } from "@/src/components/ui/AppText";
import { theme } from "@/src/theme/tokens";

type FormFieldProps = TextInputProps & {
  label: string;
};

export function FormField({ label, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="eyebrow">{label}</AppText>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.mutedForeground}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    width: "100%",
  },
  input: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.sansBold,
    fontSize: 17,
    height: 62,
    paddingHorizontal: 18,
    width: "100%",
  },
});
