const express = require("express");
const clc = require("cli-color");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
const ObjectId = require("mongodb").ObjectId;
const jwt = require("jsonwebtoken");

const {
  cleanUpAndValidate,
  generateJWTToken,
  sendVerificationToken,
  SECRET_KEY,
} = require("./utils/AuthUtils");
const UserSchema = require("./UserSchema");
const { isAuth } = require("./middleware/authMiddleware");
const ProfileModel = require("./models/ProfileModel");

const app = express();
const PORT = process.env.PORT || 8000;

const saltRound = 10;

app.set("view engine", "ejs");
mongoose.set("strictQuery", true);

const MONGO_URI = `mongodb+srv://ravichandrapalla199:RM3ujqehrZU55mnc@cluster0.xwczseb.mongodb.net/profileapp`;
mongoose
  .connect(MONGO_URI)
  .then((res) => {
    console.log(clc.green("connected to mongoDB"));
  })
  .catch((error) => {
    console.log(clc.red(error));
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const store = new mongoDbSession({
  uri: MONGO_URI,
  collection: "sessions",
});

app.use(
  session({
    secret: "This is your profileapp",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.get("/register", (req, res) => {
  return res.render("register");
});

app.get("/login", (req, res) => {
  return res.render("login");
});

app.post("/register", async (req, res) => {
  const { name, username, email, phone, password } = req.body;
  console.log("this is body", req.body);
  try {
    await cleanUpAndValidate({
      name,
      username,
      email,
      phone,
      password,
    });
    console.log("cunv is completed");
    let userExists;
    try {
      userExists = await UserSchema.findOne({ email });
    } catch (error) {
      return res.send({
        status: 401,
        message: "user find error",
        error: error,
      });
    }

    if (userExists) {
      return res.send({
        status: 400,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRound);

    console.log(password, "hashed password is ", hashedPassword);

    const user = new UserSchema({
      name: name,
      username: username,
      email: email,
      phone: phone,
      state: "",
      country: "",
      college: "",
      password: hashedPassword,
    });
    console.log("user schema is done");
    const verificationToken = generateJWTToken(email);
    console.log("verification token is ", verificationToken);

    try {
      const userDB = await user.save();
      sendVerificationToken(email, verificationToken);
      console.log(userDB);

      return res.send({
        status: 200,
        message: "Please verify your email before login",
      });
    } catch (error) {
      return res.send({
        status: 401,
        message: "error saving new user",
        error: error,
      });
    }
  } catch (error) {
    return res.send({
      status: 401,
      message: " whole try catch error",
      error: error,
    });
  }
});

app.get("/verify/:token", async (req, res) => {
  console.log(req.params);
  const token = req.params.token;

  jwt.verify(token, SECRET_KEY, async (err, decodedData) => {
    if (err) throw err;
    console.log(decodedData);

    try {
      const userDb = await UserSchema.findOneAndUpdate(
        { email: decodedData.email },
        { emailAuthenticated: true }
      );

      console.log(userDb);
      return res.status(200).redirect("/login");
    } catch (error) {
      return res.send({
        status: 400,
        message: "Invalid Authentication Link",
        error: error,
      });
    }
  });
});

app.post("/login", async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.send({
      status: 400,
      message: "missing credentials",
    });
  }

  if (typeof loginId !== "string" || typeof password !== "string") {
    return res.send({
      status: 400,
      message: "Invalid data format",
    });
  }
  try {
    let userDb;
    if (validator.isEmail(loginId)) {
      userDb = await UserSchema.findOne({ email: loginId });
    } else {
      userDb = await UserSchema.findOne({ username: loginId });
    }

    //if user is not present
    if (!userDb) {
      return res.send({
        status: 402,
        message: "user does not exists please register first",
      });
    }

    if (!userDb.emailAuthenticated) {
      return res.send({
        status: 400,
        message: "please verify the email before login",
      });
    }
    // checking for password match
    const isMatch = await bcrypt.compare(password, userDb.password);
    console.log(isMatch);
    if (!isMatch) {
      return res.send({
        status: 402,
        message: "password mismatch",
      });
    }
    req.session.isAuth = true;
    req.session.user = {
      username: userDb.username,
      email: userDb.email,
      userId: userDb._id,
    };

    return res.status(200).redirect("/profile");
  } catch (error) {
    return res.send({
      status: 401,
      message: "email or username validator error",
      error: error,
    });
  }
});

app.get("/profile", isAuth, async (req, res) => {
  const username = req.session.user.username;
  console.log("username is", username);
  let fullprofiledata = [];
  try {
    fullprofiledata = await ProfileModel.find({ username: username });
    console.log("full profile data is", fullprofiledata);

    return res.send({
      status: 200,
      message: "Read success",
      data: fullprofiledata,
    });
  } catch (error) {
    return res.send({
      status: 400,
      message: "Database error",
      error: fullprofiledata,
    });
    return res.render("profile");
  }
});

app.post("/logout", isAuth, (req, res) => {
  console.log(req.session);

  req.session.destroy((err) => {
    if (err) throw err;

    res.redirect("/login");
  });
});

app.listen(PORT, (req, res) => {
  console.log(clc.red(`server is running on PORT ${PORT}`));
  console.log(clc.blue.underline(`http://localhost:${PORT}`));
});
