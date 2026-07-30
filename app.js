import express, { Router } from "express";
import { shortenerRoutes } from "./routes/shortener.routes.js";    //Import roiuter 

//import router from "./routes/shortener.routes.js";
//import { createServer } from "http";


const app = express();

const PORT = process.env.PORT || 3000;


app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");     //set EJS Template Engine   //by default views folder access 
// app.set("views", "./views")

//express router
//app.use(Router);
app.use(shortenerRoutes);      //Use Router



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});




// const server = createServer(async (req, res) => {
//     console.log(req.method, req.url);

//     if (req.method === "GET") {

//         if (req.url === "/") {
//             try {
//                 const data = await readFile(path.join("public", "index.html"));

//                 res.writeHead(200, {
//                     "Content-Type": "text/html"
//                 });
//                 return res.end(data);
//             } catch (err) {
//                 res.writeHead(404);
//                 return res.end("404 Page Not Found");
//             }
//         }
//         else if (req.url === "/style.css") {
//             try {
//                 const data = await readFile(path.join("public", "style.css"));

//                 res.writeHead(200, {
//                     "Content-Type": "text/css"
//                 });
//                 return res.end(data);
//             } catch (err) {
//                 res.writeHead(404);
//                 return res.end("CSS Not Found");
//             }
//         } else if (req.url === "/links") {
//             const links = await loadLinks();
//             res.writeHead(200, { "content-type": "application/json" });
//             return res.end(JSON.stringify(links));

//         } else {
//             const links = await loadLinks();

//             const shortCode = req.url.slice(1)   // remove /

//             console.log("Requested:", shortCode);
//             console.log("Available:", links);

//             if (links[shortCode]) {
//                 console.log("Redirecting to:", links[shortCode]);

//                 res.writeHead(302, { Location: links[shortCode] });

//                 return res.end();
//             }
//             res.writeHead(404, { "Content-Type": "text/plain" });

//             return res.end("Shortened URL is not found");
//         }

//         res.writeHead(404);
//         res.end("404 Page Not Found");
//     }

//     if (req.method === "POST" && req.url === "/shorten") {
//         const links = await loadLinks();

//         let body = "";
//         req.on("data", (chunk) => {
//             body = body + chunk;
//         });


//         req.on("end", async () => {
//             console.log(body);
//             const { url, shortCode } = JSON.parse(body);

//             if (!url) {
//                 res.writeHead(400, { "content-type": "text/plain" });
//                 return res.end("url is required");
//             }

//             const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");    //why? for duplicate check

//             if (links[finalShortCode]) {
//                 res.writeHead(400, { "content-type": "text/plain" });
//                 return res.end("Short code already exists. Please choose another.");
//             }

//             links[finalShortCode] = url;

//             await saveLinks(links);

//             res.writeHead(200, { "Content-Type": "application/json" });
//             res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));
//         });
//     }
// });


