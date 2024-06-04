/*****  Packages  *****/
import Joi from "joi";
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";
/*****  Modules  *****/
import { getEnv } from "#utils/common/env";
import { TOKEN_EXPIRE_TIME, USER_ROLES } from "#constants/index";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      unique: true,
      type: String,
      maxlength: 50,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      uppercase: true,
      required: true,
      select: false,
      default: "USER",
    },
    api: {
      type: Schema.Types.Mixed,
      default: {
        bybit: {
          apiKey: "",
          secret: "",
        },
      },
    },
    active: {
      type: Boolean,
      default: false,
    },
    leverage: {
      type: Number,
      default: 0,
    },
    isAssign: {
      type: Boolean,
      default: false,
    },
    createdBy: Schema.Types.ObjectId,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, minimize: false }
);

userSchema.methods.generateAuthToken = function () {
  const payload = {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    api: this.api,
  };
  const secret = getEnv("JWT_SECRET");
  const options = { expiresIn: TOKEN_EXPIRE_TIME };
  return jwt.sign(payload, secret, options);
};

const UserModel = mongoose.model("User", userSchema);

const validateUser = (user) => {
  const schema = Joi.object({
    name: Joi.string().max(50).required(),
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(8).max(255).required(),
    role: Joi.string()
      .valid(...USER_ROLES)
      .insensitive()
      .messages({ "any.only": "Please select role" }),
    createdBy: Joi.string(),
  });

  return schema.validate(user);
};

export { UserModel, validateUser as validate };
