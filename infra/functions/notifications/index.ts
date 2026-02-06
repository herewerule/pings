/**
 * Notifications Lambda Function
 * Handles device token registration and push notifications via SNS
 */

import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB, SNS } from "aws-sdk";

const dynamo = new DynamoDB.DocumentClient();
const sns = new SNS();

const TOKENS_TABLE = process.env.TOKENS_TABLE || "PingsDeviceTokens";
const SNS_PLATFORM_ARN = process.env.SNS_PLATFORM_ARN;

interface NotificationRequest {
  userId: string;
  action: "register" | "deregister" | "send";
  deviceToken: string;
  platform: "android" | "ios";
  message?: string;
  title?: string;
}

interface DeviceToken {
  userId: string;
  deviceToken: string;
  platform: string;
  createdAt: string;
  lastUsed: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: NotificationRequest = JSON.parse(event.body || "{}");

    if (!body.userId || !body.deviceToken || !body.platform) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required fields: userId, deviceToken, platform",
        }),
      };
    }

    const validPlatforms = ["android", "ios"];
    if (!validPlatforms.includes(body.platform)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}`,
        }),
      };
    }

    // Register device token
    if (body.action === "register") {
      const token: DeviceToken = {
        userId: body.userId,
        deviceToken: body.deviceToken,
        platform: body.platform,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      await dynamo
        .put({
          TableName: TOKENS_TABLE,
          Item: token,
        })
        .promise();

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          message: "Device token registered successfully",
        }),
      };
    }

    // Deregister device token
    if (body.action === "deregister") {
      await dynamo
        .delete({
          TableName: TOKENS_TABLE,
          Key: {
            userId: body.userId,
            deviceToken: body.deviceToken,
          },
        })
        .promise();

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          message: "Device token deregistered",
        }),
      };
    }

    // Send notification
    if (body.action === "send") {
      if (!body.message || !body.title) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Missing message or title for send action",
          }),
        };
      }

      // Get user's device tokens
      const tokens = await dynamo
        .query({
          TableName: TOKENS_TABLE,
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: {
            ":uid": body.userId,
          },
        })
        .promise();

      if (!tokens.Items || tokens.Items.length === 0) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "No device tokens found for user" }),
        };
      }

      // Send to each device
      const sendPromises = tokens.Items!.map(async (token) => {
        const platform = token.platform as "android" | "ios";
        const message = getPlatformMessage(platform, body.title!, body.message!);

        return sns
          .publish({
            TargetArn: token.deviceToken,
            Message: message,
            MessageStructure: platform === "android" ? "json" : "default",
          })
          .promise();
      });

      await Promise.all(sendPromises);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          sentCount: tokens.Items!.length,
          message: `Notification sent to ${tokens.Items!.length} devices`,
        }),
      };
    }

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid action" }),
    };
  } catch (error) {
    console.error("Notifications error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to process notification request" }),
    };
  }
};

function getPlatformMessage(
  platform: "android" | "ios",
  title: string,
  message: string
): string {
  if (platform === "android") {
    return JSON.stringify({
      notification: {
        title,
        body: message,
      },
      data: {
        title,
        body: message,
      },
    });
  }

  // iOS uses default message structure
  return message;
}
