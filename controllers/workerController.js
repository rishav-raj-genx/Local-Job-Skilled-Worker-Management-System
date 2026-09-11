const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Rating = require('../models/Rating');

// Worker Dashboard
const getDashboard = async (req, res, next) => {
  try {
    const workerId = req.user._id;

    const [pendingRequests, acceptedJobs, inProgressJobs, completedJobs, recentRequests, recentRatings] = await Promise.all([
      ServiceRequest.countDocuments({ worker: workerId, status: 'Pending' }),
      ServiceRequest.countDocuments({ worker: workerId, status: 'Accepted' }),
      ServiceRequest.countDocuments({ worker: workerId, status: 'In Progress' }),
      ServiceRequest.countDocuments({ worker: workerId, status: 'Completed' }),
      ServiceRequest.find({ worker: workerId })
        .populate('customer', 'name phone location')
        .sort({ createdAt: -1 })
        .limit(6),
      Rating.find({ worker: workerId })
        .populate('customer', 'name profileImage')
        .sort({ createdAt: -1 })
        .limit(3)
    ]);

    res.render('worker/dashboard', {
      title: 'Worker Dashboard - Skilled Worker Hub',
      worker: req.user,
      pendingRequests,
      acceptedJobs,
      inProgressJobs,
      completedJobs,
      recentRequests,
      recentRatings
    });
  } catch (err) {
    next(err);
  }
};

// Worker Profile View & Edit
const getProfile = async (req, res, next) => {
  try {
    res.render('worker/profile', {
      title: 'Manage Worker Profile',
      worker: req.user,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// Update Worker Profile
const postProfile = async (req, res, next) => {
  try {
    const { name, phone, location, serviceArea, bio, experience, hourlyRate } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.setFlash('error', 'User not found.');
      return res.redirect('/auth/login');
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (location) user.location = location.trim();
    if (serviceArea !== undefined) user.serviceArea = serviceArea.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (experience !== undefined) user.experience = Math.max(0, Number(experience) || 0);
    if (hourlyRate !== undefined) user.hourlyRate = Math.max(0, Number(hourlyRate) || 0);

    await user.save();

    res.setFlash('success', 'Profile updated successfully.');
    res.redirect('/worker/profile');
  } catch (err) {
    next(err);
  }
};

// Manage Skills page
const getSkills = async (req, res, next) => {
  try {
    const commonSkills = [
      'Electrician',
      'Plumber',
      'Carpenter',
      'Painter',
      'AC Repair',
      'Appliance Repair',
      'Cleaner',
      'Mason',
      'Welder',
      'Gardener',
      'Roofer',
      'Pest Control'
    ];

    res.render('worker/skills', {
      title: 'Manage Skills & Expertise',
      worker: req.user,
      commonSkills,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// Update Skills
const postSkills = async (req, res, next) => {
  try {
    const { selectedSkills, customSkill } = req.body;

    let skillsList = [];
    if (Array.isArray(selectedSkills)) {
      skillsList = selectedSkills;
    } else if (typeof selectedSkills === 'string' && selectedSkills.trim()) {
      skillsList = [selectedSkills.trim()];
    }

    if (customSkill && customSkill.trim()) {
      const customItems = customSkill.split(',').map((s) => s.trim()).filter(Boolean);
      skillsList = [...skillsList, ...customItems];
    }

    // Deduplicate and normalize
    const uniqueSkills = [...new Set(skillsList.map((s) => s.trim()).filter(Boolean))];

    const user = await User.findById(req.user._id);
    user.skills = uniqueSkills;
    await user.save();

    res.setFlash('success', 'Your skills list has been updated.');
    res.redirect('/worker/skills');
  } catch (err) {
    next(err);
  }
};

// View Service Requests for Worker
const getRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { worker: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await ServiceRequest.find(query)
      .populate('customer', 'name phone location email')
      .sort({ createdAt: -1 });

    res.render('worker/requests', {
      title: 'Incoming & Active Jobs',
      requests,
      selectedStatus: status || 'all'
    });
  } catch (err) {
    next(err);
  }
};

// Update Job Status with strict validation
const updateRequestStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason, completionNotes } = req.body;

    const request = await ServiceRequest.findOne({ _id: requestId, worker: req.user._id });
    if (!request) {
      res.setFlash('error', 'Job request not found or does not belong to you.');
      return res.redirect('/worker/requests');
    }

    const currentStatus = request.status;
    const newStatus = status;

    // Validate state transitions
    const validTransitions = {
      Pending: ['Accepted', 'Rejected'],
      Accepted: ['In Progress', 'Completed'],
      'In Progress': ['Completed'],
      Completed: [], // Terminal
      Rejected: [], // Terminal
      Cancelled: [] // Terminal
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      res.setFlash('error', `Invalid status transition from "${currentStatus}" to "${newStatus}".`);
      return res.redirect('/worker/requests');
    }

    request.status = newStatus;

    if (newStatus === 'Rejected' && rejectionReason) {
      request.rejectionReason = rejectionReason.trim();
    }

    if (newStatus === 'Completed' && completionNotes) {
      request.completionNotes = completionNotes.trim();
    }

    await request.save();

    res.setFlash('success', `Job #${request._id.toString().slice(-6)} status updated to "${newStatus}".`);
    res.redirect('/worker/requests');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getProfile,
  postProfile,
  getSkills,
  postSkills,
  getRequests,
  updateRequestStatus
};
