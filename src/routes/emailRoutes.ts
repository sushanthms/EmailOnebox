import express from "express";
import { fetchEmails } from "../controllers/emailController";

const router = express.Router();

router.get("/fetch-emails", fetchEmails);

export default router;
