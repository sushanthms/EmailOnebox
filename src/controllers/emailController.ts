import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { fetchRecentEmails } from "../services/imap/ImapClient";

export const fetchEmails = async (req: Request, res: Response) => {
  try {
    const emails = await fetchRecentEmails(
      process.env.IMAP_EMAIL_1!,
      process.env.IMAP_PASSWORD_1!
    );

    res.status(200).json({ count: emails.length, emails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch emails", error: err });
  }
};
