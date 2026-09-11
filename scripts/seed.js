const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { connectDB, closeDB } = require('../config/db');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Rating = require('../models/Rating');
const Complaint = require('../models/Complaint');

async function seedDatabase({ autoClose = false } = {}) {
  console.log('🌱 Starting database seed script...');

  try {
    await connectDB();

    // Clean existing records
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Rating.deleteMany({}),
      Complaint.deleteMany({})
    ]);

    console.log('👤 Creating users (Admin, Workers, Customers)...');
    const adminPassword = 'Admin@123';
    const workerPassword = 'Worker@123';
    const customerPassword = 'Customer@123';

    // 1. Admin
    const admin = await User.create({
      name: 'Platform Admin',
      email: 'admin@workerhub.com',
      password: adminPassword,
      phone: '+91 99999 00001',
      role: 'admin',
      location: 'New Delhi',
      isActive: true
    });

    // 2. Workers
    const worker1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'rajesh.electrician@workerhub.com',
      password: workerPassword,
      phone: '+91 98111 22334',
      role: 'worker',
      location: 'New Delhi',
      serviceArea: 'South Delhi, Central Delhi, Noida',
      skills: ['Electrician', 'AC Repair', 'Appliance Repair'],
      experience: 7,
      hourlyRate: 350,
      bio: 'Certified electrical technician with 7+ years of experience in residential wiring, inverter/battery setups, and circuit safety.',
      verificationStatus: 'Verified',
      isActive: true
    });

    const worker2 = await User.create({
      name: 'Mohit Verma',
      email: 'mohit.plumber@workerhub.com',
      password: workerPassword,
      phone: '+91 98222 33445',
      role: 'worker',
      location: 'Noida',
      serviceArea: 'Noida Sector 1-120, Greater Noida',
      skills: ['Plumber', 'Cleaner'],
      experience: 5,
      hourlyRate: 300,
      bio: 'Specialist in modern CPVC/GI plumbing fixtures, motor installations, pressure pumps, and leakage diagnostics.',
      verificationStatus: 'Verified',
      isActive: true
    });

    const worker3 = await User.create({
      name: 'Anil Kumar',
      email: 'anil.carpenter@workerhub.com',
      password: workerPassword,
      phone: '+91 98333 44556',
      role: 'worker',
      location: 'Gurgaon',
      serviceArea: 'DLF Phase 1-5, Golf Course Rd, Cyber City',
      skills: ['Carpenter', 'Painter'],
      experience: 8,
      hourlyRate: 400,
      bio: 'Master carpenter specializing in modular kitchen fittings, custom wardrobes, door hinge alignment, and wood polishing.',
      verificationStatus: 'Verified',
      isActive: true
    });

    const worker4 = await User.create({
      name: 'Suresh Gupta',
      email: 'suresh.painter@workerhub.com',
      password: workerPassword,
      phone: '+91 98444 55667',
      role: 'worker',
      location: 'Ghaziabad',
      serviceArea: 'Indirapuram, Vaishali, Vasundhara',
      skills: ['Painter', 'Mason'],
      experience: 4,
      hourlyRate: 280,
      bio: 'Interior and exterior emulsion painting, texture designs, waterproof damp proofing, and tile re-grouting.',
      verificationStatus: 'Pending', // Pending admin verification
      isActive: true
    });

    const worker5 = await User.create({
      name: 'Vikram Singh',
      email: 'vikram.technician@workerhub.com',
      password: workerPassword,
      phone: '+91 98555 66778',
      role: 'worker',
      location: 'New Delhi',
      serviceArea: 'West Delhi, Dwarka, Janakpuri',
      skills: ['AC Repair', 'Appliance Repair'],
      experience: 6,
      hourlyRate: 320,
      bio: 'Inverter AC diagnostics, PCB repairs, copper pipe soldering, and refrigerator compressor maintenance.',
      verificationStatus: 'Pending', // Pending admin verification
      isActive: true
    });

    // 3. Customers
    const customer1 = await User.create({
      name: 'Amit Sharma',
      email: 'amit.sharma@gmail.com',
      password: customerPassword,
      phone: '+91 97111 88990',
      role: 'customer',
      location: 'New Delhi',
      isActive: true
    });

    const customer2 = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@gmail.com',
      password: customerPassword,
      phone: '+91 97222 77889',
      role: 'customer',
      location: 'Noida',
      isActive: true
    });

    const customer3 = await User.create({
      name: 'Rohit Kapoor',
      email: 'rohit.kapoor@gmail.com',
      password: customerPassword,
      phone: '+91 97333 66778',
      role: 'customer',
      location: 'Gurgaon',
      isActive: true
    });

    console.log('📋 Creating realistic service requests with lifecycle states...');
    // Request 1: Completed & Rated
    const req1 = await ServiceRequest.create({
      customer: customer1._id,
      worker: worker1._id,
      service: 'Electrician',
      description: 'Main MCB circuit breaker tripping frequently when running geyser and microwave together.',
      location: 'Flat 402, Royale Apts, Saket, New Delhi',
      preferredDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      preferredTime: 'Morning (09:00 - 12:00)',
      status: 'Completed',
      rated: true,
      completionNotes: 'Identified neutral load imbalance. Re-distributed phases and replaced worn 32A DP isolator.'
    });

    // Request 2: Completed & Rated
    const req2 = await ServiceRequest.create({
      customer: customer2._id,
      worker: worker2._id,
      service: 'Plumber',
      description: 'Under-counter kitchen sink pipe leaking water into bottom cabinets.',
      location: 'Tower 4, Sector 78, Noida',
      preferredDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      preferredTime: 'Afternoon (12:00 - 15:00)',
      status: 'Completed',
      rated: true,
      completionNotes: 'Replaced cracked PVC bottle trap and resealed Teflon pipe connections.'
    });

    // Request 3: In Progress
    const req3 = await ServiceRequest.create({
      customer: customer3._id,
      worker: worker3._id,
      service: 'Carpenter',
      description: 'Custom study bookshelf and ergonomic desk assembly with cable management channel.',
      location: 'Villa 12, Nirvana Country, Sector 50, Gurgaon',
      preferredDate: new Date(),
      preferredTime: 'Morning (09:00 - 12:00)',
      status: 'In Progress'
    });

    // Request 4: Accepted
    const req4 = await ServiceRequest.create({
      customer: customer1._id,
      worker: worker2._id,
      service: 'Plumber',
      description: 'Automated water tank overflow sensor installation and motor switch wiring.',
      location: 'Saket, New Delhi',
      preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      preferredTime: 'Morning (09:00 - 12:00)',
      status: 'Accepted'
    });

    // Request 5: Pending
    const req5 = await ServiceRequest.create({
      customer: customer2._id,
      worker: worker1._id,
      service: 'AC Repair',
      description: 'Split AC in master bedroom not cooling effectively, suspected refrigerant leak.',
      location: 'Sector 78, Noida',
      preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      preferredTime: 'Evening (15:00 - 18:00)',
      status: 'Pending'
    });

    // Request 6: Pending
    const req6 = await ServiceRequest.create({
      customer: customer3._id,
      worker: worker5._id,
      service: 'Appliance Repair',
      description: 'Front-load washing machine showing error E20 during drainage cycle.',
      location: 'Nirvana Country, Gurgaon',
      preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      preferredTime: 'Morning (09:00 - 12:00)',
      status: 'Pending'
    });

    console.log('⭐ Creating verified ratings and reviews...');
    // Rating 1
    const rate1 = await Rating.create({
      customer: customer1._id,
      worker: worker1._id,
      job: req1._id,
      rating: 5,
      review: 'Rajesh is an exceptional electrician! Punctual, brought professional diagnostic meters, and resolved the tripping issue cleanly in under 45 minutes. Highly recommended.'
    });

    // Rating 2
    const rate2 = await Rating.create({
      customer: customer2._id,
      worker: worker2._id,
      job: req2._id,
      rating: 4,
      review: 'Mohit arrived on time and repaired the pipe leak efficiently. Did a neat job with minimal mess.'
    });

    // Manually trigger recalculation to ensure worker stats are up to date
    await Rating.recalculateWorkerRating(worker1._id);
    await Rating.recalculateWorkerRating(worker2._id);

    console.log('⚠️ Creating complaints for admin monitoring...');
    await Complaint.create({
      customer: customer3._id,
      worker: worker4._id,
      subject: 'Worker did not arrive for appointment',
      description: 'I booked a painter session for Saturday morning. The worker did not show up and phone calls went unanswered without prior cancellation.',
      status: 'Open'
    });

    await Complaint.create({
      customer: customer2._id,
      worker: worker3._id,
      job: req3._id,
      subject: 'Tool marks left on wooden floor during assembly',
      description: 'The carpentry assembly was good, but heavy toolboxes caused small surface scuffs on the wooden floor.',
      status: 'Under Review',
      adminNotes: 'Admin called worker. Worker offered to do free buffing and touch-up this weekend.'
    });

    console.log('===========================================================');
    console.log('✅ Database seeded successfully!');
    console.log('===========================================================');
    console.log('🔐 DEMO CREDENTIALS:');
    console.log('👑 Admin:');
    console.log('   Email:    admin@workerhub.com');
    console.log('   Password: Admin@123');
    console.log('-----------------------------------------------------------');
    console.log('👷 Workers:');
    console.log('   Rajesh (Electrician, Verified):   rajesh.electrician@workerhub.com / Worker@123');
    console.log('   Mohit (Plumber, Verified):        mohit.plumber@workerhub.com / Worker@123');
    console.log('   Suresh (Painter, Pending):        suresh.painter@workerhub.com / Worker@123');
    console.log('-----------------------------------------------------------');
    console.log('🧑 Customers:');
    console.log('   Amit Sharma:  amit.sharma@gmail.com / Customer@123');
    console.log('   Priya Patel:  priya.patel@gmail.com / Customer@123');
    console.log('   Rohit Kapoor: rohit.kapoor@gmail.com / Customer@123');
    console.log('===========================================================');

    if (autoClose) {
      await closeDB();
      process.exit(0);
    }
    return true;
  } catch (err) {
    console.error('❌ Seeding error:', err);
    if (autoClose) {
      process.exit(1);
    }
    throw err;
  }
}

if (require.main === module) {
  seedDatabase({ autoClose: true });
}

module.exports = { seedDatabase };
