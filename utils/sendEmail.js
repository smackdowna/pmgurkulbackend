import nodeMailer from "nodemailer";

const createTransport = nodeMailer.createTransport;

const sendEmail = async (to, subject, text, html = null) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    to,
    subject,
  };

  // If html is provided, send as HTML email
  if (html) {
    mailOptions.html = html;
    // Also include text version for email clients that don't support HTML
    mailOptions.text = text || "Please view this email in an HTML-enabled email client.";
  } else {
    // If no html, send as plain text
    mailOptions.text = text;
  }

  await transporter.sendMail(mailOptions);
};

export default sendEmail;