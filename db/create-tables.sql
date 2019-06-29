CREATE TABLE "user" (
    "id" character varying (64) NOT NULL,
    "first_name" character varying (64) NOT NULL,
    "last_name" character varying (64) NOT NULL,    
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_pkey" 
        PRIMARY KEY ("id"));

CREATE TABLE "provider_user" (
    "user_id" character varying (64) NOT NULL,
    "provider_user_id" character varying (128) NOT NULL,
    "provider" character varying (64) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "provider_user_pkey" 
        PRIMARY KEY ("provider_user_id", "provider"),
    CONSTRAINT "provider_user_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE TABLE "user_token" (
    "user_id" character varying (64) NOT NULL,
    "name" character varying (128) NOT NULL,
    "value" character varying (128) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_token_pkey" 
        PRIMARY KEY ("name", "user_id"),
    CONSTRAINT "user_token_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE TABLE "role" (
    "name" character varying (64) NOT NULL,
    "description" character varying (512),
    "timestamp" bigint NOT NULL,
    CONSTRAINT "role_pkey" 
        PRIMARY KEY ("name"));

CREATE TABLE "role_token" (
    "name" character varying (256) NOT NULL,
    "role_name" character varying (64) NOT NULL,
    "value" character varying (64) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "role_token_pkey" 
        PRIMARY KEY ("name", "role_name"),
    CONSTRAINT "role_token_role_name_fkey" 
        FOREIGN KEY ("role_name") 
        REFERENCES "role" ("name"));

CREATE TABLE "user_role" (
    "user_id" character varying (64) NOT NULL,
    "role_name" character varying (64) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_role_pkey" 
        PRIMARY KEY ("role_name", "user_id"),
    CONSTRAINT "user_role_role_name_fkey" 
        FOREIGN KEY ("role_name") 
        REFERENCES "role" ("name"),
    CONSTRAINT "user_role_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE TABLE "user_kvstore" (
    "user_id" character varying (64) NOT NULL,
    "key" character varying (128) NOT NULL,
    "value" character varying (1024) NOT NULL,
    "tag" character varying (128) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_kvstore_pkey" 
        PRIMARY KEY ("user_id", "key"),
    CONSTRAINT "user_kvstore_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE INDEX "idx_user_kvstore_user_id_tag" 
    ON user_kvstore("user_id", "tag");

CREATE TABLE "resource" (
    "id" character varying (64) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "resource_pkey" 
        PRIMARY KEY ("id"));

CREATE TABLE "resource_permission" (
    "resource_id" character varying (64) NOT NULL,
    "user_id" character varying (64) NOT NULL,
    "read" character(1) NOT NULL,
    "write" character(1) NOT NULL,
    "execute" character(1) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "resource_permission_pkey" 
        PRIMARY KEY ("resource_id", "user_id"),
    CONSTRAINT "resource_permission_resource_id_fkey" 
        FOREIGN KEY ("resource_id") 
        REFERENCES "resource" ("id"),
    CONSTRAINT "resource_permission_user_id_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

