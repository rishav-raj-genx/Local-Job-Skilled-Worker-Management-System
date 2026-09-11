const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      enum: ['customer', 'worker', 'admin'],
      default: 'customer'
    },
    location: {
      type: String,
      trim: true,
      default: 'New Delhi'
    },
    profileImage: {
      type: String,
      default: '/public/images/default-avatar.png'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Worker specific attributes
    skills: {
      type: [String],
      default: []
    },
    bio: {
      type: String,
      trim: true,
      default: ''
    },
    experience: {
      type: Number,
      default: 1,
      min: [0, 'Experience cannot be negative']
    },
    serviceArea: {
      type: String,
      trim: true,
      default: ''
    },
    hourlyRate: {
      type: Number,
      default: 300,
      min: [0, 'Hourly rate cannot be negative']
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending'
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast search and role lookup
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ location: 1 });
userSchema.index({ verificationStatus: 1 });

// Pre-save hook to hash password if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
