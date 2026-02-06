/**
 * Medications Lambda Unit Tests (Vitest)
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
}));

import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "./index";

describe("Medications Lambda", () => {
  let mockEvent: APIGatewayProxyEvent;
  let consoleSpy: any;

  beforeEach(() => {
    mockEvent = {
      body: JSON.stringify({
        userId: "dad-001",
        medicationId: "med-001",
        action: "taken",
      }),
    } as APIGatewayProxyEvent;

    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Medication Logging", () => {
    it("should log medication as taken", async () => {
      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(201);
      expect(response.headers?.["Content-Type"]).toBe("application/json");

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.log.userId).toBe("dad-001");
      expect(body.log.medicationId).toBe("med-001");
      expect(body.log.action).toBe("taken");
      expect(body.message).toBe("Great job! Medication logged.");
    });

    it("should log skipped medication", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        medicationId: "med-001",
        action: "skipped",
        notes: "Forgot to pick up from pharmacy",
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response.body);

      expect(body.log.action).toBe("skipped");
      expect(body.log.notes).toBe("Forgot to pick up from pharmacy");
      expect(body.message).toBe("Noted. Skipped medication logged.");
    });

    it("should log medication refill", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        medicationId: "med-001",
        action: "refill",
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response.body);

      expect(body.log.action).toBe("refill");
      expect(body.message).toBe("Refill logged. Don't forget to reorder!");
    });

    it("should log generic medication entry", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        medicationId: "med-002",
        action: "log",
        notes: "Took with food",
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response.body);

      expect(body.log.action).toBe("log");
      expect(body.message).toBe("Medication log entry saved.");
    });

    it("should include timestamp if provided", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        medicationId: "med-001",
        action: "taken",
        timestamp: "2026-02-06T08:00:00Z",
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response.body);

      expect(body.log.timestamp).toBe("2026-02-06T08:00:00Z");
    });
  });

  describe("Validation", () => {
    it("should reject missing userId", async () => {
      mockEvent.body = JSON.stringify({
        medicationId: "med-001",
        action: "taken",
      });

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("userId");
    });

    it("should reject missing medicationId", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        action: "taken",
      });

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("medicationId");
    });

    it("should reject missing action", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        medicationId: "med-001",
      });

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("action");
    });

    it("should reject invalid action", async () => {
      mockEvent.body = JSON.stringify({
        userId: "dad-001",
        medicationId: "med-001",
        action: "invalid",
      });

      const response = await handler(mockEvent);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain("Invalid action");
    });
  });
});
