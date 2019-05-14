CREATE TABLE "user" (
    "username" character varying (64) NOT NULL,
    "provider_username" character varying (128) NOT NULL,
    "provider_name" character varying (64) NOT NULL,
    CONSTRAINT "user_pkey" PRIMARY KEY ("username"));

CREATE TABLE "user_permission" (
    "resource" character varying (512) NOT NULL,
    "username" character varying (64) NOT NULL,
    "permission" character varying (64) NOT NULL,
    CONSTRAINT "user_permission_pkey" PRIMARY KEY ("resource", "username"),
    CONSTRAINT "user_permission_resource_username_fkey" 
        FOREIGN KEY ("username") REFERENCES "user" ("username"));

CREATE TABLE "role" (
    "role" character varying (64) NOT NULL,
    "description" character varying (512),
    CONSTRAINT "role_pkey" PRIMARY KEY ("role"));

CREATE TABLE "role_permission" (
    "resource" character varying (256) NOT NULL,
    "role" character varying (64) NOT NULL,
    "permission" character varying (64) NOT NULL,
    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("resource", "role"),
    CONSTRAINT "role_permission_resource_username_fkey" 
        FOREIGN KEY ("role") REFERENCES "role" ("role"));

CREATE TABLE "user_role" (
    "role" character varying (64) NOT NULL,
    "username" character varying (64) NOT NULL,
    CONSTRAINT "user_role_pkey" PRIMARY KEY ("role", "username"),
    CONSTRAINT "user_role_role_fkey" 
        FOREIGN KEY ("role") REFERENCES "role" ("role"),
    CONSTRAINT "user_role_username_fkey" 
        FOREIGN KEY ("username") REFERENCES "user" ("username"));
