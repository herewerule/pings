/**
 * Checkin Lambda Unit Tests (Vitest)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock AWS SDK
vi.mock("aws-sdk", () => ({
  DynamoDB: {
    DocumentClient: vi.fn().mockImplementation(() => ({
      put: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      })),
    }),
  },
  SNS: vi.fn().mockImplementation(() => ({
    publish: vi.fn().mockReturnValue({
      promise: vi.fn().mockResolvedValue({}),
    }),
  })),
}));

import { APIGatewayProxyHandler } from "aws-lambda";
import { handler } from "./index";

describe("Checkin Lambda", () => {
  let mockEvent: APIGatewayProxyEvent;
  let consoleSpy: any;

  beforeEach(() => {
    mockEvent = {
      body: JSON.stringify({
        userId: "dad-001",
        type: "checkin",
        value: "Feeling good today!",
        emoji: "😊",
      }),
    } as APIGatewayProxyEvent;

    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Checkins", () => {
    it("should create a checkin successfully", async () => {
      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(201);
      expect(response.headers?.["Content-Type"]).toBe("application/json");

      const body = JSON.parse(response.body);
      expect(body.userId).toBe("dad-001");
      expect(body.type).toBe("checkin");
      expect(body.value).toBe("Feeling good today!");
      expect(body.emoji).toBe("😊");
      expect(body.id).toMatch(/^dad-001-\d+$/);
      expect(body.timestamp).toBeDefined();
    });

    it("should create a mood checkin", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        type: "mood",
        value: "Happy",
        emoji: "😄",
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response.body);

      expect(body.type).toBe("mood");
      expect(body.value).toBe("Happy");
    });

    it("should create a status checkin", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        type: "status",
        value: "Took my meds",
        emoji: "💊",
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response.body);

      expect(body.type).toBe("status");
      expect(body.value).toBe("Took my meds");
    });
  });

  describe("Validation", () => {
    it("should reject missing userId", async () => {
      mockEvent.body = JSON.stringify({
        type: "checkin",
        value: "Hello",
      });

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("userId");
    });

    it("should reject missing type", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        value: "Hello",
      });

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("type");
    });

    it("should reject missing value", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        type: "checkin",
      });

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("value");
    });

    it("should handle empty body", async () => {
      mockEvent.body = null;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
    });
  });

  describe("Error Handling", () => {
    it("should handle DynamoDB errors gracefully", async () => {
      // Mock DynamoDB error
      vi.doMock("aws-sdk", () => ({
        DynamoDB: {
          DocumentClient: vi.fn().mockImplementation(() => ({
            put: vi.fn().mockReturnValue({
              promise: vi.fn().mockRejectedValue(new Error("DynamoDB Error")),
            }),
          })),
        },
        SNS: vi.fn().mockImplementation(() => ({
          publish: vi.fn().mockReturnValue({
            promise: vi.fn().mockResolvedValue({}),
          }),
        })),
      }));

      // Re-import handler with mocked dependencies
      const { handler: errorHandler } = await import("./index");
      const response = await errorHandler(mockEvent);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Failed to process checkin");
    });
  });
});

// Type helper for event
interface APIGatewayProxyEvent {
  body: string | null;
  headers?: Record<string, string>;
  httpMethod?: string;
  path?: string;
  queryStringParameters?: Record<string, string>;
}
