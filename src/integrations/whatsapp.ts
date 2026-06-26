import { Linking } from "react-native";

function encodeMessage(message: string) {
  return encodeURIComponent(message.trim());
}

export async function openWhatsAppDraft(phone: string | undefined, message: string) {
  const cleanPhone = phone?.replace(/[^\d]/g, "");
  const text = encodeMessage(message);
  const appUrl = cleanPhone ? `whatsapp://send?phone=${cleanPhone}&text=${text}` : `whatsapp://send?text=${text}`;
  const webUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;

  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpen ? appUrl : webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}
