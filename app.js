import { readFile, writeFile } from "fs/promises";
//import { createServer } from "http";
import path from "path";
import crypto from "crypto";     //random value create
import express from "express";
import { url } from "inspector";

const app = express();

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join("data", "links.json");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {    //Error NO ENTry
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        throw error;
    }
}

const saveLinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links));
}


app.get("/", async (req, res) => {
    try {
        const file = await readFile(path.join("views", "index.html"));
        const links = await loadLinks();

        const content = file.toString().replaceAll("{{shortened_urls}}",
            Object.entries(links).map(([shortCode, url]) =>
                `<li><a href="/${shortCode}" target="_blank">${req.host}/${shortCode}</a> - ${url}</li>`
            )
                .join("")
        );
        return res.send(content);

    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal server error");
    }
})


app.post("/", async (req, res) => {
    try {
        const { url, shortCode } = req.body;
        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
        const links = await loadLinks();

        if (links[finalShortCode]) {
            return res.status(400).send("400 - Short code already exists. Please choose another.");
        }

        links[finalShortCode] = url;
        await saveLinks(links);
        return res.redirect("/?success=true");
    } catch (error) {
        console.error(err);
        return res.status(500).send("Internal server error");
    }
})



app.get("/:shortCode", async (req, res) => {
    try {
        const { shortCode } = req.params;
        const links = await loadLinks();

        if (!links[shortCode]) return res.status(404).send("404 error occurred");

        return res.redirect(links[shortCode]);
    } catch (error) {
        console.error(err);
        return res.status(500).send("Internal server error");
    }
})




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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});


