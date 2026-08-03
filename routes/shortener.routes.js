
import { Router } from "express";
import { getShortenerPage, postURLShortener, redirectToShortLink } from "../controllers/postshortener.controller.js";

const router = Router();    //create router

{/*router.get("/report", (req, res) => {
    const student = [
        { name: "Krishna", grade: "10th", favoriteSubject: "Mathematics", },
        { name: "Ishita", grade: "9th", favoriteSubject: "Science", },
        { name: "Rohan", grade: "8th", favoriteSubject: "History", },
        { name: "Meera", grade: "10th", favoriteSubject: "English", },
        { name: "Kabir", grade: "11th", favoriteSubject: "Mathematics", }
    ];
    return res.render("report", { student });     //why use render ? :to display report.ejs file

})*/}

router.get("/", getShortenerPage);

router.post("/", postURLShortener);

router.get("/:shortCode", redirectToShortLink);

//default export | short application
//export default router;   


//Named exports
export const shortenerRoutes = router;
