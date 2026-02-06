/**
 * Photos Lambda Unit Tests (Vitest)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock AWS SDK
vi.mock("aws-sdk", () => ({
  DynamoDB: {
    DocumentClient: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({ Item: undefined }),
      }),
      put: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      }),
      delete: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      }),
    })),
  },
  S3: vi.fn().mockImplementation(() => ({
    getSignedUrl: vi.fn().mockReturnValue("https://signed-url.example.com"),
    deleteObject: vi.fn().mockReturnValue({
      promise: vi.fn().mockResolvedValue({}),
    }),
  })),
}));

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn().mockReturnValue("mock-uuid-1234"),
}));

import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "./index";

describe("Photos Lambda", () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST - Upload Presigned URL", () => {
    it("should generate upload URL successfully", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          filename: "photo.jpg",
          contentType: "image/jpeg",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.photoId).toBe("mock-uuid-1234");
      expect(body.uploadUrl).toBeDefined();
      expect(body.expiresIn).toBe(3600);
    });

    it("should accept custom photoId", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          photoId: "custom-photo-id",
          filename: "photo.jpg",
          contentType: "image/jpeg",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);
      const body = JSON.parse(response.body);

      expect(body.photoId).toBe("custom-photo-id");
    });

    it("should include metadata if provided", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          filename: "photo.jpg",
          contentType: "image/jpeg",
          metadata: { from: "Mom", occasion: "Birthday" },
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);
      const body = JSON.parse(response.body);

      expect(body.photoId).toBeDefined();
    });

    it("should reject missing userId", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          filename: "photo.jpg",
          contentType: "image/jpeg",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("userId");
    });

    it("should reject missing filename", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          contentType: "image/jpeg",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("filename");
    });
  });

  describe("GET - Download Photo", () => {
    it("should return presigned download URL", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "GET",
        pathParameters: { photoId: "photo-123" },
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.url).toBeDefined();
    });

    it("should return 404 for non-existent photo", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "GET",
        pathParameters: { photoId: "non-existent" },
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("not found");
    });

    it("should reject missing photoId", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "GET",
        pathParameters: {},
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
    });
  });

  describe("DELETE - Delete Photo", () => {
    it("should delete photo successfully", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "DELETE",
        pathParameters: { photoId: "photo-123" },
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it("should return 400 for missing photoId", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "DELETE",
        pathParameters: {},
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
    });
  });

  describe("Method Not Allowed", () => {
    it("should return 405 for unsupported methods", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "PUT",
        body: null,
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(405);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("not allowed");
    });
  });
});
