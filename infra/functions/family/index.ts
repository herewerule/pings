/**
 * Family Lambda Function
 * Handles family circle operations and status queries
 */

import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamo = new DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || "PingsUsers";
const FAMILY_TABLE = process.env.FAMILY_TABLE || "PingsFamily";

interface FamilyMember {
  userId: string;
  name: string;
  role: "senior" | "caregiver" | "family";
  avatar?: string;
  deviceTokens?: string[];
  createdAt: string;
}

interface FamilyRequest {
  userId: string;
  familyId: string;
  action: "get" | "join" | "leave" | "invite";
  member?: FamilyMember;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const httpMethod = event.httpMethod;

    // GET - Get family member status
    if (httpMethod === "GET") {
      const userId = event.queryStringParameters?.userId;

      if (!userId) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing userId" }),
        };
      }

      // Get user profile
      const user = await dynamo
        .get({
          TableName: USERS_TABLE,
          Key: { userId },
        })
        .promise();

      if (!user.Item) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "User not found" }),
        };
      }

      // Get recent check-ins and medications
      const recentCheckins = await dynamo
        .query({
          TableName: "PingsCheckins",
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: {
            ":uid": userId,
          },
          Limit: 10,
          ScanIndexForward: false,
        })
        .promise();

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: user.Item,
          recentCheckins: recentCheckins.Items || [],
        }),
      };
    }

    // POST - Join family circle
    if (httpMethod === "POST") {
      const body: FamilyRequest = JSON.parse(event.body || "{}");

      if (!body.userId || !body.familyId || !body.action) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Missing required fields: userId, familyId, action",
          }),
        };
      }

      if (body.action === "join" && !body.member) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing member info for join action" }),
        };
      }

      if (body.action === "join") {
        const member: FamilyMember = {
          ...body.member!,
          userId: body.userId,
          createdAt: new Date().toISOString(),
        };

        await dynamo
          .put({
            TableName: FAMILY_TABLE,
            Item: member,
          })
          .promise();

        return {
          statusCode: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            success: true,
            member,
            message: "Joined family circle successfully",
          }),
        };
      }

      if (body.action === "leave") {
        await dynamo
          .delete({
            TableName: FAMILY_TABLE,
            Key: { userId: body.userId },
          })
          .promise();

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            success: true,
            message: "Left family circle",
          }),
        };
      }

      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid action" }),
      };
    }

    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Family error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to process family request" }),
    };
  }
};
