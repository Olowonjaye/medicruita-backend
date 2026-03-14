const express = require('express');
const router = express.Router();

// Simple in-memory list for demo; replace with DB-backed models in production
const courses = [
  { id: 'c1', title: 'Infection Control Basics', provider: 'Medicruita Academy', duration: '2 hrs', certified: true },
  { id: 'c2', title: 'Emergency Triage', provider: 'HealthTrain', duration: '3.5 hrs', certified: true },
  { id: 'c3', title: 'Patient Communication', provider: 'SoftSkills Co.', duration: '1.5 hrs', certified: true },
];

router.get('/courses', (req, res) => {
  res.json({ ok: true, courses, note: 'All courses include certification from accredited institutions where applicable.' });
});

router.post('/register', (req, res) => {
  const { name, email, organization } = req.body || {};
  if (!name || !email) return res.status(400).json({ ok: false, error: 'missing_name_or_email' });
  // In production persist registration and send confirmation email
  return res.json({ ok: true, message: 'registered', data: { name, email, organization } });
});

router.post('/pay', (req, res) => {
  const { amount, method, email } = req.body || {};
  if (!amount || !method) return res.status(400).json({ ok: false, error: 'missing_payment_fields' });
  // Payment processing should be integrated here (Paystack, Stripe, etc.)
  return res.json({ ok: true, message: 'payment_recorded', data: { amount, method, email } });
});

module.exports = router;
