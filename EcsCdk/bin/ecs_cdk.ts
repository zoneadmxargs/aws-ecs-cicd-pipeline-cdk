#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcsCdkStack } from '../lib/ecs_cdk-stack';
import { EcsPipelineStack } from '../lib/ecs_pipeline-stack';
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from "aws-cdk-lib";

const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks());

const CdkInfraStack = new EcsCdkStack(app, 'EcsInfraStack', {
});

const CdkPipelineStack = new EcsPipelineStack(app, 'EcsPipelineStack', {
  service: CdkInfraStack.service,
  repo: CdkInfraStack.repo,
});
