import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { ArrowLeft, Languages, Send } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Card } from "@/src/components/ui/Card";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? "chat-1";
  const { state, loadMessages, sendMessage } = useAppState();
  const [draft, setDraft] = useState("");
  const conversation = state.conversations.find((item) => item.id === conversationId) ?? state.conversations[0];
  const messages = state.messages[conversationId] ?? [];

  useEffect(() => {
    loadMessages(conversationId).catch(() => undefined);
    // loadMessages is provided by app state and may change when messages update.
    // The thread should reload when the conversation route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <ArrowLeft color={theme.colors.primary} size={26} onPress={() => router.back()} />
        <View>
          <AppText variant="label">{conversation?.name ?? "Customer"}</AppText>
          <AppText variant="eyebrow">{conversation?.job ?? "MyKeyz job"}</AppText>
        </View>
      </View>
      <View style={styles.thread}>
        {messages.map((message) => (
          <View key={message.id} style={message.senderType === "supplier" ? styles.providerBubble : styles.customerBubble}>
            <AppText color={message.senderType === "supplier" ? theme.colors.primaryForeground : theme.colors.foreground}>
              {message.body}
            </AppText>
          </View>
        ))}
        <Card muted style={styles.translation}>
          <Languages color={theme.colors.accent} size={18} />
          <AppText variant="eyebrow" color={theme.colors.accent}>
            Auto-translation active
          </AppText>
        </Card>
      </View>
      <View style={styles.composer}>
        <TextInput
          placeholder="Type or speak..."
          placeholderTextColor={theme.colors.mutedForeground}
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
        />
        <Pressable
          style={styles.send}
          onPress={() => {
            const body = draft.trim();
            if (!body) return;
            setDraft("");
            sendMessage(conversationId, body).catch(() => undefined);
          }}
        >
          <Send color={theme.colors.primaryForeground} size={20} fill={theme.colors.primaryForeground} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    paddingBottom: 18,
  },
  thread: {
    flex: 1,
    gap: 14,
    justifyContent: "center",
  },
  customerBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.muted,
    borderRadius: 18,
    maxWidth: "78%",
    padding: 16,
  },
  providerBubble: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    maxWidth: "78%",
    padding: 16,
  },
  translation: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    padding: 14,
  },
  composer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingBottom: 14,
    paddingTop: 12,
  },
  input: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.full,
    color: theme.colors.foreground,
    flex: 1,
    fontFamily: theme.fonts.sans,
    height: 54,
    paddingHorizontal: 18,
  },
  send: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
});
