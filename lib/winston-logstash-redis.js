var util = require('util');
var winston = require('winston');
var redis = require('redis');
var common = require('winston/lib/winston/common');
var _ = require('lodash');

var LogstashRedis = exports.LogstashRedis = function (options) {
  winston.Transport.call(this, options);

  var self = this;

  options = options || {};
  options.host = options.host || 'localhost';
  options.port = options.port || 6379;

  this.name = 'logstashRedis';
  this.level = options.level || 'info';
  this.redis = redis.createClient(options.port, options.host);
  this.version = options.version || 'v1';
  this.defaultMeta = options.defaultMeta;

  this.timestamp = options.timestamp || true;

  if (options.auth) {
    this.redis.auth(options.auth);
  }

  this.redis.on('error', function (err) {
    self.emit('error', err);
  });

};

util.inherits(LogstashRedis, winston.Transport);

LogstashRedis.prototype.log = function (level, msg, meta, callback) {
  var self = this;
  if (this.defaultMeta) {
    _.merge(meta, this.defaultMeta);
  }
  var output = common.log({
    level: level,
    message: msg,
    meta: meta,
    timestamp: this.timestamp,
    json: true,
    logstash: this.version
  });

  this.redis.rpush('logstash', output, function (err) {
    if (err) {
      if (callback) {
        callback(err, false);
      }
      return self.emit('error', err);
    }
    self.emit('logged');
    if (callback) {
      callback(null, true);
    }
  });
};
winston.transports.LogstashRedis = LogstashRedis;
