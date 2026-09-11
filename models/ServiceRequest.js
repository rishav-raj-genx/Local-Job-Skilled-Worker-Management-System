const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
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
    service: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Service location is required'],
      trim: true
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required']
    },
    preferredTime: {
      type: String,
      default: 'Morning (09:00 - 12:00)',
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    rated: {
      type: Boolean,
      default: false
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    completionNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

serviceRequestSchema.index({ customer: 1, createdAt: -1 });
serviceRequestSchema.index({ worker: 1, status: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ service: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
