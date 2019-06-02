INSERT INTO "user"(
	"domain",
	"username",
	"first_name",
	"last_name",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'jeswin',
		'Jeswin',
		'Kumar',
		1559302695646,
		1559302695646
	);

INSERT INTO "user"(
	"domain",
	"username",
	"first_name",
	"last_name",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'eddie',
		'Eddie',
		'Noname',
		1559302695646,
		1559302695646
	);

INSERT INTO "provider_user"(
	"domain",
	"username",
	"provider_username",
	"provider_name",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'jeswin',
		'jeswin',
		'github',
		1559302695646,
		1559302695646
	);

INSERT INTO "provider_user"(
	"domain",
	"username",
	"provider_username",
	"provider_name",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'eddie',
		'eddiedoesntexist',
		'github',
		1559302695646,
		1559302695646
	);

INSERT INTO "role"(
	"domain",
	"name",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'coreteam',
		1559302695646,
		1559302695646
	);
	
INSERT INTO "role"(
	"domain",
	"name",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'admin',
		1559302695646,
		1559302695646
	);
	
INSERT INTO "user_role"(
	"domain",
	"role",
	"username",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'coreteam',
		'jeswin',
		1559302695646,
		1559302695646
	);

INSERT INTO "user_role"(
	"domain",
	"role",
	"username",
	"created_at",
	"updated_at"
	)
	VALUES (
		'example.com',
		'admin',
		'jeswin',
		1559302695646,
		1559302695646
	);

INSERT INTO "user_role"(
	"domain",
	"role",
	"username",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'admin',
		'eddie',
		1559302695646,
		1559302695646
	);

INSERT INTO "user_token"(
	"domain",
	"token",
	"username",
	"value",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'full',
		'jeswin',
		'yes',
		1559302695646,
		1559302695646
	);
	
INSERT INTO "role_token"(
	"domain",
	"token",
	"role",
	"value",
	"created_at",
	"updated_at"
)
	VALUES (
		'example.com',
		'dashboard',
		'admin',
		'yes',
		1559302695646,
		1559302695646
	);