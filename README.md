# jwt-auth-service

A service which does oauth authentication and issues a JWT token.

## Installation

1. Install via npm.

```sh
npm i -g jwt-auth-service
```

2. Create a postgres database and create the tables with scripts found under the 'db' directory.

## Running

You'd use something like this.

```sh
(export PORT=5999 CONFIG_DIR=/some/path/to/config DOMAIN=example.com; jwt-auth-service)
```

Where:

- PORT is the port on which the service will run.
- CONFIG_DIR is the directory in which config files are placed.
- DOMAIN is your application's main domain.

An example directory containing config files (which are JS files) can be found under the 'example-config' directory. This is where you specify database connection strings, jwt signing keys etc.

## Authenticating

Send the browser to YOUR_DOMAIN/authenticate/OAUTH_SERVICE?redirect=SOME_URL. For example: www.example.com/authenticate/github?redirect=docs.example.com. The page will redirect to docs.example.com after authentication with the 'jwt_auth_service_token' cookie set to the JWT token.
