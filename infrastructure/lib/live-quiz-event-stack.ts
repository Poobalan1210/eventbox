import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class LiveQuizEventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Tables
    // ========================================

    // Events Table
    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: 'LiveQuizEvents',
      partitionKey: {
        name: 'eventId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for querying events by organizerId
    eventsTable.addGlobalSecondaryIndex({
      indexName: 'organizerId-index',
      partitionKey: {
        name: 'organizerId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for querying events by organizerId and status
    eventsTable.addGlobalSecondaryIndex({
      indexName: 'organizerId-status-index',
      partitionKey: {
        name: 'organizerId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Questions Table
    const questionsTable = new dynamodb.Table(this, 'QuestionsTable', {
      tableName: 'LiveQuizQuestions',
      partitionKey: {
        name: 'eventId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'questionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for ordered retrieval of questions
    questionsTable.addGlobalSecondaryIndex({
      indexName: 'eventId-order-index',
      partitionKey: {
        name: 'eventId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'order',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Participants Table
    const participantsTable = new dynamodb.Table(this, 'ParticipantsTable', {
      tableName: 'LiveQuizParticipants',
      partitionKey: {
        name: 'eventId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'participantId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Answers Table
    const answersTable = new dynamodb.Table(this, 'AnswersTable', {
      tableName: 'LiveQuizAnswers',
      partitionKey: {
        name: 'participantId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'questionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for querying answers by event and question
    answersTable.addGlobalSecondaryIndex({
      indexName: 'eventId-questionId-index',
      partitionKey: {
        name: 'eventId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'questionId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GamePins Table
    const gamePinsTable = new dynamodb.Table(this, 'GamePinsTable', {
      tableName: 'LiveQuizGamePins',
      partitionKey: {
        name: 'gamePin',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'expiresAt', // TTL for automatic cleanup after 24 hours
    });

    // ========================================
    // Activity System Tables (Import Existing)
    // ========================================
    // Note: These tables were created manually and are imported here
    // to allow CDK to manage permissions without recreating them.
    // For fresh deployments, uncomment the table creation code below.

    // Import existing Activities Table
    const activitiesTable = dynamodb.Table.fromTableName(
      this,
      'ActivitiesTable',
      'Activities'
    );

    // Import existing Poll Votes Table
    const pollVotesTable = dynamodb.Table.fromTableName(
      this,
      'PollVotesTable',
      'PollVotes'
    );

    // Import existing Raffle Entries Table
    const raffleEntriesTable = dynamodb.Table.fromTableName(
      this,
      'RaffleEntriesTable',
      'RaffleEntries'
    );

    /* 
    // ========================================
    // For Fresh Deployments - Uncomment Below
    // ========================================
    // If deploying to a new environment, comment out the imports above
    // and uncomment the table creation code below:

    // Activities Table - Stores quiz, poll, and raffle activities
    const activitiesTable = new dynamodb.Table(this, 'ActivitiesTable', {
      tableName: 'Activities',
      partitionKey: {
        name: 'eventId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'activityId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for querying activities by event
    activitiesTable.addGlobalSecondaryIndex({
      indexName: 'EventActivities',
      partitionKey: {
        name: 'eventId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Poll Votes Table - Stores votes for poll activities
    const pollVotesTable = new dynamodb.Table(this, 'PollVotesTable', {
      tableName: 'PollVotes',
      partitionKey: {
        name: 'pollId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'participantId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for querying all votes for a poll
    pollVotesTable.addGlobalSecondaryIndex({
      indexName: 'PollVotes',
      partitionKey: {
        name: 'pollId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Raffle Entries Table - Stores entries for raffle activities
    const raffleEntriesTable = new dynamodb.Table(this, 'RaffleEntriesTable', {
      tableName: 'RaffleEntries',
      partitionKey: {
        name: 'raffleId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'participantId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for querying all entries for a raffle
    raffleEntriesTable.addGlobalSecondaryIndex({
      indexName: 'RaffleEntries',
      partitionKey: {
        name: 'raffleId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    */

    // ========================================
    // S3 Bucket for Frontend
    // ========================================

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `live-quiz-frontend-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // For SPA routing
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Change for production
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    // ========================================
    // S3 Bucket for Question Images
    // ========================================

    const questionImagesBucket = new s3.Bucket(this, 'QuestionImagesBucket', {
      bucketName: `live-quiz-question-images-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Change for production
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // Restrict to your domain in production
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteOldImages',
          enabled: true,
          expiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // ========================================
    // CloudFront Distribution
    // ========================================

    // Origin Access Identity for S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'FrontendOAI',
      {
        comment: 'OAI for Live Quiz Frontend',
      }
    );

    // Grant CloudFront access to S3 bucket
    frontendBucket.grantRead(originAccessIdentity);

    // CloudFront distribution for frontend
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
    });

    // Origin Access Identity for Question Images S3
    const imagesOAI = new cloudfront.OriginAccessIdentity(
      this,
      'QuestionImagesOAI',
      {
        comment: 'OAI for Live Quiz Question Images',
      }
    );

    // Grant CloudFront access to question images bucket
    questionImagesBucket.grantRead(imagesOAI);

    // CloudFront distribution for question images
    const imagesDistribution = new cloudfront.Distribution(
      this,
      'QuestionImagesDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(questionImagesBucket, {
            originAccessIdentity: imagesOAI,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enableIpv6: true,
      }
    );

    // ========================================
    // VPC for ECS
    // ========================================

    const vpc = new ec2.Vpc(this, 'LiveQuizVPC', {
      maxAzs: 2,
      natGateways: 1, // Use 2 for production high availability
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ========================================
    // Security Groups
    // ========================================

    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP and HTTPS traffic to ALB
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // ECS Task Security Group
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    // Allow traffic from ALB to ECS tasks
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB'
    );

    // ========================================
    // ECS Cluster
    // ========================================

    const cluster = new ecs.Cluster(this, 'LiveQuizCluster', {
      vpc,
      clusterName: 'live-quiz-cluster',
      containerInsights: true,
    });

    // ========================================
    // IAM Roles
    // ========================================

    // Task Execution Role (for ECS to pull images and write logs)
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Task Role (for application to access AWS services)
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant DynamoDB permissions to task role
    eventsTable.grantReadWriteData(taskRole);
    questionsTable.grantReadWriteData(taskRole);
    participantsTable.grantReadWriteData(taskRole);
    answersTable.grantReadWriteData(taskRole);
    gamePinsTable.grantReadWriteData(taskRole);
    activitiesTable.grantReadWriteData(taskRole);
    pollVotesTable.grantReadWriteData(taskRole);
    raffleEntriesTable.grantReadWriteData(taskRole);

    // Grant S3 permissions to task role for question images
    questionImagesBucket.grantReadWrite(taskRole);

    // ========================================
    // CloudWatch Log Group
    // ========================================

    const logGroup = new logs.LogGroup(this, 'WebSocketServerLogGroup', {
      logGroupName: '/ecs/live-quiz-websocket-server',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // ECS Task Definition
    // ========================================

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'WebSocketTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Container definition
    const container = taskDefinition.addContainer('WebSocketContainer', {
      // Note: Replace with your actual ECR image URI after building and pushing
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'websocket-server',
        logGroup: logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        AWS_REGION: this.region,
        EVENTS_TABLE_NAME: eventsTable.tableName,
        QUESTIONS_TABLE_NAME: questionsTable.tableName,
        PARTICIPANTS_TABLE_NAME: participantsTable.tableName,
        ANSWERS_TABLE_NAME: answersTable.tableName,
        GAME_PINS_TABLE_NAME: gamePinsTable.tableName,
        ACTIVITIES_TABLE: activitiesTable.tableName,
        POLL_VOTES_TABLE: pollVotesTable.tableName,
        RAFFLE_ENTRIES_TABLE: raffleEntriesTable.tableName,
        QUESTION_IMAGES_BUCKET: questionImagesBucket.bucketName,
        CLOUDFRONT_IMAGES_URL: `https://${imagesDistribution.distributionDomainName}`,
        PORT: '3000',
      },
      portMappings: [
        {
          containerPort: 3000,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // ========================================
    // Application Load Balancer
    // ========================================

    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebSocketALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName: 'live-quiz-alb',
    });

    // HTTP Listener (redirect to HTTPS in production)
    const httpListener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'Live Quiz WebSocket Server',
      }),
    });

    // ========================================
    // ECS Fargate Service
    // ========================================

    const service = new ecs.FargateService(this, 'WebSocketService', {
      cluster,
      taskDefinition,
      desiredCount: 1, // Increase for production
      assignPublicIp: false,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      serviceName: 'websocket-service',
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    // Target Group for WebSocket traffic
    const targetGroup = httpListener.addTargets('WebSocketTargets', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
      stickinessCookieDuration: cdk.Duration.hours(1),
      targetGroupName: 'websocket-tg',
    });

    // Note: Connection termination attribute is only supported for TCP/UDP target groups
    // For HTTP target groups, deregistration delay is sufficient for graceful shutdown

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 bucket name for frontend',
      exportName: 'LiveQuizFrontendBucket',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
      exportName: 'LiveQuizCloudFrontURL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: 'LiveQuizCloudFrontDistributionId',
    });

    new cdk.CfnOutput(this, 'WebSocketALBURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Application Load Balancer URL for WebSocket server',
      exportName: 'LiveQuizWebSocketURL',
    });

    new cdk.CfnOutput(this, 'EventsTableName', {
      value: eventsTable.tableName,
      description: 'DynamoDB Events table name',
      exportName: 'LiveQuizEventsTable',
    });

    new cdk.CfnOutput(this, 'QuestionsTableName', {
      value: questionsTable.tableName,
      description: 'DynamoDB Questions table name',
      exportName: 'LiveQuizQuestionsTable',
    });

    new cdk.CfnOutput(this, 'ParticipantsTableName', {
      value: participantsTable.tableName,
      description: 'DynamoDB Participants table name',
      exportName: 'LiveQuizParticipantsTable',
    });

    new cdk.CfnOutput(this, 'AnswersTableName', {
      value: answersTable.tableName,
      description: 'DynamoDB Answers table name',
      exportName: 'LiveQuizAnswersTable',
    });

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster name',
      exportName: 'LiveQuizECSCluster',
    });

    new cdk.CfnOutput(this, 'ECSServiceName', {
      value: service.serviceName,
      description: 'ECS Service name',
      exportName: 'LiveQuizECSService',
    });

    new cdk.CfnOutput(this, 'QuestionImagesBucketName', {
      value: questionImagesBucket.bucketName,
      description: 'S3 bucket name for question images',
      exportName: 'LiveQuizQuestionImagesBucket',
    });

    new cdk.CfnOutput(this, 'QuestionImagesCloudFrontURL', {
      value: `https://${imagesDistribution.distributionDomainName}`,
      description: 'CloudFront distribution URL for question images',
      exportName: 'LiveQuizQuestionImagesCloudFrontURL',
    });

    new cdk.CfnOutput(this, 'QuestionImagesDistributionId', {
      value: imagesDistribution.distributionId,
      description: 'CloudFront distribution ID for question images',
      exportName: 'LiveQuizQuestionImagesDistributionId',
    });

    new cdk.CfnOutput(this, 'GamePinsTableName', {
      value: gamePinsTable.tableName,
      description: 'DynamoDB GamePins table name',
      exportName: 'LiveQuizGamePinsTable',
    });

    new cdk.CfnOutput(this, 'ActivitiesTableName', {
      value: activitiesTable.tableName,
      description: 'DynamoDB Activities table name',
      exportName: 'LiveQuizActivitiesTable',
    });

    new cdk.CfnOutput(this, 'PollVotesTableName', {
      value: pollVotesTable.tableName,
      description: 'DynamoDB PollVotes table name',
      exportName: 'LiveQuizPollVotesTable',
    });

    new cdk.CfnOutput(this, 'RaffleEntriesTableName', {
      value: raffleEntriesTable.tableName,
      description: 'DynamoDB RaffleEntries table name',
      exportName: 'LiveQuizRaffleEntriesTable',
    });
  }
}
