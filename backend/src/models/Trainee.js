const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ['theory', 'practice', 'meeting', 'observation', 'other'],
    default: 'other',
  },
});

const reflectionSchema = new mongoose.Schema(
  {
    q1: Number,
    q2: Number,
    q3: Number,
    q4: String,
    q5: Number,
    comments: String,
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  isHoliday: { type: Boolean, default: false },
  tasks: [taskSchema],
  reflection: { type: reflectionSchema, default: null },
});

const traineeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    position: { type: String, default: '' },
    startDate: { type: Date, default: Date.now },
    days: [daySchema],
  },
  { timestamps: true }
);

traineeSchema.methods.toPublic = function (populatedUser) {
  const u = populatedUser || this.user;
  return {
    id: this._id,
    name: u?.name ?? '',
    position: this.position,
    startDate: this.startDate,
    days: this.days.map(day => ({
      day: day.day,
      isHoliday: day.isHoliday ?? false,
      tasks: day.tasks.map(t => ({
        id: t._id,
        title: t.title,
        description: t.description,
        completed: t.completed,
        type: t.type,
      })),
      reflection: day.reflection
        ? {
            q1: day.reflection.q1,
            q2: day.reflection.q2,
            q3: day.reflection.q3,
            q4: day.reflection.q4,
            q5: day.reflection.q5,
            comments: day.reflection.comments,
            submittedAt: day.reflection.submittedAt,
          }
        : undefined,
    })),
  };
};

module.exports = mongoose.model('Trainee', traineeSchema);
