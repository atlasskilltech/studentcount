const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Helper to extract filters from query
function getFilters(query) {
  return {
    graduationYearIds: query.graduation_year_ids ? query.graduation_year_ids.split(',').map(Number) : [],
    academicYearId: query.academic_year_id || 9,
    schoolId: query.school_id || null,
    degreeId: query.degree_id || null,
    programAbbrId: query.program_abbr_id || null,
  };
}

// Get dashboard summary (total students only)
router.get('/summary', async (req, res) => {
  try {
    const filters = getFilters(req.query);
    const summary = await Student.getDashboardSummary(filters);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get school-wise counts
router.get('/schools', async (req, res) => {
  try {
    const filters = getFilters(req.query);
    const schools = await Student.getSchoolWiseCount(filters);
    res.json({ success: true, data: schools });
  } catch (error) {
    console.error('Schools error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get program-wise counts for a school
router.get('/programs/:schoolId', async (req, res) => {
  try {
    const { graduation_year_ids, academic_year_id } = req.query;
    const gradYears = graduation_year_ids ? graduation_year_ids.split(',').map(Number) : [];
    const academicYearId = academic_year_id || 9;
    const programs = await Student.getProgramWiseCount(req.params.schoolId, gradYears, academicYearId);
    res.json({ success: true, data: programs });
  } catch (error) {
    console.error('Programs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get cohort-wise counts for a program
router.get('/cohorts/:schoolId/:programId', async (req, res) => {
  try {
    const { graduation_year_ids, academic_year_id } = req.query;
    const gradYears = graduation_year_ids ? graduation_year_ids.split(',').map(Number) : [];
    const academicYearId = academic_year_id || 9;
    const cohorts = await Student.getCohortWiseCount(
      req.params.schoolId, req.params.programId, gradYears, academicYearId
    );
    res.json({ success: true, data: cohorts });
  } catch (error) {
    console.error('Cohorts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get class-wise counts for a cohort
router.get('/classes/:clusterId', async (req, res) => {
  try {
    const { academic_year_id } = req.query;
    const academicYearId = academic_year_id || 9;
    const classes = await Student.getClassWiseCount(req.params.clusterId, academicYearId);
    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('Classes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get students for a class
router.get('/students/:classId', async (req, res) => {
  try {
    const { academic_year_id } = req.query;
    const academicYearId = academic_year_id || 9;
    const students = await Student.getStudentsByClass(req.params.classId, academicYearId);
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search students globally
router.get('/search/students', async (req, res) => {
  try {
    const { q, academic_year_id, limit } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }
    const academicYearId = academic_year_id || 9;
    const maxResults = Math.min(parseInt(limit) || 50, 100);
    const students = await Student.searchStudents(q.trim(), academicYearId, maxResults);
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Filter endpoints ──

router.get('/filters/academic-years', async (req, res) => {
  try {
    const data = await Student.getAcademicYears();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/filters/graduation-years', async (req, res) => {
  try {
    const data = await Student.getGraduationYears();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/filters/schools', async (req, res) => {
  try {
    const data = await Student.getAllSchools();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/filters/degrees', async (req, res) => {
  try {
    const data = await Student.getAllDegrees();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/filters/programs', async (req, res) => {
  try {
    const data = await Student.getAllPrograms();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/filters/programs/:schoolId', async (req, res) => {
  try {
    const data = await Student.getProgramsBySchool(req.params.schoolId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/filters/cohorts/:schoolId/:programId', async (req, res) => {
  try {
    const data = await Student.getCohortsByProgram(req.params.schoolId, req.params.programId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/filters/classes/:clusterId', async (req, res) => {
  try {
    const data = await Student.getClassesByCohort(req.params.clusterId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
