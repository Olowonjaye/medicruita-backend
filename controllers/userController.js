const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User} = require('../models');

//Register endpoint
const register =  async (req, res) => {
    try {
      const {
        email,
        password,
        fullName,
        role,
        cader,
        licenseNum,
        organization,
        designation
      } = req.body;
  
      // Basic validation
      if (!email || !password || !fullName || !role) {
        return res.status(400).json({ message: 'Required fields missing.' });
      }
  
      if (!['healthworker', 'employee'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role.' });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = await User.create({
        email,
        password: hashedPassword,
        fullName,
        role,
        cader: role === 'healthworker' ? cader : null,
        licenseNum: role === 'healthworker' ? licenseNum : null,
        organization: role === 'employee' ? organization : null,
        designation: role === 'employee' ? designation : null
      });
  
      res.status(201).json({ message: 'User registered successfully!', user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Signup failed', error });
    }
  };
  

//Login endpoint
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

// return user details
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Exclude password from response
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user details', details: err.message });
  }
};

module.exports = {
  register,
  login,
  getUserDetails
};