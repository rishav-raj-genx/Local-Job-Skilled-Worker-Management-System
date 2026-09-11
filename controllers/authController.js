const User = require('../models/User');
const { setAuthCookie } = require('../middleware/auth');

// Show login page
const getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login - Skilled Worker Hub',
    redirect: req.query.redirect || '',
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// Handle login POST
const postLogin = async (req, res, next) => {
  try {
    const { email, password, redirect } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Login - Skilled Worker Hub',
        error: 'Please provide both email and password.',
        redirect
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.render('auth/login', {
        title: 'Login - Skilled Worker Hub',
        error: 'Invalid email or password.',
        redirect
      });
    }

    if (!user.isActive) {
      return res.render('auth/login', {
        title: 'Login - Skilled Worker Hub',
        error: 'Your account has been deactivated. Please contact administrator.',
        redirect
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login - Skilled Worker Hub',
        error: 'Invalid email or password.',
        redirect
      });
    }

    // Set HTTP-only JWT cookie
    setAuthCookie(res, user);
    res.setFlash('success', `Welcome back, ${user.name}!`);

    // Redirect to safe target or role dashboard
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return res.redirect(redirect);
    }

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (user.role === 'worker') {
      return res.redirect('/worker/dashboard');
    } else {
      return res.redirect('/customer/dashboard');
    }
  } catch (err) {
    next(err);
  }
};

// Show registration page
const getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Register - Skilled Worker Hub',
    role: req.query.role || 'customer',
    error: req.query.error || null
  });
};

// Handle registration POST
const postRegister = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role, phone, location, skills, bio, experience, serviceArea } = req.body;

    // Validate role: users can only register as customer or worker (admin cannot be self-registered)
    const assignedRole = role === 'worker' ? 'worker' : 'customer';

    if (!name || !email || !password) {
      return res.render('auth/register', {
        title: 'Register - Skilled Worker Hub',
        error: 'Name, email, and password are required.',
        role: assignedRole,
        formData: req.body
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'Register - Skilled Worker Hub',
        error: 'Password must be at least 6 characters.',
        role: assignedRole,
        formData: req.body
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register - Skilled Worker Hub',
        error: 'Passwords do not match.',
        role: assignedRole,
        formData: req.body
      });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.render('auth/register', {
        title: 'Register - Skilled Worker Hub',
        error: 'An account with this email address already exists.',
        role: assignedRole,
        formData: req.body
      });
    }

    // Prepare worker details if applicable
    let parsedSkills = [];
    if (assignedRole === 'worker' && skills) {
      if (Array.isArray(skills)) {
        parsedSkills = skills.map((s) => s.trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed in pre-save hook
      phone: (phone || '').trim(),
      role: assignedRole,
      location: (location || 'New Delhi').trim(),
      ...(assignedRole === 'worker' && {
        skills: parsedSkills,
        bio: (bio || '').trim(),
        experience: Number(experience) || 1,
        serviceArea: (serviceArea || location || '').trim(),
        verificationStatus: 'Pending'
      })
    };

    const newUser = await User.create(userData);

    // Set auth cookie
    setAuthCookie(res, newUser);
    res.setFlash('success', `Welcome to Skilled Worker Hub, ${newUser.name}! Your account is ready.`);

    if (newUser.role === 'worker') {
      return res.redirect('/worker/dashboard');
    }
    return res.redirect('/customer/dashboard');
  } catch (err) {
    next(err);
  }
};

// Handle logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.clearCookie('flash_message');
  res.redirect('/auth/login?success=You+have+been+successfully+logged+out.');
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout
};
