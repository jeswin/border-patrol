# Border Patrol

NOTE: This README is incomplete.

A service which does oauth authentication and issues a JWT.

## Installation

1. Install via npm.

```sh
npm i -g border-patrol
```

2. Create a postgres database and create the tables with scripts found under the 'db' directory.

## Running

You'd use something like this.

```sh
border-patrol -p 8080 -c /path/to/your/config
```

An example directory containing config files (which are JS files) can be found under the 'example-config' directory.
This is where you specify database connection strings, jwt and oauth keys etc.

## Authenticating

Send the browser to {YOUR_DOMAIN}/authenticate/{OAUTH_SERVICE}?success=SOME_URL&newuser=OTHER_URL. For example: www.example.com/authenticate/github?success=example.com/success&newuser=example.com/newuser. The page will redirect to example.com/success if the authenticated user is found in the database, and to example.com/newuser if the authenticated user is not found in the database.

## Key Value Store

Border Patrol can also store key value pairs for authenticated users. Users possessing a valid JWT can do so by posting to 'key', 'value' and 'tags' fields to /me/kvstore.

## Check if a user id exists

To check if some-id exists in the database, do an HTTP GET to /user-ids/some-id.

