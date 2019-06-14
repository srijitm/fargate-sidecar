import cdk = require('@aws-cdk/cdk');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import ecr = require('@aws-cdk/aws-ecr');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import logs = require('@aws-cdk/aws-logs');
import { PolicyStatement } from '@aws-cdk/aws-iam';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creating a VPC
    const vpc = new ec2.Vpc(this, 'vpc', {
      cidr: '10.2.0.0/16',
      maxAZs: 2     
    })

    // Creating an ECS cluster
    const cluster = new ecs.Cluster(this, 'cluster', {
      vpc: vpc
    })

    // Creating a CloudWatch log group
    const cloudwatchLogGroup = new logs.LogGroup(this, "log-group", {
      logGroupName: '/ecs/sidecar-sample',
      retentionDays: 1
    })

    // Importing existing ECR repositories
    // const sidecarRepo = ecr.Repository.fromRepositoryName(this, "sidecarRepo", 'fluentd-sidecar')
    // const appRepo = ecr.Repository.fromRepositoryName(this, "appRepo", 'rest-helloworld')

    // Creating a Task Definition with a shared volume
    const taskDef = new ecs.FargateTaskDefinition(this, 'taskdef', {
      cpu: '1024',
      memoryMiB: '4096',
      volumes: [{name: 'sidecar_shared'}]
    })

    // Updating the Task IAM Role to allow fluentd to create log groups and push events to CloudWatch logs
    taskDef.addToTaskRolePolicy(new PolicyStatement()
      .addAllResources()
      .addActions('logs:DescribeLogGroups', 'logs:DescribeLogStreams', 
        'logs:PutLogEvents', 'logs:CreateLogGroup', 'logs:CreateLogStream'));

    // Creating the application container
    const appContainer = taskDef.addContainer("appContainer", {
      // image: ecs.ContainerImage.fromEcrRepository(appRepo),
      image: ecs.ContainerImage.fromAsset(this, "rest-helloworld", {
        directory: '../rest-helloworld'
      }),
      healthCheck: {
        retries: 3,
        command: [ "CMD-SHELL", "ps -ef | grep tomcat"],
        timeout: 5,
        intervalSeconds: 30
      },
      logging: new ecs.AwsLogDriver(this, "appLogging", { 
        logGroup: cloudwatchLogGroup,
        streamPrefix: 'app-logs'
      }),
      essential: true
    })

    // Specifying the application's port mappings
    appContainer.addPortMappings({
      hostPort: 8080,
      containerPort: 8080
    })

    // Mounting the shared volume on to the application container
    appContainer.addMountPoints({
      containerPath: "/usr/local/tomcat/logs",
      readOnly: false,
      sourceVolume: "sidecar_shared"
    })

    // Creating the sidecar container
    const sidecarContainer = taskDef.addContainer("sidecarContainer", {
      // image: ecs.ContainerImage.fromEcrRepository(sidecarRepo),
      image: ecs.ContainerImage.fromAsset(this, "sidecarImage", {
        directory: '../fluentd-sidecar'
      }),
      healthCheck: {
        retries: 3,
        command: [ "CMD-SHELL", "ps -ef | grep fluent"],
        timeout: 5,
        intervalSeconds: 30
      },
      logging: new ecs.AwsLogDriver(this, "sidecarLogging", { 
        logGroup: cloudwatchLogGroup,
        streamPrefix: 'sidecar-logs'
      })
    })

    // Specifying the sidecar port mappings
    sidecarContainer.addPortMappings({
      hostPort: 8888,
      containerPort: 8888
    })

    // Mounting the shared volume on to the sidecar container
    sidecarContainer.addMountPoints({
      containerPath: "/mnt/sidecar_shared/logs",
      readOnly: false,
      sourceVolume: "sidecar_shared"
    })

    // Creating the Fargate service
    const service = new ecs.FargateService(this, "service", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,
    });

    // Creating an internet facing ALB
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, "alb", {
      vpc,
      internetFacing: true
    });

    // Allowing incoming connections 
    loadBalancer.connections.allowFromAnyIPv4(new ec2.TcpPort(80), "Allow inbound HTTP");

    // Creating a listener and listen to incoming requests
    const listener = loadBalancer.addListener("listener", {
        port: 80,
        protocol: elbv2.ApplicationProtocol.Http
    });

    // Creating a target group that points to the application container (port 8080)
    listener.addTargets("targets", {
        port: 8080,
        protocol: elbv2.ApplicationProtocol.Http,
        targets: [service]
    });
  }
}
