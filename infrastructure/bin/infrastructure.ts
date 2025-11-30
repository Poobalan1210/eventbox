#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LiveQuizEventStack } from '../lib/live-quiz-event-stack';

const app = new cdk.App();

new LiveQuizEventStack(app, 'LiveQuizEventStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Live Quiz Event System Infrastructure',
});
