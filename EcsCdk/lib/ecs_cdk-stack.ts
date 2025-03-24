import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnOutput } from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { NagSuppressions } from 'cdk-nag';

export class EcsCdkStack extends Stack {
  public readonly service: ecs.FargateService;
  public readonly repo: codecommit.Repository;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create coderepo
    this.repo = new codecommit.Repository(this, 'EcsFargatePipeline', {
      repositoryName: "EcsFargateRepo",
      description: "CDK and Application Code repo",
    });

    // Create VPC
    const vpc = new ec2.Vpc(this, 'EcsFargateVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.10.0.0/16'),
      vpcName: 'EcsFargateVpc',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'PublicSubnet',
          cidrMask: 24,
        },
      ]
    });
    NagSuppressions.addResourceSuppressions(vpc, [{ id: 'AwsSolutions-VPC7', reason: 'lorem ipsum' }]);

    // Create ECS cluster
    const ecsFargateCluster = new ecs.Cluster(this, 'EcsFargateCluster', {
      vpc,
      clusterName: "EcsFargateCluster",
    });
    NagSuppressions.addResourceSuppressions(ecsFargateCluster, [{ id: 'AwsSolutions-ECS4', reason: 'at least 10 characters' }]);

    // Create task role
    const ecsTaskRole = new iam.Role(this, `ecs-taskRole-${this.stackName}`, {
      roleName: `ecs-taskRole-${this.stackName}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });
    ecsTaskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy"));
    ecsTaskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess"));
    NagSuppressions.addResourceSuppressions(ecsTaskRole, [{ id: 'AwsSolutions-IAM4', reason: 'at least 10 characters' }]);

    // Grant access to Create Log group and Log Stream
    ecsTaskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
        resources: [
          "arn:aws:logs:*:*:*"
        ]
      })
    );
    NagSuppressions.addResourceSuppressions(ecsTaskRole, [{ id: 'AwsSolutions-IAM5', reason: 'Suppress all AwsSolutions-IAM5 findings' }], true);

    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
    });

    // Create FargateTaskDefinition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'FargateTaskDefinition', {
      taskRole: ecsTaskRole,
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    taskDefinition.addToExecutionRolePolicy(executionRolePolicy);
    NagSuppressions.addResourceSuppressions(taskDefinition, [{ id: 'AwsSolutions-IAM5', reason: 'Suppress all AwsSolutions-IAM5 findings' }], true);

    const container = taskDefinition.addContainer('EcsFargateContainer', {
      image: ecs.ContainerImage.fromRegistry('nginxdemos/hello'),
      memoryLimitMiB: 1024,
      containerName: "EcsFargateContainer",
      logging: ecs.LogDriver.awsLogs({ streamPrefix: "ecs-fargate-logs" }),
    });

    container.addPortMappings({
      containerPort: 80,
    });

    // Create FargateService
    this.service = new ecs.FargateService(this, 'FargateService', {
      serviceName: "EcsFargateService",
      cluster: ecsFargateCluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true, // Ensure public IP is assigned if needed
    });

    // TODO: Add Security Group for External Access

    // Output
    new CfnOutput(this, "EcsFargateCodeCommitRepo", {
      description: "CodeCommit Repo Name",
      value: this.repo.repositoryName,
      exportName: "CodeRepoName"
    });
  }
}
