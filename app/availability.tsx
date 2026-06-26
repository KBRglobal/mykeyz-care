import { StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { CheckCircle2 } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { BackHeader } from "@/src/components/ui/BackHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { availabilitySlots, nextAvailabilityDays } from "@/src/lib/dates";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function AvailabilityScreen() {
  const { state, toggleAvailabilitySlot } = useAppState();
  const days = nextAvailabilityDays();
  const markedDates = Object.fromEntries(
    Object.entries(state.availability)
      .filter(([, slots]) => slots.length > 0)
      .map(([date]) => [
        date,
        {
          selected: true,
          selectedColor: theme.colors.accent,
        },
      ]),
  );

  return (
    <Screen>
      <BackHeader />
      <View style={styles.header}>
        <AppText variant="heading">Availability</AppText>
        <AppText color={theme.colors.mutedForeground}>
          Mark the times you can take jobs. Customers looking for urgent work see available providers first.
        </AppText>
      </View>
      <Card style={styles.calendarCard}>
        <Calendar
          markedDates={markedDates}
          theme={{
            calendarBackground: theme.colors.surface,
            todayTextColor: theme.colors.accent,
            selectedDayBackgroundColor: theme.colors.accent,
            arrowColor: theme.colors.primary,
            textMonthFontFamily: theme.fonts.sansBold,
            textDayFontFamily: theme.fonts.sans,
          }}
        />
      </Card>
      <View style={styles.days}>
        {days.map((day) => {
          const selected = state.availability[day.key] ?? [];
          return (
            <Card key={day.key} muted style={styles.dayCard}>
              <View style={styles.dayHead}>
                <View>
                  <AppText variant="label">{day.label}</AppText>
                  <AppText variant="eyebrow">{day.short}</AppText>
                </View>
                {selected.length ? <CheckCircle2 color={theme.colors.success} size={21} /> : null}
              </View>
              <View style={styles.slots}>
                {availabilitySlots.map((slot) => {
                  const active = selected.includes(slot);
                  return (
                    <Button
                      key={slot}
                      label={slot}
                      tone={active ? "accent" : "secondary"}
                      style={styles.slot}
                      onPress={() => toggleAvailabilitySlot(day.key, slot)}
                    />
                  );
                })}
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    marginBottom: 16,
  },
  calendarCard: {
    marginBottom: 16,
    padding: 8,
  },
  days: {
    gap: 12,
  },
  dayCard: {
    gap: 12,
  },
  dayHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  slots: {
    flexDirection: "row",
    gap: 8,
  },
  slot: {
    flex: 1,
    height: 46,
    paddingHorizontal: 4,
  },
});
