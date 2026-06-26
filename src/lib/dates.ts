import { addDays, format } from "date-fns";

export const availabilitySlots = ["Morning", "Afternoon", "Evening"];

export function nextAvailabilityDays(days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(new Date(), index);
    return {
      key: format(date, "yyyy-MM-dd"),
      label: index === 0 ? "Today" : index === 1 ? "Tomorrow" : format(date, "EEE"),
      short: format(date, "d MMM"),
    };
  });
}
