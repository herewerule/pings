/**
 * Notifications Lambda Unit Tests (Vitest)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock AWS SDK
vi.mock("aws-sdk", () => ({
  DynamoDB: {
    DocumentClient: vi.fn().mockImplementation(() => ({
      put: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      }),
      delete: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      }),
      query: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({ Items: [] }),
      }),
    })),
  },
  SNS: vi.fn().mockImplementation(() => ({
    publish: vi.fn().mockReturnValue({
      promise: vi.fn().mockResolvedValue({}),
    }),
  })),
}));

import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "./index";

describe("Notifications Lambda", () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Register Device Token", () => {
    it("should register Android device token", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          action: "register",
          deviceToken: "android-token-123",
          platform: "android",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it("should register iOS device token", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "mom-001",
          action: "register",
          deviceToken: "ios-token-abc",
          platform: "ios",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it("should reject missing userId", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          action: "register",
          deviceToken: "token-123",
          platform: "android",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("userId");
    });

    it("should reject invalid platform", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          action: "register",
          deviceToken: "token-123",
          platform: "web",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("Invalid platform");
    });
  });

  describe("Deregister Device Token", () => {
    it("should deregister device token", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          action: "deregister",
          deviceToken: "token-123",
          platform: "android",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe("Send Notification", () => {
    it("should send notification to user devices", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          action: "send",
          deviceToken: "token-123",
          platform: "android",
          title: "Time for meds!",
          message: "Don't forget to take your medication 💊",
        }),
      } as APIGatewayProxyEvent;

      // Mock user has tokens
      vi.doMock("aws-sdk", () => ({
        DynamoDB: {
          DocumentClient: vi.fn().mockImplementation(() => ({
            put: vi.fn().mockReturnValue({
              promise: vi.fn().mockResolvedValue({}),
            }),
            delete: vi.fn().mockReturnValue({
              promise: vi.fn().mockResolvedValue({}),
            }),
            query: vi.fn().mockReturnValue({
              promise: vi.fn().mockResolvedValue({
                Items: [{ userId: "dad-001", deviceToken: "token-123", platform: "android" }],
              }),
            }),
          })),
        },
        SNS: vi.fn().mockImplementation(() => ({
          publish: vi.fn().mockReturnValue({
            promise: vi.fn().mockResolvedValue({}),
          }),
        })),
      }));

      const { handler: sendHandler } = await import("./index");
      const response = await sendHandler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.sentCount).toBe(1);
    });

    it("should reject send without message", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          action: "send",
          title: "Hello",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("message");
    });

    it("should reject send without title", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          action: "send",
          message: "Hello",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("title");
    });

    it("should return 404 if user has no devices", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "unknown-user",
          action: "send",
          title: "Hello",
          message: "World",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("No device tokens");
    });
  });

  describe("Invalid Action", () => {
    it("should reject invalid action", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          action: "invalid",
          deviceToken: "token-123",
          platform: "android",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("Invalid action");
    });
  });
});
