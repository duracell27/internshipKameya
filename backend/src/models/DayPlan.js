const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['theory', 'practice', 'meeting', 'observation', 'other'],
    default: 'other',
  },
});

const dayPlanSchema = new Schema({
  day:       { type: Number, required: true, unique: true },
  isHoliday: { type: Boolean, default: false },
  tasks:     [taskSchema],
});

module.exports = mongoose.model('DayPlan', dayPlanSchema);
