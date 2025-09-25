import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name.'],
    },

    email: {
      type: String,
      required: [true, 'Please add an email.'],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ]
    },

    password: {
      type: String,
      required: [true, 'Please add a password.'],
      minlength: [6, 'Password should be atleast 6 characters long.'],

    },

    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Middleware to hash password before saving a user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();         // runs only if password is new or changed

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  };
});


// method to compare hashed password with the password stored on DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);


export default User;
