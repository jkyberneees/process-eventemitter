/*
 Copyright (C) 2016 Rolando Santamaria Maso <kyberneees@gmail.com>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specifi8c language governing permissions and
 limitations under the License.
 */
/*jshint esversion: 6*/
"use strict";

const UUID = require('uuid');
const EventEmitter = require('eventemitter2').EventEmitter2;

class ProcessEventEmitter extends EventEmitter {
    constructor(config) {
        super({
            wildcard: true,
            newListener: true
        });

        var self = this;
        self.id = UUID.v4();
        this.promises = {};

        config = config || {};
        this.config = config;
    }

    getId() {
        return this.id;
    }

    callOneListener(event, data, raw, resolve, reject) {
        var self = this;
        var resolveproxy = (response) => {
            let obj = { data: response, ok: true };
            self.emit("response", event, obj, raw);

            resolve(obj.data);
        };
        var rejectproxy = (reason) => {
            let obj = { data: reason, ok: false };
            self.emit("response", event, obj, raw);

            reject(obj.data);
        };

        var listeners = this.listeners(event);
        if (listeners.length > 0) {
            setTimeout(() => {
                try {
                    let obj = { data: data };
                    self.emit("request", event, obj, raw);

                    listeners[0](obj.data, resolveproxy, rejectproxy, raw);
                } catch (error) {
                    rejectproxy(error.message);
                }
            }, 0);

            return true;
        }

        return false;
    }

    connect() {
        var self = this;
        return new Promise((resolve, reject) => {
            self.emit('connected', self.getId());
            resolve();
        });
    }

    disconnect() {
        var self = this;
        return new Promise((resolve, reject) => {
            self.emit('disconnected', self.getId());
            resolve();
        });
    }

    emit(event, ...args) {
        var self = this;
        return new Promise((resolve, reject) => {
            super.emit.apply(this, arguments);

            resolve();
        });
    }

    emitToOne(event, message, timeout) {
        timeout = timeout || 0;
        var self = this;
        return new Promise((resolve, reject) => {
            var msgId = UUID.v4();

            var tid;
            if (timeout > 0) {
                tid = setTimeout(() => {
                    self.promises[msgId].reject('timeout');
                }, timeout);
            }
            self.promises[msgId] = {
                resolve: (response) => {
                    clearTimeout(tid);
                    delete self.promises[msgId];
                    resolve(response);
                },
                reject: (reason) => {
                    clearTimeout(tid);
                    delete self.promises[msgId];
                    reject(reason);
                }
            };

            self.callOneListener(event, message, null, self.promises[msgId].resolve, self.promises[msgId].reject);
        });
    }
}

module.exports = ProcessEventEmitter;
