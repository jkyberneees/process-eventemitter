/*
 Copyright (C) 2016 Rolando Santamaria Maso (@kyberneees)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specifi8c language governing permissions and
 limitations under the License.0
 */
/*jshint esversion: 6*/

const expect = require("chai").expect;
const ProcessEventEmitter = require("./main.js");

// connection opened flag
var connected = false,
    disconnected = false;

// instantiating event emitter
const emitter = new ProcessEventEmitter();

emitter.on('connected', () => {
    connected = true;
});
emitter.on('disconnected', () => {
    disconnected = true;
});
emitter.on('error', (error) => {
    console.log(error);
});

// message to be sent/published
var messageout = {
    data: 'hello!'
};
// received message
var messagein;

describe('Basic', () => {
    describe('connect', () => {
        it('connecting', (done) => {
            emitter.connect();
            setTimeout(() => {
                expect(connected).to.equal(true);
                done();
            }, 5);
        });
    });

    describe('getId', () => {
        it('getId', () => {
            expect(typeof emitter.getId()).to.equal('string');
        });
    });

    describe('subscribing', () => {
        it('event: news.*', () => {
            var callback = (data) => {
                // should be called only if message is published
                // then, intentionally we set null in 'data' property
                messagein = {
                    data: null
                };
            };

            emitter.on('news.*', callback);
            emitter.on('news.*', (data) => {
                messagein = data;
            });
            emitter.removeListener('news.*', callback);

            emitter.on('news.*', callback);
        });
    });

    describe('emitToOne', () => {
        it("emit to 'news.public' > {data: 'hello!'}", (done) => {
            emitter.emitToOne('news.public', messageout);

            setTimeout(() => {
                expect(messageout.data).to.equal(messagein.data);
                done();
            }, 5);
        });
    });

    describe('emit', () => {
        it("emit to 'news.private' > {data: 'hello!'}", (done) => {
            emitter.emit('news.private', messageout);

            setTimeout(() => {
                expect(null).to.equal(messagein.data);
                done();
            }, 5);
        });
    });

    describe('disconnect', () => {
        it("disconnecting incoming instance", (done) => {
            emitter.disconnect();

            setTimeout(() => {
                expect(disconnected).to.equal(true);
                done();
            }, 5);
        });
    });
});

describe('Promise', () => {
    describe('connect', () => {
        it('connecting incoming instance', (done) => {
            emitter.connect().then(() => {
                done();
            });
        });
    });

    describe('subscribing', () => {
        it('event: my.action', (done) => {
            emitter.on('request', (event, request) => {
                if ('my.action' === event) {
                    if ('string' === typeof request.data) {
                        request.data = request.data.toUpperCase();
                    }
                }
            });
            emitter.on('response', (event, response) => {
                if ('my.action' === event && response.ok) {
                    response.data = response.data.toUpperCase();
                }
            });
            emitter.on('my.action', (data, resolve, reject) => {
                if (typeof (data) === 'string' && 'HI THERE...' === data) {
                    resolve('hello');
                } else {
                    reject('invalid type');
                }
            });
            emitter.on('my.action2', (data, resolve, reject) => {
                resolve();
            });
            done();
        });
    });

    describe('emitToOne', () => {
        it("emitting to 'my.action' > 'Hi there...'", (done) => {
            emitter.emitToOne('my.action', 'Hi there...').then((response) => {
                expect('HELLO').to.equal(response);
                done();
            });
        });
    });

    describe('emitToOne 2', () => {
        it("emitting to 'my.action.local' > 'Hi there...'", (done) => {
            emitter.on('my.action.local', (data, resolve) => {
                if (typeof (data) === 'string')
                    resolve('hello');
                else
                    reject('invalid type');
            });

            emitter.emitToOne('my.action.local', 'Hi there...', 100).then((response) => {
                expect('hello').to.equal(response);
                done();
            });
        });
    });

    describe('emitToOne  expecting rejection', () => {
        it("emitting to 'my.action' > 'Hi there...'", (done) => {
            emitter.emitToOne('my.action', 5, 200).catch((error) => {
                expect('invalid type').to.equal(error);
                done();
            });
        });
    });

    describe('emitToOne expecting null response', () => {
        it("emitting to 'my.action2' > 'Hi there...'", (done) => {
            emitter.emitToOne('my.action2', 'Hi there...', 200).then((response) => {
                done();
            });
        });
    });

    describe('emitToOne 2 expecting null response', () => {
        it("emitting to 'my.action2.local' > 'Hi there...'", (done) => {
            emitter.on('my.action2.local', (message, resolve) => {
                resolve();
            });
            emitter.emitToOne('my.action2.local', 'Hi there...').then((response) => {
                done();
            });
        });
    });

    describe('emitToOne expecting timeout', () => {
        it("emitting to 'my.timeout' > 'Hi there...'", (done) => {
            emitter.emitToOne('my.timeout', 'Hi there...', 25).catch((error) => {
                expect('timeout').to.equal(error);
                done();
            });
        });
    });

    describe('once', () => {
        it("testing 'once' listeners registration", (done) => {
            emitter.once('onetimelistener', (data, resolve) => {
                resolve();
            });
            emitter.emitToOne('onetimelistener', 'hello').then((error) => {
                return emitter.emitToOne('onetimelistener', 'hello again', 10);
            }).catch((error) => {
                expect('timeout').to.equal(error);
                done();
            });
        });
    });

    describe('emit', () => {
        it("emit to 'news.private' > {data: 'hello!'}", (done) => {
            emitter.emit('news.private', messageout).then((response) => {
                done();
            });
        });
    });

    describe('disconnect', () => {
        it('disconnecting', (done) => {
            emitter.disconnect().then(() => {
                return emitter.disconnect();
            }).then(() => {
                done();
            });
        });
    });
});
