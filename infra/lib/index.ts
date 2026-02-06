/**
 * Pings Backend Infrastructure Entry Point
 */

import * as cdk from "aws-cdk-lib";
import { PingsBackendStack } from "./pings-backend-stack";

const app = new cdk.App();

new PingsBackendStack(app, "PingsBackendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  context: {
    prod: process.env.NODE_ENV === "production",
  },
});

app.synth();
