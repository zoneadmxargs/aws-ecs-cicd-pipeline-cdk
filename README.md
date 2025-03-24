# AWS CDK for Setting Up a CI/CD Pipeline

## 1. Deploy

```
$ cd EcsCdk
$ npm install
$ npx cdk list
```

```
$ npx cdk deploy EcsInfraStack
```

```
$ npx cdk deploy EcsPipelineStack
```

## 2. Clean up

```
$ cd EcsCdk
$ npx cdk destroy EcsPipelineStack
$ npx cdk destroy EcsInfraStack
```

### References

https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/set-up-a-ci-cd-pipeline-for-hybrid-workloads-on-amazon-ecs-anywhere-by-using-aws-cdk-and-gitlab.html?did=pg_card&trk=pg_card