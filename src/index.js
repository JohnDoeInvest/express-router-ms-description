const express = require('express');

const ALLOWED_HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"]

/**
 * @typedef {Object} Endpoint
 * @property {String} method
 * @property {String} type
 * @property {String} handlingFunction
 * @property {String} description
 * @property {Object.<string, string>} parameters
 */

/**
 * @typedef {Object} RestApiJson
 * @property {string} pathPrefix
 * @property {Object.<string, Endpoint[]>} endpoints
 */

/**
 * @example 
 * // Returns { "CLIENT": express.Router }
 * .parse({...}, ["CLIENT"], {...})
 * 
 * @param {RestApiJson} restApiJson The restAPI part of the serviceDescription
 * @param {string[]} allowedTypes The allowed types of paths
 * @param {Object} routeHandler A object containing all of the handlers for the routes
 * @return {Object.<string, express.Router>} Object containing a router for each allowed type
 */
function parse(restApiJson, allowedTypes, routeHandlers) {
    /** @type {Object.<string, express.Router>} */
    const routers = {};
    for (const allowedType of allowedTypes) {
        routers[allowedType] = express.Router();
    }

    for (var key in restApiJson.endpoints) {
        if (!restApiJson.endpoints.hasOwnProperty(key)) {
            continue;
        }

        const methods = restApiJson.endpoints[key]
        for (const method of methods) {
            // TODO: Since we have method.parameters we could do some nice things like check that is exists in the request.
            if (!routers.hasOwnProperty(method.type)) {
                console.warn("Type not valid for endpoint with method " + method.method + " and URI " + restApiJson.pathPrefix + key);
                continue;
            }

            if (!routeHandlers.hasOwnProperty(method.handlingFunction)) {
                console.warn("Can't find handler function '" + method.handlingFunction + "' for endpoint with method " + method.method + " and URI " + restApiJson.pathPrefix + key);
                continue;
            }

            const router = routers[method.type];
            if (ALLOWED_HTTP_METHODS.includes(method.method)) {
                // Express has all HTTP methods/verbs as functions in lowercase
                router[method.method.toLowerCase()](
                    restApiJson.pathPrefix + key,
                    [parameterCheckHandler(method.parameters), routeHandlers[method.handlingFunction]]
                );
            } else {
                console.warn("Method not allowed for endpoint with method " + method.method + " and URI " + restApiJson.pathPrefix + key);
            }
        }
    }

    return routers;
}

/**
 * Creates a function for 
 * 
 * @param {Object} params - The params to check for
 */
function parameterCheckHandler(params) {
    return (req, res, next) => {
        if (typeof params === 'object') {
            for (const param of Object.keys(params)) {
                if (!req.body[param]) {
                    res.send(500);
                    return
                }
            }
        }
        next();
    };
}

module.exports.parse = parse;