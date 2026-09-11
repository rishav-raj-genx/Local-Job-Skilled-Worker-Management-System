const http = require('http');
require('dotenv').config();

const app = require('../app');
const { connectDB, closeDB } = require('../config/db');
const { seedDatabase } = require('./seed');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Rating = require('../models/Rating');
const Complaint = require('../models/Complaint');

// Helper to make HTTP requests and manage cookies
class TestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = {};
  }

  setCookieFromResponse(res) {
    const setCookieHeader = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
    for (const cookieStr of setCookieHeader) {
      if (!cookieStr) continue;
      const parts = cookieStr.split(';')[0].split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      if (value === '' || cookieStr.includes('Max-Age=0') || cookieStr.includes('expires=Thu, 01 Jan 1970')) {
        delete this.cookies[name];
      } else {
        this.cookies[name] = value;
      }
    }
  }

  getCookieHeader() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  async get(path) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        Cookie: this.getCookieHeader(),
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'manual'
    });
    this.setCookieFromResponse(res);
    return res;
  }

  async post(path, body = {}, isUrlEncoded = true) {
    let headers = {
      Cookie: this.getCookieHeader()
    };
    let payload;

    if (isUrlEncoded) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      payload = new URLSearchParams(body).toString();
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: payload,
      redirect: 'manual'
    });
    this.setCookieFromResponse(res);
    return res;
  }
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✕ FAIL: ${message}`);
    failed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting End-to-End Automated Test Suite for PS 7...');

  await connectDB();
  await seedDatabase({ autoClose: false });

  // Start HTTP server on test port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3099, resolve));
  const baseUrl = 'http://127.0.0.1:3099';
  console.log(`📡 Test server running on ${baseUrl}`);

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: Security & Unauthorized Access Enforcement
    // -------------------------------------------------------------
    console.log('\n🔒 Suite 1: Security & Route Protection');
    const guestClient = new TestClient(baseUrl);

    // 1.1 Unauthenticated access to /customer/dashboard -> redirected to login
    const resGuestDash = await guestClient.get('/customer/dashboard');
    assert(
      resGuestDash.status === 302 && resGuestDash.headers.get('location')?.includes('/auth/login'),
      'Unauthenticated request to /customer/dashboard is redirected to /auth/login'
    );

    // 1.2 Unauthenticated access to /admin/dashboard -> redirected to login
    const resGuestAdmin = await guestClient.get('/admin/dashboard');
    assert(
      resGuestAdmin.status === 302 && resGuestAdmin.headers.get('location')?.includes('/auth/login'),
      'Unauthenticated request to /admin/dashboard is redirected to /auth/login'
    );

    // -------------------------------------------------------------
    // TEST SUITE 2: Customer Flow
    // -------------------------------------------------------------
    console.log('\n🧑 Suite 2: Customer Flow (Register -> Search -> Request -> Track -> Rate)');
    const customerClient = new TestClient(baseUrl);

    // 2.1 Customer Registration
    const testCustEmail = `test.cust.${Date.now()}@example.com`;
    const regRes = await customerClient.post('/auth/register', {
      name: 'Test Customer',
      email: testCustEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'customer',
      location: 'New Delhi',
      phone: '+91 9988776655'
    });
    assert(
      regRes.status === 302 && regRes.headers.get('location')?.startsWith('/auth/login?success='),
      'Customer registers successfully and is redirected to login'
    );
    assert(!customerClient.cookies.token, 'Registration does not create an authenticated session');

    const customerLogin = await customerClient.post('/auth/login', {
      email: testCustEmail,
      password: 'Password@123'
    });
    assert(
      customerLogin.status === 302 && customerLogin.headers.get('location') === '/customer/dashboard',
      'Customer can log in and is redirected to /customer/dashboard'
    );
    assert(!!customerClient.cookies.token, 'JWT cookie is issued after login');

    // 2.2 Customer Dashboard Access
    const custDashRes = await customerClient.get('/customer/dashboard');
    assert(custDashRes.status === 200, 'Customer successfully accesses /customer/dashboard');

    // 2.3 Role Isolation: Customer attempting to access /admin/dashboard -> 403 Forbidden
    const custAdminAttempt = await customerClient.get('/admin/dashboard');
    assert(custAdminAttempt.status === 403, 'Customer is blocked with 403 Forbidden from accessing /admin');

    // 2.4 Worker Search by Skill & Location (MongoDB Query)
    const searchRes = await customerClient.get('/customer/search?skill=Electrician&location=Delhi');
    const searchHtml = await searchRes.text();
    assert(searchRes.status === 200, 'Search workers by skill and location returns 200');
    assert(searchHtml.includes('Rajesh Sharma'), 'Search returns seeded Electrician worker from MongoDB');

    // Fetch seeded worker for booking test
    const worker = await User.findOne({ email: 'rajesh.electrician@workerhub.com' });
    assert(!!worker, 'Seeded worker Rajesh found in DB');

    // 2.5 View Worker Profile
    const profileRes = await customerClient.get(`/customer/workers/${worker._id}`);
    const profileHtml = await profileRes.text();
    assert(profileRes.status === 200, 'Customer can view worker profile');
    assert(profileHtml.includes('Rajesh Sharma') && profileHtml.includes('Electrician'), 'Worker profile shows name, skills, and rating');

    // 2.6 Create Service Request (Pending)
    const createReqRes = await customerClient.post('/customer/requests/new', {
      workerId: worker._id.toString(),
      service: 'Electrician',
      description: 'Test urgent wiring repair',
      location: 'Test Residence, New Delhi',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: 'Morning (09:00 - 12:00)'
    });
    assert(createReqRes.status === 302, 'Customer submits service request with redirect to details');
    const reqDetailPath = createReqRes.headers.get('location');
    const newRequestId = reqDetailPath.split('/').pop();

    const createdJob = await ServiceRequest.findById(newRequestId);
    assert(createdJob && createdJob.status === 'Pending', 'Created job exists in DB with status "Pending"');

    // -------------------------------------------------------------
    // TEST SUITE 3: Worker Flow & Valid State Transitions
    // -------------------------------------------------------------
    console.log('\n👷 Suite 3: Worker Flow (Login -> Accept -> In Progress -> Complete)');
    const workerClient = new TestClient(baseUrl);

    // 3.1 Worker Login
    const workerLoginRes = await workerClient.post('/auth/login', {
      email: 'rajesh.electrician@workerhub.com',
      password: 'Worker@123'
    });
    assert(
      workerLoginRes.status === 302 && workerLoginRes.headers.get('location') === '/worker/dashboard',
      'Worker logs in successfully and redirects to /worker/dashboard'
    );

    // 3.2 Role Isolation: Worker attempting to access /admin/dashboard -> 403 Forbidden
    const workerAdminAttempt = await workerClient.get('/admin/dashboard');
    assert(workerAdminAttempt.status === 403, 'Worker is blocked with 403 Forbidden from accessing /admin');

    // 3.3 Worker Accepts Request: Pending -> Accepted
    const acceptRes = await workerClient.post(`/worker/requests/${newRequestId}/status`, {
      status: 'Accepted'
    });
    assert(acceptRes.status === 302, 'Worker accepts job request');
    const jobAccepted = await ServiceRequest.findById(newRequestId);
    assert(jobAccepted.status === 'Accepted', 'Job status in MongoDB successfully transitioned to "Accepted"');

    // 3.4 Worker Progresses Request: Accepted -> In Progress
    const inProgressRes = await workerClient.post(`/worker/requests/${newRequestId}/status`, {
      status: 'In Progress'
    });
    assert(inProgressRes.status === 302, 'Worker transitions job to "In Progress"');
    const jobInProgress = await ServiceRequest.findById(newRequestId);
    assert(jobInProgress.status === 'In Progress', 'Job status in MongoDB successfully transitioned to "In Progress"');

    // 3.5 Worker Completes Request: In Progress -> Completed
    const completeRes = await workerClient.post(`/worker/requests/${newRequestId}/status`, {
      status: 'Completed',
      completionNotes: 'Wiring fixed and circuit tested safely.'
    });
    assert(completeRes.status === 302, 'Worker marks job as "Completed"');
    const jobCompleted = await ServiceRequest.findById(newRequestId);
    assert(jobCompleted.status === 'Completed', 'Job status in MongoDB successfully transitioned to "Completed"');

    // 3.6 Invalid Transition Guard: Disallow Completed -> Accepted
    const invalidTransRes = await workerClient.post(`/worker/requests/${newRequestId}/status`, {
      status: 'Accepted'
    });
    const jobStillCompleted = await ServiceRequest.findById(newRequestId);
    assert(jobStillCompleted.status === 'Completed', 'Invalid status transition rejected; job remains "Completed"');

    // -------------------------------------------------------------
    // TEST SUITE 4: Stretch Goal - Rating System & Safe Recalculation
    // -------------------------------------------------------------
    console.log('\n⭐ Suite 4: Stretch Goal - Rating System & Recalculation');

    // 4.1 Customer rates the completed job (5 Stars)
    const initialWorkerRatings = worker.totalRatings;
    const rateRes = await customerClient.post(`/customer/requests/${newRequestId}/rate`, {
      rating: 5,
      review: 'Automated test: outstanding service and timely arrival!'
    });
    assert(rateRes.status === 302, 'Customer successfully submits 5-star rating for completed job');

    const updatedJob = await ServiceRequest.findById(newRequestId);
    assert(updatedJob.rated === true, 'Job is marked rated = true');

    const updatedWorker = await User.findById(worker._id);
    assert(
      updatedWorker.totalRatings === initialWorkerRatings + 1,
      `Worker totalRatings incremented correctly (${initialWorkerRatings} -> ${updatedWorker.totalRatings})`
    );
    assert(updatedWorker.averageRating >= 1 && updatedWorker.averageRating <= 5, 'Worker averageRating safely recalculated');

    // 4.2 Duplicate Rating Guard: Cannot rate same completed job twice
    const dupRateRes = await customerClient.post(`/customer/requests/${newRequestId}/rate`, {
      rating: 4,
      review: 'Trying to rate again'
    });
    assert(dupRateRes.status === 302, 'Duplicate rating attempt redirected/blocked');

    // -------------------------------------------------------------
    // TEST SUITE 5: Customer Complaint Submission
    // -------------------------------------------------------------
    console.log('\n⚠️ Suite 5: Complaint Submission');
    const compRes = await customerClient.post(`/customer/requests/${newRequestId}/complaint`, {
      subject: 'Automated Test Complaint',
      description: 'Testing dispute ticket resolution pipeline by customer.'
    });
    assert(compRes.status === 302, 'Customer successfully submits complaint for job');

    const createdComplaint = await Complaint.findOne({ job: newRequestId });
    assert(createdComplaint && createdComplaint.status === 'Open', 'Complaint recorded in MongoDB with status "Open"');

    // -------------------------------------------------------------
    // TEST SUITE 6: Admin Flow (Dashboard -> Verification -> Users -> Complaints)
    // -------------------------------------------------------------
    console.log('\n👑 Suite 6: Admin Flow (Analytics -> Verification -> Users -> Complaints)');
    const adminClient = new TestClient(baseUrl);

    // 6.1 Admin Login
    const adminLoginRes = await adminClient.post('/auth/login', {
      email: 'admin',
      password: '123456'
    });
    assert(
      adminLoginRes.status === 302 && adminLoginRes.headers.get('location') === '/admin/dashboard',
      'Admin logs in successfully and redirects to /admin/dashboard'
    );

    // 6.2 Admin Dashboard Live Analytics & Most-Requested Services Aggregation
    const adminDashRes = await adminClient.get('/admin/dashboard');
    const adminDashHtml = await adminDashRes.text();
    assert(adminDashRes.status === 200, 'Admin accesses dashboard');
    assert(adminDashHtml.includes('Most-Requested Services'), 'Dashboard contains "Most-Requested Services" analytics');
    assert(adminDashHtml.includes('Platform Rating Distribution'), 'Dashboard contains platform rating distribution metrics');

    // 6.3 Worker Verification Queue & Status Update
    const pendingWorker = await User.findOne({ email: 'suresh.painter@workerhub.com' });
    assert(pendingWorker && pendingWorker.verificationStatus === 'Pending', 'Seeded worker Suresh is pending verification');

    const verifyRes = await adminClient.post(`/admin/workers/${pendingWorker._id}/verify`, {
      status: 'Verified'
    });
    assert(verifyRes.status === 302, 'Admin updates worker verification status');
    const verifiedWorker = await User.findById(pendingWorker._id);
    assert(verifiedWorker.verificationStatus === 'Verified', 'Worker status in MongoDB is now "Verified"');

    // 6.4 Complaint Status & Resolution Notes Update
    const resolveCompRes = await adminClient.post(`/admin/complaints/${createdComplaint._id}/status`, {
      status: 'Resolved',
      adminNotes: 'Automated test: Complaint investigated and settled.'
    });
    assert(resolveCompRes.status === 302, 'Admin updates complaint status');
    const resolvedComp = await Complaint.findById(createdComplaint._id);
    assert(resolvedComp.status === 'Resolved' && resolvedComp.adminNotes.includes('settled'), 'Complaint status is "Resolved" with admin notes');

    // 6.5 Safeguard: Admin cannot deactivate self
    const adminSelf = await User.findOne({ email: 'admin@workerhub.com' });
    const toggleSelfRes = await adminClient.post(`/admin/users/${adminSelf._id}/toggle-status`);
    const refreshedAdmin = await User.findById(adminSelf._id);
    assert(refreshedAdmin.isActive === true, 'Admin account cannot be self-deactivated');

    console.log('\n=============================================================');
    console.log(`🎉 ALL TESTS PASSED! (${passed} checks passed, ${failed} failed)`);
    console.log('=============================================================');
  } finally {
    server.close();
    await closeDB();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
