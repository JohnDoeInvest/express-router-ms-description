const express = require('express');
const expressRouterMSDescription = require('../src/index.js');
require('mocha-sinon');

const request = require('supertest');

const ALLOWED_TYPES = ["CLIENT", "ADMIN", "EXTERNAL"];

var assert = require('assert');
describe('ExpressRouterMSDescription', function () {

    beforeEach(function() {
        this.sinon.stub(console, 'warn');
    });

    describe('One router (CLIENT POST)', function () {
        const app = express();
        const routers = expressRouterMSDescription.parse(
            {
                pathPrefix: "/authenticate/bankid",
                endpoints: {
                    "/": [
                        {
                            method: "POST",
                            type: "CLIENT",
                            handlingFunction: "handleAuthenticate",
                            description: "Checks the SSID and then starts an authentication",
                            parameters: {
                                ssid: "string with Swedish social security number"
                            }
                        }
                    ]
                }
            },
            ALLOWED_TYPES,
            {
                handleAuthenticate: (req, res, next) => res.sendStatus(200)
            }
        );

        app.use("/authenticate/bankid", routers.CLIENT);

        it('respond with 200', function (done) {
            request(app)
                .post('/authenticate/bankid/')
                .expect(200, done);
        });

        it('respond with 404, wrong method', function (done) {
            request(app)
                .get('/authenticate/bankid/')
                .expect(404, done);
        });

        it('respond with 404, wrong URL', function (done) {
            request(app)
                .get('/authenticate/bankid/test')
                .expect(404, done);
        });
    });

    describe('Multiple routers', function () {
        const app = express();
        const routers = expressRouterMSDescription.parse(
            {
                pathPrefix: "/authenticate/bankid",
                endpoints: {
                    "/": [
                        {
                            method: "POST",
                            type: "CLIENT",
                            handlingFunction: "handleAuthenticate",
                            description: "Checks the SSID and then starts an authentication",
                            parameters: {
                                ssid: "string with Swedish social security number"
                            }
                        },
                        {
                            method: "GET",
                            type: "ADMIN",
                            handlingFunction: "handleListAuthentications",
                            description: "Lists all auth which have been made"
                        }
                    ]
                }
            },
            ALLOWED_TYPES,
            {
                handleAuthenticate: (req, res, next) => res.sendStatus(200),
                handleListAuthentications: (req, res, next) => res.sendStatus(200),
            }
        );

        app.use("/client/authenticate/bankid", routers.CLIENT);
        app.use("/admin/authenticate/bankid", routers.ADMIN);

        it('respond with 200 CLIENT', function (done) {
            request(app)
                .post('/client/authenticate/bankid/')
                .expect(200, done);
        });

        it('respond with 200 ADMIN', function (done) {
            request(app)
                .get('/admin/authenticate/bankid/')
                .expect(200, done);
        });

        it('respond with 404, wrong method/URL', function (done) {
            request(app)
                .post('/admin/authenticate/bankid/')
                .expect(404, done);
        });
    });

    describe('Incorrect setups', function () {
        it('failed to add routes, no matching method', function (done) {
            const app = express();
            const routers = expressRouterMSDescription.parse(
                {
                    pathPrefix: "/authenticate/bankid",
                    endpoints: {
                        "/": [
                            {
                                method: "POST",
                                type: "CLIENT",
                                handlingFunction: "handleAuthenticate",
                                description: "Checks the SSID and then starts an authentication",
                                parameters: {
                                    ssid: "string with Swedish social security number"
                                }
                            }
                        ]
                    }
                },
                ALLOWED_TYPES,
                {}
            );
            assert(console.warn.calledWith("Can't find handler function 'handleAuthenticate' for endpoint with method POST and URI /authenticate/bankid/"))

            app.use("/authenticate/bankid", routers.CLIENT);
            request(app)
                .post('/admin/authenticate/bankid/')
                .expect(404, done);
        });

        it('fail to add route, method not allowed', function(done) {
            const app = express();
            const routers = expressRouterMSDescription.parse(
                {
                    pathPrefix: "/authenticate/bankid",
                    endpoints: {
                        "/": [
                            {
                                method: "HEAD",
                                type: "CLIENT",
                                handlingFunction: "handleAuthenticate",
                                description: "Checks the SSID and then starts an authentication",
                                parameters: {
                                    ssid: "string with Swedish social security number"
                                }
                            }
                        ]
                    }
                },
                ALLOWED_TYPES,
                {
                    handleAuthenticate: (req, res, next) => res.sendStatus(200),
                }
            );
            assert(console.warn.calledWith("Method not allowed for endpoint with method HEAD and URI /authenticate/bankid/"))

            app.use("/authenticate/bankid", routers.CLIENT);
            request(app)
                .post('/admin/authenticate/bankid/')
                .expect(404, done);
        });

        it('fail to add route, method not allowed', function(done) {
            const app = express();
            const routers = expressRouterMSDescription.parse(
                {
                    pathPrefix: "/authenticate/bankid",
                    endpoints: {
                        "/": [
                            {
                                method: "POST",
                                type: "BACKEND",
                                handlingFunction: "handleAuthenticate",
                                description: "Checks the SSID and then starts an authentication",
                                parameters: {
                                    ssid: "string with Swedish social security number"
                                }
                            }
                        ]
                    }
                },
                ALLOWED_TYPES,
                {
                    handleAuthenticate: (req, res, next) => res.sendStatus(200),
                }
            );
            assert(console.warn.calledWith("Type not valid for endpoint with method POST and URI /authenticate/bankid/"))

            app.use("/authenticate/bankid", routers.CLIENT);
            request(app)
                .post('/admin/authenticate/bankid/')
                .expect(404, done);
        });
    });
});
