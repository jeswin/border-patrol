INSERT INTO "user"("username", "provider_username", "provider_name")
	VALUES ('jeswin', 'jeswin', 'github');

INSERT INTO "user"(	"username", "provider_username", "provider_name")
	VALUES ('eddie', 'eddiedoesntexist', 'github');

INSERT INTO "role"(	"role")
	VALUES ('coreteam');
	
INSERT INTO "role"("role")
	VALUES ('admin');
	
INSERT INTO "user_role"("role", "username")
	VALUES ('coreteam', 'jeswin');

INSERT INTO "user_role"("role", "username")
	VALUES ('admin', 'jeswin');

INSERT INTO "user_role"("role", "username")
	VALUES ('admin', 'eddie');

INSERT INTO "user_token"("token", "username", "value")
	VALUES ('full', 'jeswin', 'yes');
	
INSERT INTO "role_token"("token", "role", "value")
	VALUES ('dashboard', 'admin', 'yes');