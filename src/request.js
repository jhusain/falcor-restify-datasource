'use strict';

var getCORSRequest = require('./getCORSRequest');
var hasOwnProp = Object.prototype.hasOwnProperty;
var restify = require('restify');

var noop = function() {};

function Observable() {}

Observable.create = function(subscribe) {
  var o = new Observable();

  o.subscribe = function(onNext, onError, onCompleted) {

    var observer;
    var disposable;

    if (typeof onNext === 'function') {
        observer = {
            onNext: onNext,
            onError: (onError || noop),
            onCompleted: (onCompleted || noop)
        };
    } else {
        observer = onNext;
    }

    disposable = subscribe(observer);

    if (typeof disposable === 'function') {
      return {
        dispose: disposable
      };
    } else {
      return disposable;
    }
  };

  return o;
};

function request(method, options, context) {
  return Observable.create(function requestObserver(observer) {

    var config = {
      method: method || 'GET',
      headers: {}
    };

    var isDone,
      prop,
      client;

    for (prop in options) {
      if (hasOwnProp.call(options, prop)) {
        config[prop] = options[prop];
      }
    }

    client = restify.createJSONClient(config);
  
    // allow the user to mutate the config open
    if (context.onBeforeRequest != null) {
      context.onBeforeRequest(config);
    }

    client[config.method]({ version: '*' }, function(error, req, res, obj) {
      if (!isDone) {
        if (error) {
          observer.onError(error);
        }
        else {
          observer.onNext(obj);
          observer.onCompleted();
        }
      }
    });

    return function dispose() {
        isDone = true;
    };//Dispose
  });
}

module.exports = request;
