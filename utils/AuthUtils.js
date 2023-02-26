const validator = require("validator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const cleanUpAndValidate = ({ name, username, email, phone, password }) => {
  return new Promise((resolve, reject) => {
    if (!name || !username || !email || !phone || !password) {
      reject("Missing credentials");
    }
    if (typeof name !== "string") reject("Invalid name");
    if (typeof username !== "string") reject("Invalid Username");
    if (typeof email !== "string") reject("Invalid Email");
    if (typeof phone !== "string") reject("Invalid phone");
    if (typeof password !== "string") reject("Invalid Password");

    if (!validator.isEmail(email)) reject("Invalid Email Format");

    if (username.length <= 2 || username.length > 50)
      reject("Username should be 3 to 50 char");

    if (password.length <= 2 || password.length > 10)
      reject("password should be 3 to 25 char");

    console.log(phone.length);
    if (phone.length != 10) reject("phone number should be 10 digits");

    resolve();
  });
};

const SECRET_KEY = "This is Module Test";

const generateJWTToken = (email) => {
  const JWT_TOKEN = jwt.sign({ email: email }, SECRET_KEY, {
    expiresIn: "7d",
  });
  return JWT_TOKEN;
};

const sendVerificationToken = (email, verificationToken) => {
  console.log(email, verificationToken);

  let mailer = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: "Gmail",
    auth: {
      user: "cravi6635@gmail.com",
      pass: "ycaslxxppocoozdo",
    },
  });

  let mailOptions = {
    from: "profileweb.com",
    to: email,
    subject: "Email verification for ProfileApp",
    html: `click <a href="http://localhost:8000/verify/${verificationToken}">Here</a>`,
  };

  mailer.sendMail(mailOptions, function (err, response) {
    if (err) throw err;
    else console.log("Mail has been sent successfully");
  });
};
module.exports = {
  cleanUpAndValidate,
  generateJWTToken,
  sendVerificationToken,
  SECRET_KEY,
};
