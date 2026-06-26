export async function startPriceRecognition(onTranscript: (transcript: string) => void, language = "en-US") {
  try {
    const { ExpoSpeechRecognitionModule } = await import("expo-speech-recognition");
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) return { ok: false, reason: "permission" as const };

    const resultListener = ExpoSpeechRecognitionModule.addListener("result", (event) => {
      const transcript = event.results[0]?.transcript;
      if (transcript) onTranscript(transcript);
    });
    const endListener = ExpoSpeechRecognitionModule.addListener("end", () => {
      resultListener.remove();
      endListener.remove();
    });

    ExpoSpeechRecognitionModule.start({
      lang: language,
      interimResults: false,
      maxAlternatives: 1,
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "native-build-required" as const };
  }
}
