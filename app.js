import express, { Router } from "express";
import { shortenerRoutes } from "./routes/shortener.routes.js"; //Import roiuter
import { authRoutes } from "./routes/auth.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs"); //set EJS Template Engine   //by default views folder access
// app.set("views", "./views")

//express router
//app.use(Router);
app.use(authRoutes);
app.use(shortenerRoutes); //Use Router

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

