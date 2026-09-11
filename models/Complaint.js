const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required']
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest'
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: ['Open', 'Under Review', 'Resolved', 'Closed'],
      default: 'Open'
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.index({ customer: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
