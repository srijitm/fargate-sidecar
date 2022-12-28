#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { CdkStack } from '../lib/sidecar-sample-stack';

const app = new cdk.App();
new CdkStack(app, 'Sidecar-Sample-Stack', {
    // env: { account: '123456789012', region: 'us-east-1' },
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});
