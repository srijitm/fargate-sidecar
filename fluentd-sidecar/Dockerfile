FROM fluent/fluentd:v1.5-1

# Use root account to use apk
USER root

# below RUN includes plugin as examples elasticsearch is not required
# you may customize including plugins as you wish
RUN apk add --no-cache --update --virtual .build-deps \
        sudo build-base ruby-dev \
 && sudo gem install fluent-plugin-elasticsearch \
 && sudo gem install fluent-plugin-cloudwatch-logs \
 && sudo gem sources --clear-all \
 && apk del .build-deps \
 && rm -rf /tmp/* /var/tmp/* /usr/lib/ruby/gems/*/cache/*.gem

# creating td-agent directory
RUN mkdir -p /var/log/td-agent
RUN chown fluent:fluent /var/log/td-agent

COPY fluent.conf /fluentd/etc/
COPY entrypoint.sh /bin/

USER fluent