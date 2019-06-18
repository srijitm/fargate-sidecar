# Fargate Sidecar

Fargate Sidecar is a sample project to demonstrate how CDK and Fargate can be leveraged to accelerate and simplify the development of a sidecar container.

## Overview

The Fargate Sidecar project is derived from a real life request from a large enterprise customer. The customer's development team was in the midst of developing Java microservices using Spring Boot, hosted on Apache Tomcat. The CloudOps team was tasked to deploy and support this application. They quickly realized the need for a container orchestration engine. The solution had to reduce the operational overhead of provisioning, configuring and scaling virtual machines. AWS Fargate was the natural choice. AWS Fargate, however, expects the applications to follow containerization best practices such as the [12factor methodlogy](https://12factor.net).

Out of the box, Tomcat produces multiple log files (access.log, catalina.out etc.). Without any application (code/config) changes the customer wanted all these log streams pushed to different AWS CloudWatch log groups. The customer was aware of the benefits of streaming logs to an aggregation service but time and resouce constraints meant that the operations team could not be retrained to use something like Splunk or ElasticSearch.

The proposal was to implement a FluentD sidecar container. This would enable the CloudOps team to configure how the application logs would get streamed. The long term vision was to setup a FluentD aggregator to collect logs from all the applications and then stream them to AWS Kinesis [as shown in this blog post](https://aws.amazon.com/blogs/compute/building-a-scalable-log-solution-aggregator-with-aws-fargate-fluentd-and-amazon-kinesis-data-firehose/).

## Design

A shared volume is mounted on both containers (application and fluentd). The Tomcat logs are written to this shared volume. FluentD is configured to read the log files, create a AWS CloudWatch log group if missing and stream the logs to it. CDK was used to rapidly provision the infrastructure in order to quickly demo a Spring Boot REST API running on tomcat streaming individual log files to different CloudWatch log groups.

## Deployment Instructions

**Note**: Pre-Requisites

* [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)
* [TypeScript](https://www.npmjs.com/package/typescript)

### Steps

```sh
$ cd rest-helloworld
$ mvn clean install
$ cd ../cdk
$ npm run build
$ cdk bootstrap # Only required the first time
$ cdk synth
$ cdk deploy
```

This deployment will create the following resources in your AWS account:

* A VPC
* A ECS cluster
* A CloudWatch Log Group called /ecs/sidecar-sample
* Two ECR repositories (Application and SideCar)
* A ECS Task Definition
* A ECS Service
* An Application Load Balancer with a HTTP listener on port 80
* Security Groups to limit access between load balancer and ECS Service to port 8080
* IAM Roles and Policies
