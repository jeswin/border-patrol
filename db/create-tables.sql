-- Table: public."user"
CREATE TABLE public. "user" (
    username character varying (64) COLLATE pg_catalog. "default" NOT NULL,
    service_username character varying (128) COLLATE pg_catalog. "default" NOT NULL,
    service_type character varying (64) COLLATE pg_catalog. "default" NOT NULL,
    CONSTRAINT user_pkey PRIMARY KEY (username))
WITH (
    OIDS = FALSE)
TABLESPACE pg_default;

ALTER TABLE public. "user" OWNER TO oauthjwtdbuser;

-- Table: public.permission

CREATE TABLE public.permission (
    id bigserial,
    resource character varying (256) COLLATE pg_catalog. "default" NOT NULL,
    username character varying (128) COLLATE pg_catalog. "default" NOT NULL,
    permission character varying (64) COLLATE pg_catalog. "default" NOT NULL,
    CONSTRAINT permission_pkey PRIMARY KEY (id),
    CONSTRAINT permission_username_fkey FOREIGN KEY (username) REFERENCES public. "user" (username) MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE)
TABLESPACE pg_default;

ALTER TABLE public.permission OWNER TO oauthjwtdbuser;

