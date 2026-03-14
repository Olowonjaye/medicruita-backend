const express = require('express');
const router = express.Router();
const { Project, Verification } = require('../models');

// List projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.json({ ok: true, projects });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'failed_to_list_projects', detail: String(err) });
  }
});

// Create project
router.post('/projects', async (req, res) => {
  try {
    const { title, description, startDate, endDate, createdBy } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'missing_title' });
    const p = await Project.create({ title, description, startDate, endDate, createdBy });
    res.json({ ok: true, project: p });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'failed_to_create_project', detail: String(err) });
  }
});

// Create verification task
router.post('/verification', async (req, res) => {
  try {
    const { projectId, type, assignedTo, scheduledAt, notes } = req.body || {};
    if (!projectId || !type) return res.status(400).json({ ok: false, error: 'missing_fields' });
    const v = await Verification.create({ projectId, type, assignedTo, scheduledAt, notes });
    res.json({ ok: true, verification: v });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'failed_to_create_verification', detail: String(err) });
  }
});

// List verifications for a project
router.get('/projects/:projectId/verifications', async (req, res) => {
  try {
    const { projectId } = req.params;
    const list = await Verification.findAll({ where: { projectId } });
    res.json({ ok: true, verifications: list });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'failed_to_list_verifications', detail: String(err) });
  }
});

module.exports = router;
