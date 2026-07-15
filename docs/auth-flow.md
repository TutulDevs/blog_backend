## How the auth happening

In register/seed, the password is being hashed with `bcrypt` & saved in the db.

In login, the staff is returned from the db. Then it is being compared with `bcrypt.compare`, the inputs are user input password & hashed password from the db. After that a payload is being made with id, email & role. With that payload an access token is being generated via `jwtService.signAsync`. That access token is being sent to the user as response.

The `JwtAuthGuard` is checking the the token to validate. It's getting the context from its `canActivate` method. In that method via the context, the request & the request header of `authorization` is being taken to get the access token. The token is being verified by `jwtService.verifyAsync` and if the verification is true, the value (which is the jwt obj with iat & exp) is being set to `request.user`. If no error is thrown, it returns true, meaning authenticated.

### The Execution Chain In Action

When a client makes a request to a protected endpoint, the lifecycle looks like this:

- [Client_Request]
- [JwtAuthGuard]
  - Extract and verify token
  - Fetch user/staff (from token or DB)
  - Set request.user = user
- [RolesGuard] Reads request.user.roles to check permissions
- [Controller] Uses @Req() or @CurrentUser() to access request.user
- [Client_Response] request object is destroyed (garbage collected)
