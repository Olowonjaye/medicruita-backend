const { Op } = require('sequelize');
const {Job, User} = require('../models');

// Create a new job
const createJob = async (req, res) => {
    try {
        const { title, description, location, salary, employmentType, employmentLevel, organization } = req.body;

        // Basic validation
        if (!title || !description || !location || !employmentType || !employmentLevel || !organization) {
            return res.status(400).json({ message: 'Required fields missing.' });
        }

        const newJob = await Job.create({
            title,
            description,
            location,
            salary,
            employmentType,
            employmentLevel,
            organization,
            userId: req.user.id // Assuming req.user is set by authentication middleware
        });

        res.status(201).json({ message: 'Job created successfully!', job: newJob });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Job creation failed', error });
    }
};

// Get all jobs
const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            include: [{ model: User, attributes: ['id', 'fullName'] }] // Include user details
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch jobs', error });
    }
};
// search job by title
const searchJobs = async (req, res) => {
    const { title } = req.query;
    try {
        const jobs = await Job.findAll({
            where: {
                title: {
                    [Op.like]: `%${title}%`
                }
            },
            include: [{ model: User, attributes: ['id', 'fullName'] }] // Include user details
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to search jobs', error });
    }
};

//search job by location
const searchJobsByLocation = async (req, res) => {
    const { location } = req.query;
    try {
        const jobs = await Job.findAll({
            where: {
                location: {
                    [Op.like]: `%${location}%`
                }
            },
            include: [{ model: User, attributes: ['id', 'fullName'] }] // Include user details
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to search jobs by location', error });
    }
};

// Get all full-time jobs
const getFullTimeJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            where: { employmentType: 'full-time' },
            include: [{ model: User, attributes: ['id', 'fullName'] }] // Include user details
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch full-time jobs', error });
    }
};

// Get all contract jobs
const getContractJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            where: { employmentType: 'contract' },
            include: [{ model: User, attributes: ['id', 'fullName'] }] // Include user details
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch contract jobs', error });
    }
};

// Get all internship jobs
const getInternshipJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            where: { employmentType: 'internship' },
            include: [{ model: User, attributes: ['id', 'fullName'] }] // Include user details
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch internship jobs', error });
    }
};
// Get all locum jobs
const getLocumJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({
            where: { employmentType: 'locum' },
            include: [{ model: User, attributes: ['id', 'fullName'] }] // Include user details
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch locum jobs', error });
    }
};

// Get job details by ID
const getJobById = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await Job.findByPk(id, {
            include: [{ model: User, attributes: ['id', 'fullName'] }] // Include user details
        });
        if (!job) return res.status(404).json({ message: 'Job not found' });

        res.status(200).json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch job details', error });
    }
};

// Get job salary
const getJobSalary = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await Job.findByPk(id, {
            attributes: ['salary'] // Only fetch the salary field
        });
        if (!job) return res.status(404).json({ message: 'Job not found' });

        res.status(200).json({ salary: job.salary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch job salary', error });
    }
};

//update a job
const updateJob = async (req, res) => {
    const { id } = req.params;
    const { title, description, location, salary, employmentType, employmentLevel, organizations } = req.body;

    try {
        const job = await Job.findByPk(id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        // Update job details
        job.title = title || job.title;
        job.description = description || job.description;
        job.location = location || job.location;
        job.salary = salary || job.salary;
        job.employmentType = employmentType || job.employmentType;
        job.employmentLevel = employmentLevel || job.employmentLevel;
        job.organizations = organizations || job.organizations;

        await job.save();
        res.status(200).json({ message: 'Job updated successfully', job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update job', error });
    }
};

// delete a job
const deleteJob = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await Job.findByPk(id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        await job.destroy();
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete job', error });
    }
};

module.exports = {
    createJob,
    getAllJobs,
    searchJobs,
    searchJobsByLocation,
    getFullTimeJobs,
    getContractJobs,
    getInternshipJobs,
    getLocumJobs,
    getJobById,
    getJobSalary,
    deleteJob
}