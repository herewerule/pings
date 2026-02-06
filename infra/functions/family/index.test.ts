/**
 * Family Lambda Unit Tests (Vitest)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock AWS SDK
vi.mock("aws-sdk", () => ({
  DynamoDB: {
    DocumentClient: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Item: {
            userId: "dad-001",
            name: "Dad",
            role: "senior",
          },
        }),
      }),
      query: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Items: [
            { userId: "dad-001", type: "checkin", value: "Good" },
            { userId: "dad-001", type: "mood", value: "Happy" },
          ],
        }),
      }),
      put: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      }),
      delete: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      }),
    })),
  },
}));

import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "./index";

describe("Family Lambda", () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET - User Status", () => {
    it("should return user status with recent check-ins", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "GET",
        queryStringParameters: { userId: "dad-001" },
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.userId).toBe("dad-001");
      expect(body.user.name).toBe("Dad");
      expect(body.recentCheckins).toHaveLength(2);
    });

    it("should return 404 for non-existent user", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "GET",
        queryStringParameters: { userId: "non-existent" },
      } as APIGatewayProxyEvent;

      // Mock non-existent user
      vi.doMock("aws-sdk", () => ({
        DynamoDB: {
          DocumentClient: vi.fn().mockImplementation(() => ({
            get: vi.fn().mockReturnValue({
              promise: vi.fn().mockResolvedValue({ Item: undefined }),
            }),
            query: vi.fn().mockReturnValue({
              promise: vi.fn().mockResolvedValue({ Items: [] }),
            }),
          })),
        },
      }));

      const { handler: errorHandler } = await import("./index");
      const response = await errorHandler(mockEvent);

      expect(response.statusCode).toBe(404);
    });

    it("should reject missing userId", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "GET",
        queryStringParameters: {},
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("userId");
    });
  });

  describe("POST - Join Family Circle", () => {
    it("should join family circle successfully", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          familyId: "family-123",
          action: "join",
          member: {
            name: "Dad",
            role: "senior",
          },
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.member.userId).toBe("dad-001");
      expect(body.member.name).toBe("Dad");
      expect(body.member.role).toBe("senior");
    });

    it("should reject join without member info", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          familyId: "family-123",
          action: "join",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("member info");
    });

    it("should leave family circle", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          userId: "dad-001",
          familyId: "family-123",
          action: "leave",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should reject missing userId in POST", async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: "POST",
        body: JSON.stringify({
          familyId: "family-123",
          action: "join",
        }),
      } as APIGatewayProxyEvent;

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
    });
  });

  describe("Method Not Allowed", () => {
    it("should return 405 for PUT", async () => {
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
