#!/usr/bin/env node

var amqp = require('amqplib');

amqp.connect('amqp://localhost').then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  return conn.createChannel().then(function(ch) {
      var ok = ch.assertExchange("beehive.issueComments", "topic", { durable: true, autoDelete: false, noAck: true });
      ok = ok.then(function () {
          return ch.assertQueue("IssuesCreatedCommandsQueue", { durable: true, autoDelete: true, exclusive: false });
      });
      ok = ok.then(function (qok) {
          var queueName = qok.queue;
          return ch.bindQueue(queueName, "beehive.issueTimeline", "IssuesCreatedCommandsRoutingKey").then(function () {
              return qok.queue;
          });
      });
      ok = ok.then(function (okqueue) {
      ch.prefetch(1);
      return ch.consume(okqueue, reply);
    });
    return ok.then(function() {
      console.log(' [x] Awaiting RPC requests');
    });

    function reply(msg) {
        const response = {
            entityType: 'IssueTimeline',
            entityId: '580672997925a799e8ac072e',
            //eventName: msg.customProperties.eventName,
            //socketId: msg.customProperties.socketId
        };
        ch.sendToQueue(msg.properties.replyTo,
                     new Buffer(response.toString()),
                     { correlationId: msg.properties.correlationId });
      console.log(msg.properties.correlationId);
      console.log(response.toString());
      ch.ack(msg);
    }
  });
}).then(null, console.warn);
