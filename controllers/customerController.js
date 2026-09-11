const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Rating = require('../models/Rating');
const Complaint = require('../models/Complaint');

// Customer Dashboard
const getDashboard = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    // Fetch counts concurrently
    const [totalRequests, pendingRequests, activeRequests, completedRequests, recentRequests] = await Promise.all([
      ServiceRequest.countDocuments({ customer: customerId }),
      ServiceRequest.countDocuments({ customer: customerId, status: 'Pending' }),
      ServiceRequest.countDocuments({ customer: customerId, status: { $in: ['Accepted', 'In Progress'] } }),
      ServiceRequest.countDocuments({ customer: customerId, status: 'Completed' }),
      ServiceRequest.find({ customer: customerId })
        .populate('worker', 'name skills location profileImage phone verificationStatus')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Top skilled worker categories
    const popularCategories = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Repair', 'Appliance Repair', 'Cleaner', 'Mason'];

    res.render('customer/dashboard', {
      title: 'Customer Dashboard - Skilled Worker Hub',
      totalRequests,
      pendingRequests,
      activeRequests,
      completedRequests,
      recentRequests,
      popularCategories
    });
  } catch (err) {
    next(err);
  }
};

// Search workers by skill and location (queried from MongoDB)
const searchWorkers = async (req, res, next) => {
  try {
    const { skill, location, verified, sort } = req.query;

    const query = {
      role: 'worker',
      isActive: true
    };

    if (skill && skill.trim()) {
      query.skills = { $regex: new RegExp(skill.trim(), 'i') };
    }

    if (location && location.trim()) {
      const locRegex = new RegExp(location.trim(), 'i');
      query.$or = [{ location: locRegex }, { serviceArea: locRegex }];
    }

    if (verified === 'true') {
      query.verificationStatus = 'Verified';
    }

    let sortOption = { averageRating: -1, totalRatings: -1 };
    if (sort === 'experience') {
      sortOption = { experience: -1 };
    } else if (sort === 'rate_asc') {
      sortOption = { hourlyRate: 1 };
    } else if (sort === 'rate_desc') {
      sortOption = { hourlyRate: -1 };
    }

    const workers = await User.find(query).sort(sortOption);

    // List of standard skills for convenient filter pills
    const allSkills = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Repair', 'Appliance Repair', 'Cleaner', 'Mason'];

    res.render('customer/search', {
      title: 'Find Skilled Workers - Skilled Worker Hub',
      workers,
      selectedSkill: skill || '',
      selectedLocation: location || '',
      verifiedOnly: verified === 'true',
      selectedSort: sort || 'rating',
      allSkills,
      totalFound: workers.length
    });
  } catch (err) {
    next(err);
  }
};

// View detailed worker profile
const getWorkerProfile = async (req, res, next) => {
  try {
    const { workerId } = req.params;

    const worker = await User.findOne({ _id: workerId, role: 'worker' });
    if (!worker) {
      res.setFlash('error', 'Worker not found.');
      return res.redirect('/customer/search');
    }

    // Fetch ratings and reviews for this worker
    const reviews = await Rating.find({ worker: workerId })
      .populate('customer', 'name profileImage')
      .sort({ createdAt: -1 });

    res.render('customer/workerProfile', {
      title: `${worker.name} - Skilled Worker Profile`,
      worker,
      reviews
    });
  } catch (err) {
    next(err);
  }
};

