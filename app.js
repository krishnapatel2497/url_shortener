import cookieParser from "cookie-parser";
import express from "express";
import flash from "connect-flash";
import requestIp from "request-ip";
import session from "express-session";

import { authRoutes } from "./routes/auth.routes.js";
import { dbclient } from "./config/db-client.js";
import { verifyAuthentication } from "./middleware/auth.Middleware.js";
import { shortenerRoutes } from "./routes/shortener.routes.js";
import profileRoutes from "./routes/profile.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

/*
|--------------------------------------------------------------------------
| Static Files
|--------------------------------------------------------------------------
*/

app.use(express.static("public"));

/*
|--------------------------------------------------------------------------
| Body Parser
|--------------------------------------------------------------------------
*/

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

/*
|--------------------------------------------------------------------------
| EJS Template Engine
|--------------------------------------------------------------------------
*/

app.set("view engine", "ejs");

/*
|--------------------------------------------------------------------------
| Cookie Parser
|--------------------------------------------------------------------------
*/

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Express Session
|--------------------------------------------------------------------------
|
| Used here for connect-flash messages.
| Authentication itself is handled using JWT + MongoDB sessions.
|
*/

app.use(
  session({
    secret: process.env.SESSION_SECRET || "my-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  }),
);

/*
|--------------------------------------------------------------------------
| Flash Messages
|--------------------------------------------------------------------------
*/

app.use(flash());

/*
|--------------------------------------------------------------------------
| Request IP
|--------------------------------------------------------------------------
*/

app.use(requestIp.mw());

/*
|--------------------------------------------------------------------------
| Authentication Middleware
|--------------------------------------------------------------------------
|
| Checks the access_token cookie and sets:
|
| req.user
|
*/

app.use(verifyAuthentication);

/*
|--------------------------------------------------------------------------
| Make User Available in EJS
|--------------------------------------------------------------------------
|
| Now you can use:
|
| <%= user %>
|
| inside EJS files.
|
*/

app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.currentPath = req.path;
  return next();
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
app.use("/", profileRoutes);

app.use(authRoutes);

app.use(shortenerRoutes);

/*
|--------------------------------------------------------------------------
| MongoDB Connection
|--------------------------------------------------------------------------
*/

await dbclient.connect();

console.log("MongoDB Connected successfully");

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
