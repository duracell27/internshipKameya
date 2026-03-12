const mongoose = require('mongoose');
const { Schema } = mongoose;

const reflectionSchema = new Schema({
  q1: Number,
  q2: Number,
  q3: Number,
  q4: String,
  q5: Number,
  comments:    String,
  submittedAt: Date,
}, { _id: false });

const daySchema = new Schema({
  day:              { type: Number, required: true },
  completedTaskIds: [{ type: Schema.Types.ObjectId }],
  reflection:       reflectionSchema,
});

const aiReportSchema = new Schema({
  analysis:  { type: String, required: true },
  daysCount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const traineeSchema = new Schema({
  user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  position:  { type: String, default: '' },
  startDate: { type: Date, default: Date.now },
  days:      [daySchema],
  aiReports: [aiReportSchema],
}, { timestamps: true });

traineeSchema.methods.toPublic = function (populatedUser, dayPlans = []) {
  // Calculate current day automatically from startDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));

  // If internship hasn't started yet, return empty days
  if (daysSinceStart < 0) {
    return {
      id:         this._id.toString(),
      name:       populatedUser.name,
      position:   this.position || '',
      startDate:  this.startDate,
      currentDay: null,
      days: [],
    };
  }

  const currentDay = daysSinceStart + 1;

  // Show all available day plans
  const relevantPlans = dayPlans
    .sort((a, b) => a.day - b.day);

  return {
    id:         this._id.toString(),
    name:       populatedUser.name,
    position:   this.position || '',
    startDate:  this.startDate,
    currentDay,
    aiReports: (this.aiReports ?? []).map(r => ({
      id:        r._id.toString(),
      analysis:  r.analysis,
      daysCount: r.daysCount,
      createdAt: r.createdAt,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    days: relevantPlans.map(plan => {
      const isPreview = plan.day > currentDay;
      const td = this.days.find(d => d.day === plan.day);
      const completedIds = (td?.completedTaskIds ?? []).map(id => id.toString());

      return {
        day:       plan.day,
        isHoliday: plan.isHoliday,
        isPreview,
        tasks: plan.tasks.map(t => ({
          id:          t._id.toString(),
          title:       t.title,
          description: t.description || '',
          type:        t.type,
          completed:   completedIds.includes(t._id.toString()),
        })),
        reflection: !isPreview && td?.reflection
          ? {
              q1:          td.reflection.q1,
              q2:          td.reflection.q2,
              q3:          td.reflection.q3,
              q4:          td.reflection.q4,
              q5:          td.reflection.q5,
              comments:    td.reflection.comments,
              submittedAt: td.reflection.submittedAt,
            }
          : undefined,
      };
    }),
  };
};

module.exports = mongoose.model('Trainee', traineeSchema);
