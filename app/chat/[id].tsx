import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { AlertTriangle, ArrowLeft, Languages, Send } from "lucide-react-native";
import { AppText } from "@/src/components/ui/AppText";
import { Screen } from "@/src/components/ui/Screen";
import { useAppState } from "@/src/state/AppState";
import { theme } from "@/src/theme/tokens";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? "chat-1";
  const { state, loadMessages, sendMessage } = useAppState();
  const [draft, setDraft] = useState("");
  // Per-message: which bubbles are currently showing the original (untranslated) text.
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
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
        {messages.map((message) => {
          const isSupplier = message.senderType === "supplier";
          // A toggle only makes sense once a real translation exists (translation off =
          // pass-through, so original === translated and there is nothing to reveal).
          const canToggle =
            Boolean(message.translatedBody) &&
            Boolean(message.originalBody) &&
            message.translatedBody !== message.originalBody;
          const revealed = showOriginal[message.id];
          // Default view = translated; toggle reveals the original. Both are already
          // masked when flagged, so the raw text can never surface here.
          const displayBody = revealed
            ? message.originalBody ?? message.body
            : message.translatedBody ?? message.body;
          const toggleColor = isSupplier ? theme.colors.primaryForeground : theme.colors.accent;
          return (
            <View key={message.id} style={isSupplier ? styles.rowEnd : styles.rowStart}>
              <View style={isSupplier ? styles.providerBubble : styles.customerBubble}>
                <AppText color={isSupplier ? theme.colors.primaryForeground : theme.colors.foreground}>
                  {displayBody}
                </AppText>
                {canToggle ? (
                  <Pressable
                    style={styles.toggle}
                    onPress={() => setShowOriginal((prev) => ({ ...prev, [message.id]: !prev[message.id] }))}
                  >
                    <Languages color={toggleColor} size={14} />
                    <AppText variant="eyebrow" color={toggleColor}>
                      {revealed ? "Show translation" : "Show original"}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
              {message.flagged ? (
                <View style={styles.warning}>
                  <AlertTriangle color={theme.colors.destructive} size={14} />
                  <AppText variant="eyebrow" color={theme.colors.destructive} style={styles.warningText}>
                    {message.warning ?? "This message broke platform rules and is under review"}
                  </AppText>
                </View>
              ) : null}
            </View>
          );
        })}
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
  rowStart: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
    gap: 6,
    maxWidth: "82%",
  },
  rowEnd: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
    gap: 6,
    maxWidth: "82%",
  },
  customerBubble: {
    backgroundColor: theme.colors.muted,
    borderRadius: 18,
    maxWidth: "100%",
    padding: 16,
  },
  providerBubble: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    maxWidth: "100%",
    padding: 16,
  },
  toggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  warning: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.destructive,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  warningText: {
    flexShrink: 1,
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
