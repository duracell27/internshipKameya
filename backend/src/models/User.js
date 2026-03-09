const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      // stored always as +380XXXXXXXXX
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'trainee'],
      default: 'trainee',
    },
    currentDay: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Normalize phone to +380XXXXXXXXX before saving
userSchema.pre('save', async function () {
  if (this.isModified('phone')) {
    this.phone = normalizePhone(this.phone);
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    role: this.role,
    currentDay: this.currentDay ?? null,
  };
};

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('380')) return '+' + digits;
  if (digits.startsWith('0') && digits.length === 10) return '+38' + digits;
  return '+' + digits;
}

module.exports = mongoose.model('User', userSchema);
module.exports.normalizePhone = normalizePhone;