// Render form to request a service
const getCreateRequest = async (req, res, next) => {
  try {
    const { workerId } = req.query;

    let selectedWorker = null;
    if (workerId) {
      selectedWorker = await User.findOne({ _id: workerId, role: 'worker', isActive: true });
    }

    // Also get list of verified workers for dropdown if workerId not specified
    const availableWorkers = await User.find({ role: 'worker', isActive: true }).select('name skills location hourlyRate verificationStatus');

    res.render('customer/createRequest', {
      title: 'Book a Service Request',
      selectedWorker,
      availableWorkers,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// Handle service request submission
const postCreateRequest = async (req, res, next) => {
  try {
    const { workerId, service, description, location, preferredDate, preferredTime } = req.body;

    if (!workerId || !service || !description || !location || !preferredDate) {
      const selectedWorker = await User.findOne({ _id: workerId, role: 'worker' });
      const availableWorkers = await User.find({ role: 'worker', isActive: true });
      return res.render('customer/createRequest', {
        title: 'Book a Service Request',
        selectedWorker,
        availableWorkers,
        error: 'Please fill in all required fields.'
      });
    }

    const worker = await User.findOne({ _id: workerId, role: 'worker', isActive: true });
    if (!worker) {
      res.setFlash('error', 'Selected worker is unavailable.');
      return res.redirect('/customer/search');
    }

    const newRequest = await ServiceRequest.create({
      customer: req.user._id,
      worker: workerId,
      service: service.trim(),
      description: description.trim(),
      location: location.trim(),
      preferredDate: new Date(preferredDate),
      preferredTime: preferredTime || 'Morning (09:00 - 12:00)',
      status: 'Pending'
    });

    res.setFlash('success', `Service request submitted successfully to ${worker.name}! Status is Pending.`);
    res.redirect(`/customer/requests/${newRequest._id}`);
  } catch (err) {
    next(err);
  }
};

// List all requests created by customer
const getMyRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { customer: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await ServiceRequest.find(query)
      .populate('worker', 'name skills phone location profileImage averageRating')
      .sort({ createdAt: -1 });

    res.render('customer/myRequests', {
      title: 'My Service Requests',
      requests,
      selectedStatus: status || 'all'
    });
  } catch (err) {
    next(err);
  }
};

// View single service request detail
const getRequestDetails = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await ServiceRequest.findOne({ _id: requestId, customer: req.user._id })
      .populate('worker', 'name phone skills location serviceArea verificationStatus averageRating totalRatings');

    if (!request) {
      res.setFlash('error', 'Service request not found or access denied.');
      return res.redirect('/customer/requests');
    }

    const rating = await Rating.findOne({ job: request._id });
    const complaint = await Complaint.findOne({ job: request._id, customer: req.user._id });

    res.render('customer/requestDetails', {
      title: `Job Details #${request._id.toString().slice(-6)}`,
      request,
      rating,
      complaint
    });
  } catch (err) {
    next(err);
  }
};

// Cancel a request (Customer can only cancel if still Pending)
const cancelRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await ServiceRequest.findOne({ _id: requestId, customer: req.user._id });
    if (!request) {
      res.setFlash('error', 'Request not found.');
      return res.redirect('/customer/requests');
    }

    if (request.status !== 'Pending') {
      res.setFlash('error', `Cannot cancel a request that is already ${request.status}.`);
      return res.redirect(`/customer/requests/${requestId}`);
    }

    request.status = 'Cancelled';
    await request.save();

    res.setFlash('success', 'Service request has been cancelled.');
    res.redirect(`/customer/requests/${requestId}`);
  } catch (err) {
    next(err);
  }
};

// Rate a completed job (form)
const getRateJob = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await ServiceRequest.findOne({ _id: requestId, customer: req.user._id })
      .populate('worker', 'name skills profileImage');

    if (!request) {
      res.setFlash('error', 'Job not found.');
      return res.redirect('/customer/requests');
    }

    if (request.status !== 'Completed') {
      res.setFlash('error', 'Only completed jobs can be rated.');
      return res.redirect(`/customer/requests/${requestId}`);
    }

    if (request.rated) {
      res.setFlash('error', 'This job has already been rated.');
      return res.redirect(`/customer/requests/${requestId}`);
    }

    res.render('customer/rateJob', {
      title: `Rate Service - ${request.worker.name}`,
      request,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// Submit rating
const postRateJob = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { rating, review } = req.body;

    const request = await ServiceRequest.findOne({ _id: requestId, customer: req.user._id });
    if (!request) {
      res.setFlash('error', 'Job not found.');
      return res.redirect('/customer/requests');
    }

    if (request.status !== 'Completed') {
      res.setFlash('error', 'Only completed jobs can be rated.');
      return res.redirect(`/customer/requests/${requestId}`);
    }

    if (request.rated) {
      res.setFlash('error', 'You have already rated this job.');
      return res.redirect(`/customer/requests/${requestId}`);
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.render('customer/rateJob', {
        title: 'Rate Service',
        request,
        error: 'Please select a valid rating between 1 and 5 stars.'
      });
    }

    // Create rating
    await Rating.create({
      customer: req.user._id,
      worker: request.worker,
      job: request._id,
      rating: numericRating,
      review: (review || '').trim()
    });

    // Mark job as rated
    request.rated = true;
    await request.save();

    res.setFlash('success', 'Thank you! Your rating and review have been recorded.');
    res.redirect(`/customer/requests/${requestId}`);
  } catch (err) {
    next(err);
  }
};

// File complaint on a job
const getFileComplaint = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await ServiceRequest.findOne({ _id: requestId, customer: req.user._id })
      .populate('worker', 'name');

    if (!request) {
      res.setFlash('error', 'Job not found.');
      return res.redirect('/customer/requests');
    }

    res.render('customer/fileComplaint', {
      title: `Report an Issue - Job #${request._id.toString().slice(-6)}`,
      request,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

// Submit complaint
const postFileComplaint = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { subject, description } = req.body;

    const request = await ServiceRequest.findOne({ _id: requestId, customer: req.user._id });
    if (!request) {
      res.setFlash('error', 'Job not found.');
      return res.redirect('/customer/requests');
    }

    if (!subject || !description) {
      return res.render('customer/fileComplaint', {
        title: 'Report an Issue',
        request,
        error: 'Subject and description are required.'
      });
    }

    await Complaint.create({
      customer: req.user._id,
      worker: request.worker,
      job: request._id,
      subject: subject.trim(),
      description: description.trim(),
      status: 'Open'
    });

    res.setFlash('success', 'Your complaint has been submitted to the Admin team. We will review it shortly.');
    res.redirect(`/customer/requests/${requestId}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  searchWorkers,
  getWorkerProfile,
  getCreateRequest,
  postCreateRequest,
  getMyRequests,
  getRequestDetails,
  cancelRequest,
  getRateJob,
  postRateJob,
  getFileComplaint,
  postFileComplaint
};
