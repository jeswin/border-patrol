CREATE TABLE "user" (
    "domain" character varying (64) NOT NULL,
    "username" character varying (64) NOT NULL,
    CONSTRAINT "user_pkey" 
        PRIMARY KEY ("domain", "username"));

CREATE TABLE "provider_user" (
    "domain" character varying (64) NOT NULL,
    "username" character varying (64) NOT NULL,
    "provider_username" character varying (128) NOT NULL,
    "provider_name" character varying (64) NOT NULL,
    CONSTRAINT "provider_user_pkey" 
        PRIMARY KEY ("domain", "provider_username", "provider_name"),
    CONSTRAINT "provider_user_user_fkey" 
        FOREIGN KEY ("domain", "username") 
        REFERENCES "user" ("domain", "username"));

CREATE TABLE "user_token" (
    "domain" character varying (64) NOT NULL,
    "token" character varying (512) NOT NULL,
    "username" character varying (64) NOT NULL,
    "value" character varying (64) NOT NULL,
    CONSTRAINT "user_token_pkey" 
        PRIMARY KEY ("domain", "token", "username"),
    CONSTRAINT "user_token_user_fkey" 
        FOREIGN KEY ("domain", "username") 
        REFERENCES "user" ("domain", "username"));

CREATE TABLE "role" (
    "domain" character varying (64) NOT NULL,
    "role" character varying (64) NOT NULL,
    "description" character varying (512),
    CONSTRAINT "role_pkey" 
        PRIMARY KEY ("domain", "role"));

CREATE TABLE "role_token" (
    "domain" character varying (64) NOT NULL,
    "token" character varying (256) NOT NULL,
    "role" character varying (64) NOT NULL,
    "value" character varying (64) NOT NULL,
    CONSTRAINT "role_token_pkey" 
        PRIMARY KEY ("domain", "token", "role"),
    CONSTRAINT "role_token_role_fkey" 
        FOREIGN KEY ("domain", "role") 
        REFERENCES "role" ("domain", "role"));

CREATE TABLE "user_role" (
    "domain" character varying (64) NOT NULL,
    "role" character varying (64) NOT NULL,
    "username" character varying (64) NOT NULL,
    CONSTRAINT "user_role_pkey" 
        PRIMARY KEY ("domain", "role", "username"),
    CONSTRAINT "user_role_role_fkey" 
        FOREIGN KEY ("domain", "role") 
        REFERENCES "role" ("domain", "role"),
    CONSTRAINT "user_role_user_fkey" 
        FOREIGN KEY ("domain", "username") 
        REFERENCES "user" ("domain", "username"));
