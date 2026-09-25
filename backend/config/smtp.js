const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

const sendSMTPEmail = async (to, subject, text) =>{
  try {
    const mailOptions ={
      from: process.env.SMTP_USER,
      to,
      subject,
      text
    }

    const response = await transporter.sendMail(mailOptions);
    console.log("email send successfully message ID", response.messageId)
  } catch (error) {
    console.log("Error in sending email", error)
  }
}

module.exports = sendSMTPEmail