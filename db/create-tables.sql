CREATE TABLE "user" (
    "id" character varying (64) NOT NULL,
    "first_name" character varying (64) NOT NULL,
    "last_name" character varying (64) NOT NULL,    
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "user_pkey" 
        PRIMARY KEY ("id"));

CREATE TABLE "provider_user" (
    "user_id" character varying (64) NOT NULL,
    "provider_user_id" character varying (128) NOT NULL,
    "provider" character varying (64) NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "provider_user_pkey" 
        PRIMARY KEY ("provider_user_id", "provider"),
    CONSTRAINT "provider_user_user_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE TABLE "user_token" (
    "name" character varying (128) NOT NULL,
    "user_id" character varying (64) NOT NULL,
    "value" character varying (128) NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "user_token_pkey" 
        PRIMARY KEY ("name", "user_id"),
    CONSTRAINT "user_token_user_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE TABLE "role" (
    "name" character varying (64) NOT NULL,
    "description" character varying (512),
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "role_pkey" 
        PRIMARY KEY ("name"));

CREATE TABLE "role_token" (
    "name" character varying (256) NOT NULL,
    "role_name" character varying (64) NOT NULL,
    "value" character varying (64) NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "role_token_pkey" 
        PRIMARY KEY ("name", "role_name"),
    CONSTRAINT "role_token_role_fkey" 
        FOREIGN KEY ("role_name") 
        REFERENCES "role" ("name"));

CREATE TABLE "user_role" (
    "user_id" character varying (64) NOT NULL,
    "role_name" character varying (64) NOT NULL,
    "created_at" bigint NOT NULL,
    "updated_at" bigint NOT NULL,
    CONSTRAINT "user_role_pkey" 
        PRIMARY KEY ("role_name", "user_id"),
    CONSTRAINT "user_role_role_fkey" 
        FOREIGN KEY ("role_name") 
        REFERENCES "role" ("name"),
    CONSTRAINT "user_role_user_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));
