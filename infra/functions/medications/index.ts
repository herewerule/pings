/**
 * Medications Lambda Function
 * Handles medication logging and reminders
 */

import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamo = new DynamoDB.DocumentClient();

const MEDICATIONS_TABLE = process.env.MEDICATIONS_TABLE || "PingsMedications";
const USERS_TABLE = process.env.USERS_TABLE || "PingsUsers";

interface MedicationRequest {
  userId: string;
  medicationId: string;
  action: "taken" | "skipped" | "refill" | "log";
  timestamp?: string;
  notes?: string;
}

interface MedicationLog {
  userId: string;
  medicationId: string;
  action: string;
  timestamp: string;
  notes?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: MedicationRequest = JSON.parse(event.body || "{}");

    if (!body.userId || !body.medicationId || !body.action) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required fields: userId, medicationId, action",
        }),
      };
    }

    const validActions = ["taken", "skipped", "refill", "log"];
    if (!validActions.includes(body.action)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        }),
      };
    }

    const log: MedicationLog = {
      userId: body.userId,
      medicationId: body.medicationId,
      action: body.action,
      timestamp: body.timestamp || new Date().toISOString(),
      notes: body.notes,
    };

    // Store medication log
    await dynamo
      .put({
        TableName: MEDICATIONS_TABLE,
        Item: log,
      })
      .promise();

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        log,
        message: getActionMessage(body.action),
      }),
    };
  } catch (error) {
    console.error("Medications error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to process medication log" }),
    };
  }
};

function getActionMessage(action: string): string {
  switch (action) {
    case "taken":
      return "Great job! Medication logged.";
    case "skipped":
      return "Noted. Skipped medication logged.";
    case "refill":
      return "Refill logged. Don't forget to reorder!";
    case "log":
      return "Medication log entry saved.";
    default:
      return "Medication action recorded.";
  }
}
