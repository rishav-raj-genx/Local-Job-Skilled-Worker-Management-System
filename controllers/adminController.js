const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Rating = require('../models/Rating');
const Complaint = require('../models/Complaint');

// Admin Dashboard with MongoDB aggregations
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalWorkers,
      verifiedWorkers,
      pendingVerifications,
      activeJobs,
      completedJobs,
      openComplaints,
      mostRequestedServices,
      ratingSummary
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'worker' }),
      User.countDocuments({ role: 'worker', verificationStatus: 'Verified' }),
      User.countDocuments({ role: 'worker', verificationStatus: 'Pending' }),
      ServiceRequest.countDocuments({ status: { $in: ['Accepted', 'In Progress'] } }),
      ServiceRequest.countDocuments({ status: 'Completed' }),
      Complaint.countDocuments({ status: { $in: ['Open', 'Under Review'] } }),
      // Most-requested services aggregation
      ServiceRequest.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      // Platform rating statistics aggregation
      Rating.aggregate([
        {
          $group: {
            _id: null,
            average: { $avg: '$rating' },
            total: { $sum: 1 },
            fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            fourStar: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            threeStar: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            twoStar: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          }
        }
      ])
    ]);

    const stats = {
      totalUsers,
      totalCustomers,
      totalWorkers,
      verifiedWorkers,
      pendingVerifications,
      activeJobs,
      completedJobs,
      openComplaints,
      mostRequestedServices,
      ratingSummary: ratingSummary[0] || {
        average: 0,
        total: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0
      }
    };

    res.render('admin/dashboard', {
      title: 'Admin Master Dashboard - Skilled Worker Hub',
      stats
    });
  } catch (err) {
    next(err);
  }
};

// Worker Verification Queue
const getWorkerVerification = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { role: 'worker' };

    if (status && status !== 'all') {
      query.verificationStatus = status;
    } else if (!status) {
      // Default to showing pending workers first
      query.verificationStatus = 'Pending';
    }

    const workers = await User.find(query).sort({ createdAt: -1 });

    const counts = {
      pending: await User.countDocuments({ role: 'worker', verificationStatus: 'Pending' }),
      verified: await User.countDocuments({ role: 'worker', verificationStatus: 'Verified' }),
      rejected: await User.countDocuments({ role: 'worker', verificationStatus: 'Rejected' }),
      all: await User.countDocuments({ role: 'worker' })
    };

    res.render('admin/verification', {
      title: 'Worker Profile Verification',
      workers,
      selectedStatus: status || 'Pending',
      counts
    });
  } catch (err) {
    next(err);
  }
};

// Update Worker Verification Status (Verify / Reject)
const updateWorkerVerification = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { status } = req.body;

    if (!['Verified', 'Rejected', 'Pending'].includes(status)) {
      res.setFlash('error', 'Invalid verification status.');
      return res.redirect('/admin/workers');
    }

    const worker = await User.findOne({ _id: workerId, role: 'worker' });
    if (!worker) {
      res.setFlash('error', 'Worker not found.');
      return res.redirect('/admin/workers');
    }

    worker.verificationStatus = status;
    await worker.save();

    res.setFlash('success', `Worker ${worker.name} status updated to ${status}.`);
    res.redirect(req.headers.referer || '/admin/workers');
  } catch (err) {
    next(err);
  }
};

// User Management: View all users
const getUsers = async (req, res, next) => {
  try {
    const { role, search, status } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { location: regex }];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.render('admin/users', {
      title: 'Platform User Management',
      users,
      selectedRole: role || 'all',
      selectedStatus: status || 'all',
      searchQuery: search || ''
    });
  } catch (err) {
    next(err);
  }
};

// Toggle User Active/Inactive Status
const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Disallow admin self-deactivation
    if (userId.toString() === req.user._id.toString()) {
      res.setFlash('error', 'Action prohibited: You cannot deactivate your own admin account.');
      return res.redirect('/admin/users');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.setFlash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    user.isActive = !user.isActive;
    await user.save();

    res.setFlash('success', `User ${user.name} has been ${user.isActive ? 'activated' : 'deactivated'}.`);
    res.redirect(req.headers.referer || '/admin/users');
  } catch (err) {
    next(err);
  }
};

// Complaint Monitoring
const getComplaints = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const complaints = await Complaint.find(query)
      .populate('customer', 'name email phone')
      .populate('worker', 'name email phone')
      .populate('job', 'service status preferredDate')
      .sort({ createdAt: -1 });

    const counts = {
      open: await Complaint.countDocuments({ status: 'Open' }),
      underReview: await Complaint.countDocuments({ status: 'Under Review' }),
      resolved: await Complaint.countDocuments({ status: 'Resolved' }),
      closed: await Complaint.countDocuments({ status: 'Closed' }),
      all: await Complaint.countDocuments()
    };

    res.render('admin/complaints', {
      title: 'Complaint Monitoring System',
      complaints,
      selectedStatus: status || 'all',
      counts
    });
  } catch (err) {
    next(err);
  }
};

// View single complaint detail
const getComplaintDetail = async (req, res, next) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId)
      .populate('customer', 'name email phone location')
      .populate('worker', 'name email phone location verificationStatus skills')
      .populate('job', 'service status preferredDate preferredTime description location');

    if (!complaint) {
      res.setFlash('error', 'Complaint not found.');
      return res.redirect('/admin/complaints');
    }

    res.render('admin/complaintDetail', {
      title: `Complaint #${complaint._id.toString().slice(-6)} Details`,
      complaint
    });
  } catch (err) {
    next(err);
  }
};

// Update Complaint Status & Notes
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['Open', 'Under Review', 'Resolved', 'Closed'].includes(status)) {
      res.setFlash('error', 'Invalid complaint status.');
      return res.redirect(`/admin/complaints/${complaintId}`);
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      res.setFlash('error', 'Complaint not found.');
      return res.redirect('/admin/complaints');
    }

    complaint.status = status;
    if (adminNotes !== undefined) {
      complaint.adminNotes = adminNotes.trim();
    }
    await complaint.save();

    res.setFlash('success', `Complaint status updated to "${status}".`);
    res.redirect(`/admin/complaints/${complaintId}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getWorkerVerification,
  updateWorkerVerification,
  getUsers,
  toggleUserStatus,
  getComplaints,
  getComplaintDetail,
  updateComplaintStatus
};
