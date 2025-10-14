const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/jobController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, createJob);
router.get('/', verifyToken, getAllJobs);
router.get('/search', verifyToken, searchJobs);
router.get('/search/location', verifyToken, searchJobsByLocation);
router.get('/fulltime', verifyToken, getFullTimeJobs);
router.get('/contract', verifyToken, getContractJobs);
router.get('/internship', verifyToken, getInternshipJobs);
router.get('/locum', verifyToken, getLocumJobs);
router.get('/:id', verifyToken, getJobById);
router.get('/:id/salary', verifyToken,  getJobSalary);
router.delete('/:id', verifyToken, deleteJob);

module.exports = router;