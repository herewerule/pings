/**
 * Pings Infrastructure Unit Tests (Vitest)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";

// Mock AWS SDK for Lambda functions
vi.mock("aws-sdk", () => ({
  DynamoDB: {
    DocumentClient: vi.fn().mockImplementation(() => ({
      put: vi.fn().mockReturnValue({
        promise: vi.fn().mockResolvedValue({}),
      })),
    })),
  },
}));

describe("Pings Infrastructure", () => {
  describe("CDK Stack Creation", () => {
    it("should create a valid CDK stack", () => {
      const app = new cdk.App({
        context: { prod: false },
      });

      // Import and instantiate the stack
      const { PingsBackendStack } = require("./pings-backend-stack");
      const stack = new PingsBackendStack(app, "TestStack");

      // Assert the stack has resources
      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    it("should create DynamoDB tables", () => {
      const app = new cdk.App({
        context: { prod: false },
      });

      const { PingsBackendStack } = require("./pings-backend-stack");
      const stack = new PingsBackendStack(app, "TestStack");
      const template = Template.fromStack(stack);

      // Check for DynamoDB tables
      template.hasResourceProperties("AWS::DynamoDB::Table", {
        TableName: "PingsCheckins",
      });

      template.hasResourceProperties("AWS::DynamoDB::Table", {
        TableName: "PingsMedications",
      });

      template.hasResourceProperties("AWS::DynamoDB::Table", {
        TableName: "PingsPhotos",
      });

      template.hasResourceProperties("AWS::DynamoDB::Table", {
        TableName: "PingsFamily",
      });

      template.hasResourceProperties("AWS::DynamoDB::Table", {
        TableName: "PingsUsers",
      });

      template.hasResourceProperties("AWS::DynamoDB::Table", {
        TableName: "PingsDeviceTokens",
      });
    });

    it("should create S3 bucket for photos", () => {
      const app = new cdk.App({
        context: { prod: false },
      });

      const { PingsBackendStack } = require("./pings-backend-stack");
      const stack = new PingsBackendStack(app, "TestStack");
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::S3::Bucket", {
        BucketName: expect.stringContaining("pings-photos"),
      });
    });

    it("should create SNS topic", () => {
      const app = new cdk.App({
        context: { prod: false },
      });

      const { PingsBackendStack } = require("./pings-backend-stack");
      const stack = new PingsBackendStack(app, "TestStack");
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::SNS::Topic", {
        TopicName: "PingsFamilyNotifications",
      });
    });

    it("should create Cognito User Pool", () => {
      const app = new cdk.App({
        context: { prod: false },
      });

      const { PingsBackendStack } = require("./pings-backend-stack");
      const stack = new PingsBackendStack(app, "TestStack");
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::Cognito::UserPool", {
        UserPoolName: "PingsUserPool",
        SelfSignUpEnabled: true,
      });
    });

    it("should create Lambda functions", () => {
      const app = new cdk.App({
        context: { prod: false },
      });

      const { PingsBackendStack } = require("./pings-backend-stack");
      const stack = new PingsBackendStack(app, "TestStack");
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::Lambda::Function", {
        Runtime: "nodejs20.x",
        Timeout: 30,
        MemorySize: 256,
      });
    });

    it("should create API Gateway", () => {
      const app = new cdk.App({
        context: { prod: false },
      });

      const { PingsBackendStack } = require("./pings-backend-stack");
      const stack = new PingsBackendStack(app, "TestStack");
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ApiGateway::RestApi", {
        Name: "Pings API",
      });
    });

    it("should create API endpoints", () => {
      const app = new cdk.App({
        context: { prod: false },
      });

      const { PingsBackendStack } = require("./pings-backend-stack");
      const stack = new PingsBackendStack(app, "TestStack");
      const template = Template.fromStack(stack);

      // Check that methods are attached to resources
      template.hasResourceProperties("AWS::ApiGateway::Method", {
        HttpMethod: "POST",
        ResourceId: {
          Ref: expect.any(String),
        },
      });
    });
  });
});
