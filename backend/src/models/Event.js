const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'login_success',
        'login_failed',
        'user_created',
        'user_updated',
        'user_deleted',
        'reflection_submitted',
      ],
      required: true,
    },
    actorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String },
    targetId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetName: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
