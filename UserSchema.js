const mangoose = require("mongoose");

const Schema = mangoose.Schema;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
    },
    username: {
      type: String,
      require: true,
      unique: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    phone: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    emailAuthenticated: {
      type: Boolean,
      require: true,
      default: false,
    },
  },
  { strict: false }
);

module.exports = mangoose.model("profileusers", UserSchema);
