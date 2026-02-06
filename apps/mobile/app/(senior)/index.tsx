/**
 * Pings - Senior App (Main Screen)
 * Maximum 4 buttons, large UI, voice-first accessibility
 */

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useEffect } from "react";
import * as Speech from "expo-speech";

export default function SeniorHomeScreen() {
  useEffect(() => {
    Speech.speak("Welcome to Pings. Tap a button to check in with your family.", {
      pitch: 0.8,
      rate: 0.9,
    });
  }, []);

  const handleButtonPress = (speech: string) => {
    Speech.speak(speech, { pitch: 0.8, rate: 0.9 });
  };

  const buttons = [
    {
      icon: "👋",
      label: "Just Checking In",
      emoji: "💙",
      speech: "Glad you're here! How are you feeling today?",
      color: "#3B82F6",
    },
    {
      icon: "💊",
      label: "Meds Today?",
      emoji: "💊",
      speech: "Did you take your medications today?",
      color: "#8B5CF6",
    },
    {
      icon: "📷",
      label: "Family Photo",
      emoji: "📷",
      speech: "You have a new photo from family!",
      color: "#10B981",
    },
    {
      icon: "📞",
      label: "Call [Name]",
      emoji: "📞",
      speech: "Calling your family member.",
      color: "#F59E0B",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pings 👋</Text>

      <View style={styles.buttonGrid}>
        {buttons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.button, { backgroundColor: button.color }]}
            onPress={() => handleButtonPress(button.speech)}
            accessibilityLabel={`${button.label}. ${button.speech}`}
          >
            <Text style={styles.buttonIcon}>{button.icon}</Text>
            <Text style={styles.buttonLabel}>{button.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>
        Tap a button • Your family will know you're OK 💙
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#1F2937",
  },
  buttonGrid: {
    gap: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 20,
    minHeight: 80,
  },
  buttonIcon: {
    fontSize: 48,
    marginRight: 20,
  },
  buttonLabel: {
    fontSize: 28,
    fontWeight: "600",
    color: "white",
  },
  footer: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
  },
});
