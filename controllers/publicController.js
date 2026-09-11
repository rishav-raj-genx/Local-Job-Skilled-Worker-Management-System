const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

// Public landing homepage
const getHome = async (req, res, next) => {
  try {
    // Featured verified workers
    const featuredWorkers = await User.find({
      role: 'worker',
      isActive: true,
      verificationStatus: 'Verified'
    })
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(6);

    // Platform live metrics
    const [completedJobsCount, activeWorkersCount, verifiedCount] = await Promise.all([
      ServiceRequest.countDocuments({ status: 'Completed' }),
      User.countDocuments({ role: 'worker', isActive: true }),
      User.countDocuments({ role: 'worker', verificationStatus: 'Verified' })
    ]);

    const categories = [
      { name: 'Electrician', icon: 'zap', desc: 'Wiring, switches, fuse repair & installations' },
      { name: 'Plumber', icon: 'droplet', desc: 'Pipes, leakage, tap fixing & bathroom fittings' },
      { name: 'Carpenter', icon: 'tool', desc: 'Furniture repair, doors, cabinets & woodwork' },
      { name: 'Painter', icon: 'brush', desc: 'Interior & exterior wall painting & touchups' },
      { name: 'AC Repair', icon: 'wind', desc: 'AC servicing, gas charging & cooling repair' },
      { name: 'Appliance Repair', icon: 'cpu', desc: 'Washing machines, microwaves & refrigerators' },
      { name: 'Cleaner', icon: 'sparkles', desc: 'Deep home cleaning, sofa & kitchen sanitization' },
      { name: 'Mason', icon: 'layers', desc: 'Tile setting, plastering & brickwork repairs' }
    ];

    res.render('public/home', {
      title: 'Skilled Worker Hub - On-Demand Local Professionals',
      featuredWorkers,
      categories,
      metrics: {
        completedJobs: completedJobsCount,
        activeWorkers: activeWorkersCount,
        verifiedWorkers: verifiedCount
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHome
};
