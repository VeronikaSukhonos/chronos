import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const pendingEmailSchema = new Schema({
  email: {
    type: String
  },
  token: {
    type: String
  },
  expDate: {
    type: Date
  }
}, { _id: false });

const userSchema = new Schema({
  login: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: [true, 'Login is required'],
    minLength: [3, 'Login must be at least 3 characters'],
    maxLength: [30, 'Login must be at most 30 characters']
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: [true, 'Email is required'],
    maxLength: [100, 'Email must be at most 100 characters'],
    select: false
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  fullName: {
    type: String,
    trim: true,
    maxLength: [60, 'Full name must be at most 60 characters']
  },
  dob: {
    type: Date
  },
  avatar: {
    type: String,
    default: '/avatars/default.png'
  },
  registerDate: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
    select: false
  },
  isConfirmed: {
    type: Boolean,
    required: true,
    default: false,
    select: false
  },
  pendingEmail: {
    type: pendingEmailSchema,
    select: false
  },
  passwordToken: {
    type: String,
    select: false
  },
  refreshToken: {
    type: String,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password'))
    this.password = await bcrypt.hash(this.password, 10);
  if (this.isModified('avatar'))
    this.avatar = `/avatars/${this.avatar}`;
  next();
})

userSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
}

userSchema.query.byLoginOrEmail = function(login) {
  return this.or([{ login }, { email: login }]);
};

userSchema.query.byEmailOrPendingEmail = function(email) {
  return this.or(
    [{ email }, { 'pendingEmail.email': email, 'pendingEmail.expDate': { $gt: new Date() } }]
  );
};

export default model('User', userSchema);
