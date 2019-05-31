INSERT INTO "user"("domain", "username")
	VALUES ('example.com', 'jeswin');

INSERT INTO "user"("domain", "username")
	VALUES ('example.com', 'eddie');

INSERT INTO "provider_user"(
	"domain", "username", "provider_username", "provider_name"
)
	VALUES ('example.com', 'jeswin', 'jeswin', 'github');

INSERT INTO "provider_user"(
	"domain", "username", "provider_username", "provider_name"
)
	VALUES ('example.com', 'eddie', 'eddiedoesntexist', 'github');

INSERT INTO "role"("domain", "role")
	VALUES ('example.com', 'coreteam');
	
INSERT INTO "role"("domain", "role")
	VALUES ('example.com', 'admin');
	
INSERT INTO "user_role"("domain", "role", "username")
	VALUES ('example.com', 'coreteam', 'jeswin');

INSERT INTO "user_role"("domain", "role", "username")
	VALUES ('example.com', 'admin', 'jeswin');

INSERT INTO "user_role"("domain", "role", "username")
	VALUES ('example.com', 'admin', 'eddie');

INSERT INTO "user_token"("domain", "token", "username", "value")
	VALUES ('example.com', 'full', 'jeswin', 'yes');
	
INSERT INTO "role_token"("domain", "token", "role", "value")
	VALUES ('example.com', 'dashboard', 'admin', 'yes');