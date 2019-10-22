# express-router-ms-description [![Sponsor](https://johndoeinvest.com/logo-jdi-tag.png)](https://johndoeinvest.com/) [![Build Status](https://travis-ci.com/JohnDoeInvest/express-router-ms-description.svg?branch=master)](https://travis-ci.com/JohnDoeInvest/express-router-ms-description)

For more information about the overall idea and implementation details, see: https://github.com/JohnDoeInvest/ms-visualization

## NOTE
When `parameters` are used in a route the place where we check for them are different. If the route is a `GET` request the parameters will be checked in `req.query` (the data is sent in query parameters) otherwise the parameters are checked in `res.body` (the data is sent in the http body as JSON).
