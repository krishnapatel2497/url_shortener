import express from "express";

import {
    getProfilePage,
} from "../controllers/profile.controller.js";


const router = express.Router();


router.get(
    "/profile",
    getProfilePage
);


export default router;