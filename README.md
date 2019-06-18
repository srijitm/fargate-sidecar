# Fargate Sidecar

Fargate Sidecar is a sample project to demonstrate how CDK and Fargate can be leveraged to accelerate and simplify the development of a sidecar container.

## Overview

The Fargate Sidecar project is derived from a real life request from a large enterprise customer. The customer's development team was in the midst of developing Java microservies using Spring Boot and hosted on Apache Tomcat. The CloudOps team was tasked to deploy and support this application. They quickly realized that they needed a container orchestration layer. The solution had to remove the operational overhead of provisioning, configuring and scaling virtual machines. AWS Fargate was the natural choice. AWS Fargate, however, expects the applications to follow containerization best practices. The resource constraints meant that the application could not be re-factored to follow the 12factor methodology.

### The Problem

Out of the box Tomcat Apache produces multiple log files (access.log, catalina.out etc.). Without any application (code/config) changes the customer wanted all these log streams pushed to different AWS CloudWatch log groups. This was important for their operations team because they wanted to be able to access the logs as if they were still files. The client was aware of the benefits of streaming logs to an aggregation service but time and resouce constraints meant that the operations team could not be retrained to use something like Splunk or ElasticSearch.

### Solution

The proposal was to implement a FluentD sidecar container. This would enable the CloudOps team to configure how the application logs would get streamed. The long term vision was to setup a FluentD aggregator to collect logs from all the applications and then stream them to AWS Kinesis [as shown in this blog post](https://aws.amazon.com/blogs/compute/building-a-scalable-log-solution-aggregator-with-aws-fargate-fluentd-and-amazon-kinesis-data-firehose/)

### Design

A shared volume is mounted on both containers (application and fluentd). The Tomcat logs are written to this shared volume. FluentD is configured to read the log files, create a AWS CloudWatch log group if missing and stream the logs to it.
