# express-router-ms-description

## NOTE
When `parameters` are used in a route the place where we check for them are different. If the route is a `GET` request the parameters will be checked in `req.query` (the data is sent in query parameters) otherwise the parameters are checked in `res.body` (the data is sent in the http body as JSON).
