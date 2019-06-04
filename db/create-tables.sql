CREATE TABLE "user" (
    "username" character varying (64) NOT NULL,
    "first_name" character varying (64) NOT NULL,
    "last_name" character varying (64) NOT NULL,    
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "user_pkey" 
        PRIMARY KEY ("username"));

CREATE TABLE "provider_user" (
    "username" character varying (64) NOT NULL,
    "provider_username" character varying (128) NOT NULL,
    "provider" character varying (64) NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "provider_user_pkey" 
        PRIMARY KEY ("provider_username", "provider"),
    CONSTRAINT "provider_user_user_fkey" 
        FOREIGN KEY ("username") 
        REFERENCES "user" ("username"));

CREATE TABLE "user_token" (
    "token" character varying (128) NOT NULL,
    "username" character varying (64) NOT NULL,
    "value" character varying (128) NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "user_token_pkey" 
        PRIMARY KEY ("token", "username"),
    CONSTRAINT "user_token_user_fkey" 
        FOREIGN KEY ("username") 
        REFERENCES "user" ("username"));

CREATE TABLE "role" (
    "name" character varying (64) NOT NULL,
    "description" character varying (512),
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "role_pkey" 
        PRIMARY KEY ("name"));

CREATE TABLE "role_token" (
    "token" character varying (256) NOT NULL,
    "role" character varying (64) NOT NULL,
    "value" character varying (64) NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "role_token_pkey" 
        PRIMARY KEY ("token", "role"),
    CONSTRAINT "role_token_role_fkey" 
        FOREIGN KEY ("role") 
        REFERENCES "role" ("name"));

CREATE TABLE "user_role" (
    "role" character varying (64) NOT NULL,
    "username" character varying (64) NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "user_role_pkey" 
        PRIMARY KEY ("role", "username"),
    CONSTRAINT "user_role_role_fkey" 
        FOREIGN KEY ("role") 
        REFERENCES "role" ("name"),
    CONSTRAINT "user_role_user_fkey" 
        FOREIGN KEY ("username") 
        REFERENCES "user" ("username"));
