/**
 * Checkin Lambda Function
 * Handles senior check-ins (mood, status, quick responses)
 */

import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB, S3, SNS } from "aws-sdk";

const dynamo = new DynamoDB.DocumentClient();
const sns = new SNS();

const CHECKINS_TABLE = process.env.CHECKINS_TABLE || "PingsCheckins";
const FAMILY_NOTIFICATIONS_TOPIC = process.env.FAMILY_NOTIFICATIONS_TOPIC;

interface CheckinRequest {
  userId: string;
  type: "checkin" | "mood" | "status";
  value: string;
  emoji?: string;
  timestamp?: string;
}

interface CheckinResponse {
  id: string;
  userId: string;
  type: string;
  value: string;
  emoji?: string;
  timestamp: string;
  sentToFamily: boolean;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: CheckinRequest = JSON.parse(event.body || "{}");

    // Validate required fields
    if (!body.userId || !body.type || !body.value) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required fields: userId, type, value",
        }),
      };
    }

    const checkin: CheckinResponse = {
      id: `${body.userId}-${Date.now()}`,
      userId: body.userId,
      type: body.type,
      value: body.value,
      emoji: body.emoji,
      timestamp: body.timestamp || new Date().toISOString(),
      sentToFamily: false,
    };

    // Store in DynamoDB
    await dynamo
      .put({
        TableName: CHECKINS_TABLE,
        Item: checkin,
      })
      .promise();

    // Notify family via SNS if configured
    if (FAMILY_NOTIFICATIONS_TOPIC) {
      await sns
        .publish({
          TopicArn: FAMILY_NOTIFICATIONS_TOPIC,
          Message: JSON.stringify({
            type: "checkin",
            userId: body.userId,
            value: body.value,
            emoji: body.emoji,
            timestamp: checkin.timestamp,
          }),
        })
        .promise();

      checkin.sentToFamily = true;
    }

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkin),
    };
  } catch (error) {
    console.error("Checkin error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to process checkin" }),
    };
  }
};
