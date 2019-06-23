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
    CONSTRAINT "provider_user_user_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE TABLE "user_token" (
    "user_id" character varying (64) NOT NULL,
    "name" character varying (128) NOT NULL,
    "value" character varying (128) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_token_pkey" 
        PRIMARY KEY ("name", "user_id"),
    CONSTRAINT "user_token_user_fkey" 
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
    CONSTRAINT "role_token_role_fkey" 
        FOREIGN KEY ("role_name") 
        REFERENCES "role" ("name"));

CREATE TABLE "user_role" (
    "user_id" character varying (64) NOT NULL,
    "role_name" character varying (64) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_role_pkey" 
        PRIMARY KEY ("role_name", "user_id"),
    CONSTRAINT "user_role_role_fkey" 
        FOREIGN KEY ("role_name") 
        REFERENCES "role" ("name"),
    CONSTRAINT "user_role_user_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE TABLE "user_store_log" (
    "user_id" character varying (64) NOT NULL,
    "key" character varying (128) NOT NULL,
    "value" character varying (1024) NOT NULL,
    "tag" character varying (128) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_store_log_pkey" 
        PRIMARY KEY ("user_id", "key", "timestamp"),
    CONSTRAINT "user_store_log_user_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE INDEX "idx_user_store_log_user_id_tag" 
    ON user_store_log("user_id", "tag");

CREATE TABLE "user_store" (
    "user_id" character varying (64) NOT NULL,
    "key" character varying (128) NOT NULL,
    "value" character varying (1024) NOT NULL,
    "tag" character varying (128) NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_store_pkey" 
        PRIMARY KEY ("user_id", "key"),
    CONSTRAINT "user_store_user_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));


CREATE INDEX "idx_user_store_user_id_tag" 
    ON user_store("user_id", "tag");

CREATE TABLE "user_resource" (
    "id" character varying (64) NOT NULL,
    "user_id"  character varying (64) NOT NULL,
    "name" character varying (128) NOT NULL,    
    "timestamp" bigint NOT NULL,
    CONSTRAINT "resource_pkey" 
        PRIMARY KEY ("id"),
    CONSTRAINT "resource_user_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));

CREATE TABLE "user_resource_permission_log" (
    "resource_id" character varying (64) NOT NULL,
    "assigner"  character varying (64) NOT NULL,
    "assignee" character varying (128) NOT NULL,    
    "permission" character varying (128) NOT NULL,    
    "timestamp" bigint NOT NULL,
    CONSTRAINT "user_resource_permission_log_pkey" 
        PRIMARY KEY ("id"),
    CONSTRAINT "user_resource_permission_log_fkey" 
        FOREIGN KEY ("user_id") 
        REFERENCES "user" ("id"));