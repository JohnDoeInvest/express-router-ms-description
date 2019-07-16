const express = require('express')
const expressRouterMSDescription = require('../src/index.js')
require('mocha-sinon')

const request = require('supertest')

const ALLOWED_TYPES = ['CLIENT', 'ADMIN', 'EXTERNAL']

var assert = require('assert')
describe('ExpressRouterMSDescription', function () {
  function createExpress () {
    const app = express()
    app.use(express.json())
    return app
  }

  beforeEach(function () {
    this.sinon.stub(console, 'warn')
  })

  describe('One router (CLIENT POST)', function () {
    const app = createExpress()
    const routers = expressRouterMSDescription.parse(
      {
        pathPrefix: '/authenticate/bankid',
        endpoints: {
          '/': [
            {
              method: 'POST',
              type: 'CLIENT',
              handlingFunction: 'handleAuthenticate',
              description: 'Checks the SSID and then starts an authentication',
              parameters: {
                ssid: { description: 'string with Swedish social security number' }
              }
            },
            {
              method: 'GET',
              type: 'CLIENT',
              handlingFunction: 'getAuthentication',
              description: 'Gets something',
              parameters: {
                test: { description: 'some test param' }
              }
            }
          ],
          '/optional': [
            {
              method: 'POST',
              type: 'CLIENT',
              handlingFunction: 'handleAuthenticate',
              description: 'Checks the SSID and then starts an authentication',
              parameters: {
                optionalValue: {
                  description: 'A value which is optional',
                  optional: true
                }
              }
            }
          ]
        }
      },
      ALLOWED_TYPES,
      {
        handleAuthenticate: (req, res, next) => res.sendStatus(200),
        getAuthentication: (req, res, next) => res.sendStatus(200)
      }
    )

    app.use('/', routers.CLIENT)

    it('respond with 200', function (done) {
      request(app)
        .post('/authenticate/bankid/')
        .send({ ssid: 'testSSID' })
        .expect(200, done)
    })

    it('respond with 200, correct params', function (done) {
      request(app)
        .get('/authenticate/bankid?test=hello')
        .expect(200, done)
    })

    it('respond with 500, incorrect params', function (done) {
      request(app)
        .post('/authenticate/bankid/')
        .send({ test: 'hello' })
        .expect(500, done)
    })

    it('respond with 200, body param sent as false ', function (done) {
      request(app)
        .post('/authenticate/bankid/')
        .send({ ssid: false })
        .expect(200, done)
    })

    it('respond with 200, query param sent as false', function (done) {
      request(app)
        .get('/authenticate/bankid?test=false')
        .expect(200, done)
    })

    it('respond with 404, wrong method', function (done) {
      request(app)
        .put('/authenticate/bankid/')
        .expect(404, done)
    })

    it('respond with 404, wrong URL', function (done) {
      request(app)
        .get('/authenticate/bankid/test')
        .expect(404, done)
    })

    it('respond with 200, optional missing', function (done) {
      request(app)
        .post('/authenticate/bankid/optional')
        .expect(200, done)
    })

    it('respond with 200, optional used', function (done) {
      request(app)
        .post('/authenticate/bankid/optional')
        .send({ optionalValue: 'Hello' })
        .expect(200, done)
    })
  })

  describe('Multiple routers', function () {
    const app = createExpress()
    const routers = expressRouterMSDescription.parse(
      {
        pathPrefix: '/authenticate/bankid',
        endpoints: {
          '/': [
            {
              method: 'POST',
              type: 'CLIENT',
              handlingFunction: 'handleAuthenticate',
              description: 'Checks the SSID and then starts an authentication',
              parameters: {
                ssid: { description: 'string with Swedish social security number' }
              }
            },
            {
              method: 'GET',
              type: 'ADMIN',
              handlingFunction: 'handleListAuthentications',
              description: 'Lists all auth which have been made'
            }
          ]
        }
      },
      ALLOWED_TYPES,
      {
        handleAuthenticate: (req, res, next) => res.sendStatus(200),
        handleListAuthentications: (req, res, next) => res.sendStatus(200)
      }
    )

    app.use('/client', routers.CLIENT)
    app.use('/admin', routers.ADMIN)

    it('respond with 200 CLIENT', function (done) {
      request(app)
        .post('/client/authenticate/bankid/')
        .send({ ssid: 'testSSID' })
        .expect(200, done)
    })

    it('respond with 200 ADMIN', function (done) {
      request(app)
        .get('/admin/authenticate/bankid/')
        .expect(200, done)
    })

    it('respond with 404, wrong method/URL', function (done) {
      request(app)
        .post('/admin/authenticate/bankid/')
        .expect(404, done)
    })
  })

  describe('Incorrect setups', function () {
    it('failed to add routes, no matching method', function (done) {
      const app = createExpress()
      const routers = expressRouterMSDescription.parse(
        {
          pathPrefix: '/authenticate/bankid',
          endpoints: {
            '/': [
              {
                method: 'POST',
                type: 'CLIENT',
                handlingFunction: 'handleAuthenticate',
                description: 'Checks the SSID and then starts an authentication',
                parameters: {
                  ssid: { description: 'string with Swedish social security number' }
                }
              }
            ]
          }
        },
        ALLOWED_TYPES,
        {}
      )
      assert(console.warn.calledWith("Can't find handler function 'handleAuthenticate' for endpoint with method POST and URI /authenticate/bankid/"))

      app.use('/', routers.CLIENT)
      request(app)
        .post('/admin/authenticate/bankid/')
        .expect(404, done)
    })

    it('fail to add route, method not allowed', function (done) {
      const app = createExpress()
      const routers = expressRouterMSDescription.parse(
        {
          pathPrefix: '/authenticate/bankid',
          endpoints: {
            '/': [
              {
                method: 'HEAD',
                type: 'CLIENT',
                handlingFunction: 'handleAuthenticate',
                description: 'Checks the SSID and then starts an authentication',
                parameters: {
                  ssid: 'string with Swedish social security number'
                }
              }
            ]
          }
        },
        ALLOWED_TYPES,
        {
          handleAuthenticate: (req, res, next) => res.sendStatus(200)
        }
      )
      assert(console.warn.calledWith('Method not allowed for endpoint with method HEAD and URI /authenticate/bankid/'))

      app.use('/', routers.CLIENT)
      request(app)
        .post('/admin/authenticate/bankid/')
        .expect(404, done)
    })

    it('fail to add route, type not valid', function (done) {
      const app = createExpress()
      const routers = expressRouterMSDescription.parse(
        {
          pathPrefix: '/authenticate/bankid',
          endpoints: {
            '/': [
              {
                method: 'POST',
                type: 'BACKEND',
                handlingFunction: 'handleAuthenticate',
                description: 'Checks the SSID and then starts an authentication',
                parameters: {
                  ssid: { description: 'string with Swedish social security number' }
                }
              }
            ]
          }
        },
        ALLOWED_TYPES,
        {
          handleAuthenticate: (req, res, next) => res.sendStatus(200)
        }
      )
      assert(console.warn.calledWith('Type not valid for endpoint with method POST and URI /authenticate/bankid/'))

      app.use('/', routers.CLIENT)
      request(app)
        .post('/admin/authenticate/bankid/')
        .expect(404, done)
    })
  })
})
