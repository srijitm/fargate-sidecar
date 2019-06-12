FROM tomcat:jre8-alpine
ENV CATALINA_HOME /usr/local/tomcat
ENV UMASK=0022

ADD target/rest-helloworld.war $CATALINA_HOME/webapps/
EXPOSE 8080
ENTRYPOINT ["catalina.sh", "run"]