import express, { Router } from "express";
import { shortenerRoutes } from "./routes/shortener.routes.js"; //Import roiuter
import { authRoutes } from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import { dbclient } from "./config/db-client.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs"); //set EJS Template Engine   //by default views folder access

app.use(cookieParser());

app.use(authRoutes);
app.use(shortenerRoutes); //Use Router

await dbclient.connect();

console.log("MongoDB Connected successfully");

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
