/**
 * Photos Lambda Function
 * Handles photo uploads and presigned URL generation
 */

import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB, S3 } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const dynamo = new DynamoDB.DocumentClient();
const s3 = new S3();

const PHOTOS_TABLE = process.env.PHOTOS_TABLE || "PingsPhotos";
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET || "pings-photos";
const PHOTO_URL_EXPIRY = parseInt(process.env.PHOTO_URL_EXPIRY || "3600");

interface PhotoRequest {
  userId: string;
  photoId?: string;
  filename: string;
  contentType: string;
  metadata?: Record<string, string>;
}

interface Photo {
  photoId: string;
  userId: string;
  filename: string;
  contentType: string;
  url?: string;
  uploadUrl?: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const httpMethod = event.httpMethod;

  try {
    // GET - Get photo with presigned URL
    if (httpMethod === "GET") {
      const photoId = event.pathParameters?.photoId;

      if (!photoId) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing photoId" }),
        };
      }

      // Get photo metadata from DynamoDB
      const photo = await dynamo
        .get({
          TableName: PHOTOS_TABLE,
          Key: { photoId },
        })
        .promise();

      if (!photo.Item) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Photo not found" }),
        };
      }

      // Generate presigned URL for download
      const url = s3.getSignedUrl("getObject", {
        Bucket: PHOTOS_BUCKET,
        Key: photo.Item.s3Key,
        Expires: PHOTO_URL_EXPIRY,
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...photo.Item,
          url,
        }),
      };
    }

    // POST - Get upload presigned URL
    if (httpMethod === "POST") {
      const body: PhotoRequest = JSON.parse(event.body || "{}");

      if (!body.userId || !body.filename || !body.contentType) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Missing required fields: userId, filename, contentType",
          }),
        };
      }

      const photoId = body.photoId || uuidv4();
      const s3Key = `photos/${body.userId}/${photoId}-${body.filename}`;

      // Generate presigned URL for upload
      const uploadUrl = s3.getSignedUrl("putObject", {
        Bucket: PHOTOS_BUCKET,
        Key: s3Key,
        ContentType: body.contentType,
        Expires: PHOTO_URL_EXPIRY,
      });

      // Store photo metadata
      const photo: Photo = {
        photoId,
        userId: body.userId,
        filename: body.filename,
        contentType: body.contentType,
        uploadUrl,
        createdAt: new Date().toISOString(),
        metadata: body.metadata,
      };

      await dynamo
        .put({
          TableName: PHOTOS_TABLE,
          Item: photo,
        })
        .promise();

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId,
          uploadUrl,
          expiresIn: PHOTO_URL_EXPIRY,
        }),
      };
    }

    // DELETE - Delete photo
    if (httpMethod === "DELETE") {
      const photoId = event.pathParameters?.photoId;

      if (!photoId) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing photoId" }),
        };
      }

      // Get photo to find S3 key
      const photo = await dynamo
        .get({
          TableName: PHOTOS_TABLE,
          Key: { photoId },
        })
        .promise();

      if (photo.Item) {
        // Delete from S3
        await s3
          .deleteObject({
            Bucket: PHOTOS_BUCKET,
            Key: (photo.Item as any).s3Key,
          })
          .promise();

        // Delete from DynamoDB
        await dynamo
          .delete({
            TableName: PHOTOS_TABLE,
            Key: { photoId },
          })
          .promise();
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Photos error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to process photo request" }),
    };
  }
};
