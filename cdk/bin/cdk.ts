#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { CdkStack } from '../lib/sidecar-sample-stack';

const app = new cdk.App();
new CdkStack(app, 'CdkStack');
