/**
 * Pings CDK Infrastructure Stack
 * Creates all AWS resources for the Pings backend
 */

import {
  Stack,
  StackProps,
  aws_dynamodb as dynamodb,
  aws_s3 as s3,
  aws_lambda as lambda,
  aws_apigateway as apigateway,
  aws_sns as sns,
  aws_cognito as cognito,
  aws_iam as iam,
  aws_sns_subscriptions as sns_subscriptions,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class PingsBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const checkinsTable = new dynamodb.Table(this, "CheckinsTable", {
      tableName: "PingsCheckins",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "timestamp",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: this.node.tryGetContext("prod")
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const medicationsTable = new dynamodb.Table(this, "MedicationsTable", {
      tableName: "PingsMedications",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "timestamp",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: this.node.tryGetContext("prod")
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const photosTable = new dynamodb.Table(this, "PhotosTable", {
      tableName: "PingsPhotos",
      partitionKey: {
        name: "photoId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: this.node.tryGetContext("prod")
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const familyTable = new dynamodb.Table(this, "FamilyTable", {
      tableName: "PingsFamily",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: this.node.tryGetContext("prod")
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const usersTable = new dynamodb.Table(this, "UsersTable", {
      tableName: "PingsUsers",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: this.node.tryGetContext("prod")
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const tokensTable = new dynamodb.Table(this, "TokensTable", {
      tableName: "PingsDeviceTokens",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "deviceToken",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: this.node.tryGetContext("prod")
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for Photos
    const photosBucket = new s3.Bucket(this, "PhotosBucket", {
      bucketName: `pings-photos-${this.account}-${this.region}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ["*"],
          maxAge: 3600,
        },
      ],
      removalPolicy: this.node.tryGetContext("prod")
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topic for Family Notifications
    const familyNotificationsTopic = new sns.Topic(
      this,
      "FamilyNotificationsTopic",
      {
        topicName: "PingsFamilyNotifications",
        displayName: "Pings Family Notifications",
      }
    );

    // Cognito User Pool for Auth
    const userPool = new cognito.UserPool(this, "PingsUserPool", {
      userPoolName: "PingsUserPool",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
      },
    });

    // Lambda Functions
    const checkinFunction = this.createLambdaFunction(
      "CheckinFunction",
      "./functions/checkin",
      {
        CHECKINS_TABLE: checkinsTable.tableName,
        FAMILY_NOTIFICATIONS_TOPIC: familyNotificationsTopic.topicArn,
      }
    );

    const medicationsFunction = this.createLambdaFunction(
      "MedicationsFunction",
      "./functions/medications",
      {
        MEDICATIONS_TABLE: medicationsTable.tableName,
        USERS_TABLE: usersTable.tableName,
      }
    );

    const photosFunction = this.createLambdaFunction(
      "PhotosFunction",
      "./functions/photos",
      {
        PHOTOS_TABLE: photosTable.tableName,
        PHOTOS_BUCKET: photosBucket.bucketName,
      }
    );

    const familyFunction = this.createLambdaFunction(
      "FamilyFunction",
      "./functions/family",
      {
        USERS_TABLE: usersTable.tableName,
        FAMILY_TABLE: familyTable.tableName,
      }
    );

    const notificationsFunction = this.createLambdaFunction(
      "NotificationsFunction",
      "./functions/notifications",
      {
        TOKENS_TABLE: tokensTable.tableName,
      }
    );

    // Grant DynamoDB permissions
    checkinsTable.grantWriteData(checkinFunction);
    medicationsTable.grantWriteData(medicationsFunction);
    photosTable.grantReadWriteData(photosFunction);
    photosBucket.grantWrite(photosFunction);
    familyTable.grantReadWriteData(familyFunction);
    usersTable.grantReadData(familyFunction);
    tokensTable.grantReadWriteData(notificationsFunction);

    // Grant SNS permissions
    familyNotificationsTopic.grantPublish(checkinFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, "PingsApi", {
      restApiName: "Pings API",
      description: "API for Pings Senior Wellness Companion",
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    );

    // API Resources
    const checkins = api.root.addResource("checkin");
    checkins.addMethod("POST", new apigateway.LambdaIntegration(checkinFunction));

    const family = api.root.addResource("family");
    family.addMethod("GET", new apigateway.LambdaIntegration(familyFunction));
    family.addMethod("POST", new apigateway.LambdaIntegration(familyFunction));

    const medications = api.root.addResource("medications");
    medications.addMethod("POST", new apigateway.LambdaIntegration(medicationsFunction));

    const photos = api.root.addResource("photos");
    photos.addMethod("POST", new apigateway.LambdaIntegration(photosFunction));

    const photo = photos.addResource("{photoId}");
    photo.addMethod("GET", new apigateway.LambdaIntegration(photosFunction));
    photo.addMethod("DELETE", new apigateway.LambdaIntegration(photosFunction));

    const notifications = api.root.addResource("notifications");
    notifications.addMethod("POST", new apigateway.LambdaIntegration(notificationsFunction));

    // Outputs
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.url,
      exportName: "PingsApiEndpoint",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      exportName: "PingsUserPoolId",
    });

    new cdk.CfnOutput(this, "PhotosBucketName", {
      value: photosBucket.bucketName,
      exportName: "PingsPhotosBucket",
    });
  }

  private createLambdaFunction(
    id: string,
    entry: string,
    environment: Record<string, string>
  ): lambda.Function {
    return new lambda.Function(this, id, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      entry: entry,
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        ...environment,
      },
    });
  }
}

import * as cdk from "aws-cdk-lib";
