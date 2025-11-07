import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export const fetchRecentEmails = async (email: string, password: string) => {
  const config = {
    imap: {
      user: email,
      password: password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000,
    },
    onmail: (numNewMail: number) => {
      console.log(`📩 ${numNewMail} new emails arrived`);
    },
  };

  const connection = await imaps.connect(config);
  await connection.openBox('INBOX');

  // Fetch last 30 days
  const delay = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
  const since = new Date(Date.now() - delay);

  const searchCriteria = ['ALL', ['SINCE', since.toISOString()]];
  const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };

  const messages = await connection.search(searchCriteria, fetchOptions);
  const emails = [];

  for (const item of messages) {
    const all = item.parts.find((part: any) => part.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)');
    const parsed = await simpleParser(all.body);
    emails.push({
      subject: parsed.subject,
      from: parsed.from?.text,
      date: parsed.date,
    });
  }

  connection.on('mail', async () => {
    console.log('📩 New email detected');
    // You can fetch it here immediately
  });

  return emails;
};
