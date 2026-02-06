/**
 * Pings - Family App Dashboard
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

export default function FamilyDashboard() {
  const familyMember = {
    name: "Dad",
    lastCheckIn: "2 hours ago",
    lastResponse: "👍 Good",
    heartRate: "72 bpm",
    medications: "✅ All taken today",
  };

  const recentActivity = [
    { type: "photo", from: "Mom", time: "5 min ago", preview: "🏕️" },
    { type: "checkin", from: "Dad", time: "2 hours ago", preview: "👍 Good" },
    { type: "meds", from: "Dad", time: "8 hours ago", preview: "✅ Done" },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Family Circle 👨‍👩‍👧‍👦</Text>

      {/* Dad's Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>📊 {familyMember.name}'s Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Last check-in:</Text>
          <Text style={styles.statusValue}>{familyMember.lastCheckIn}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Response:</Text>
          <Text style={styles.statusValue}>{familyMember.lastResponse}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Heart rate:</Text>
          <Text style={styles.statusValue}>{familyMember.heartRate}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Meds:</Text>
          <Text style={[styles.statusValue, { color: "#10B981" }]}>
            {familyMember.medications}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#3B82F6" }]}>
          <Text style={styles.actionIcon}>👋</Text>
          <Text style={styles.actionLabel}>Send Check-in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#8B5CF6" }]}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionLabel}>Share Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#10B981" }]}>
          <Text style={styles.actionIcon}>🎤</Text>
          <Text style={styles.actionLabel}>Voice Memo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}>
          <Text style={styles.actionIcon}>💊</Text>
          <Text style={styles.actionLabel}>Med Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentActivity.map((item, index) => (
        <View key={index} style={styles.activityItem}>
          <Text style={styles.activityPreview}>{item.preview}</Text>
          <View style={styles.activityInfo}>
            <Text style={styles.activityFrom}>{item.from}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1F2937",
  },
  statusCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1F2937",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  statusLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1F2937",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "white",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activityPreview: {
    fontSize: 28,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityFrom: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  activityTime: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
