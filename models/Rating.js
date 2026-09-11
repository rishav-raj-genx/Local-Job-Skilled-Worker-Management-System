const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required']
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker reference is required']
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: [true, 'Job reference is required'],
      unique: true // A job can only be rated once
    },
    rating: {
      type: Number,
      required: [true, 'Rating value is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars']
    },
    review: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

ratingSchema.index({ worker: 1, createdAt: -1 });

// Static helper to recalculate worker averageRating & totalRatings
ratingSchema.statics.recalculateWorkerRating = async function (workerId) {
  const User = mongoose.model('User');
  const stats = await this.aggregate([
    { $match: { worker: new mongoose.Types.ObjectId(workerId) } },
    {
      $group: {
        _id: '$worker',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(workerId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalRatings: stats[0].totalRatings
    });
  } else {
    await User.findByIdAndUpdate(workerId, {
      averageRating: 0,
      totalRatings: 0
    });
  }
};

ratingSchema.post('save', async function () {
  await this.constructor.recalculateWorkerRating(this.worker);
});

module.exports = mongoose.model('Rating', ratingSchema);
