import cdk = require('@aws-cdk/cdk');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import ecr = require('@aws-cdk/aws-ecr');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import logs = require('@aws-cdk/aws-logs');

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, 'sidecar-sample-vpc', {
      cidr: '10.2.0.0/16',
      maxAZs: 2     
    })

    const cluster = new ecs.Cluster(this, 'sidecar-cluster', {
      vpc: vpc
    })

    let sharedVolume = {name: 'sidecar_shared'}

    const sidecarLogGroup = new logs.LogGroup(this, "sidecarLogGroup", {
      logGroupName: '/ecs/sidecar-sample',
      retentionDays: 1
    })

    const sidecarRepo = ecr.Repository.fromRepositoryName(this, "sidecarRepo", 'fluentd-sidecar')
    const appRepo = ecr.Repository.fromRepositoryName(this, "appRepo", 'rest-helloworld')

    const taskDef = new ecs.FargateTaskDefinition(this, 'sidecar-taskdef', {
      cpu: '1024',
      memoryMiB: '4096',
      volumes: [sharedVolume]
    })

    const appContainer = taskDef.addContainer("appContainer", {
      image: ecs.ContainerImage.fromEcrRepository(appRepo),
      healthCheck: {
        retries: 3,
        command: [ "CMD-SHELL", "ps -ef | grep tomcat"],
        timeout: 5,
        intervalSeconds: 30
      },
      logging: new ecs.AwsLogDriver(this, "appLogging", { 
        logGroup: sidecarLogGroup,
        streamPrefix: 'app'
      })
    })

    appContainer.addPortMappings({
      hostPort: 8080,
      containerPort: 8080
    })

    appContainer.addMountPoints({
      containerPath: "/usr/local/tomcat/logs",
      readOnly: false,
      sourceVolume: "sidecar_shared"
    })

    const sidecarContainer = taskDef.addContainer("fluentdSidecar", {
      image: ecs.ContainerImage.fromEcrRepository(sidecarRepo),
      healthCheck: {
        retries: 3,
        command: [ "CMD-SHELL", "ps -ef | grep fluent"],
        timeout: 5,
        intervalSeconds: 30
      },
      logging: new ecs.AwsLogDriver(this, "sidecarLogging", { 
        logGroup: sidecarLogGroup,
        streamPrefix: 'fluentdSidecar'
      })
    })

    sidecarContainer.addPortMappings({
      hostPort: 8888,
      containerPort: 8888
    })

    sidecarContainer.addMountPoints({
      containerPath: "/mnt/sidecar_shared/logs",
      readOnly: false,
      sourceVolume: "sidecar_shared"
    })

    const service = new ecs.FargateService(this, "sidecar-service", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,
    });

    // Create service with built-in load balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, "alb", {
      vpc,
      internetFacing: true
    });

    // Allow incoming connections
    loadBalancer.connections.allowFromAnyIPv4(new ec2.TcpPort(80), "Allow inbound HTTP");

    // Create a listener and listen to incoming requests
    const listener = loadBalancer.addListener("Listener", {
        port: 80,
        protocol: elbv2.ApplicationProtocol.Http
    });
    listener.addTargets("ServiceTarget", {
        port: 8080,
        protocol: elbv2.ApplicationProtocol.Http,
        targets: [service]
    });

  }
}
