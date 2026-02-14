const db = require('../config/database');

class Student {
  // Get school-wise student count
  static async getSchoolWiseCount(filters) {
    try {
      let query = `SELECT
          school_id,
          school_name,
          COUNT(student_id) AS cnt,
          school_logo
        FROM
          dice_students
        JOIN dice_student_class ON st_class_student_id = student_id
        JOIN dice_cluster ON dice_student_class.st_class_cluster_id = dice_cluster.cluster_id
        JOIN dice_school ON school_id = cluster_school
        JOIN dice_certification ON dice_cluster.cluster_certification = dice_certification.certification_id
        WHERE
          student_active = 0 
          AND st_class_type = 1 
          AND st_class_active = 0 
          AND cluster_active = 0 
          AND cluster_school IN (7,8,11,13,16)`;
      
      const params = [];
      
      if (filters.graduationYearIds && filters.graduationYearIds.length > 0) {
        query += ` AND cluster_graduation_year IN (?)`;
        params.push(filters.graduationYearIds);
      }
      if (filters.schoolId) {
        query += ` AND cluster_school = ?`;
        params.push(filters.schoolId);
      }
      if (filters.degreeId) {
        query += ` AND dice_cluster.cluster_certification = ?`;
        params.push(filters.degreeId);
      }
      if (filters.programAbbrId) {
        query += ` AND dice_cluster.cluster_degree = ?`;
        params.push(filters.programAbbrId);
      }
      
      query += ` AND student_academic_year_id = ?
        GROUP BY
          cluster_school, school_id, school_name, school_logo
        ORDER BY
          school_name`;
      
      params.push(filters.academicYearId);
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get program-wise count for a specific school
  static async getProgramWiseCount(schoolId, graduationYearIds, academicYearId) {
    try {
      let query = `SELECT
            dice_certification.certification_id as program_id,
            dice_certification.certification_name as program_name,
            dice_certification.certification_short_name as program_code,
            COUNT(student_id) AS cnt
        FROM
            dice_students
        JOIN dice_student_class ON st_class_student_id = student_id
        JOIN dice_cluster ON dice_student_class.st_class_cluster_id = dice_cluster.cluster_id
        JOIN dice_certification ON dice_cluster.cluster_certification = dice_certification.certification_id 
        JOIN dice_school ON school_id = cluster_school
        WHERE
          student_active = 0 
          AND st_class_type = 1 
          AND st_class_active = 0 
          AND cluster_active = 0
          AND cluster_school = ?`;
      
      const params = [schoolId];
      
      if (graduationYearIds && graduationYearIds.length > 0) {
        query += ` AND cluster_graduation_year IN (?)`;
        params.push(graduationYearIds);
      }
      
      query += ` AND student_academic_year_id = ?
        GROUP BY
          dice_certification.certification_id,
          dice_certification.certification_name,
          dice_certification.certification_short_name
        ORDER BY
          dice_certification.certification_name`;
      
      params.push(academicYearId);
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get cohort-wise count for a specific program
  static async getCohortWiseCount(schoolId, programId, graduationYearIds, academicYearId) {
    try {
      let query = `SELECT
          cluster_id,
          cluster_name,
          cluster_code,
          cluster_graduation_year as cluster_graduation_year_id,
          dice_graduation_year.graduation_year_name,
          COUNT(student_id) AS cnt
        FROM
          dice_students
        JOIN dice_student_class ON st_class_student_id = student_id
        JOIN dice_cluster ON dice_student_class.st_class_cluster_id = dice_cluster.cluster_id
        LEFT JOIN dice_graduation_year ON dice_cluster.cluster_graduation_year = dice_graduation_year.graduation_year_id
        WHERE
          student_active = 0 
          AND st_class_type = 1 
          AND st_class_active = 0 
          AND cluster_active = 0
          AND cluster_school = ?
          AND cluster_certification = ?`;
      
      const params = [schoolId, programId];
      
      if (graduationYearIds && graduationYearIds.length > 0) {
        query += ` AND cluster_graduation_year IN (?)`;
        params.push(graduationYearIds);
      }
      
      query += ` AND student_academic_year_id = ?
        GROUP BY
          cluster_id, cluster_name, cluster_code, cluster_graduation_year, dice_graduation_year.graduation_year_name
        ORDER BY
          cluster_name`;
      
      params.push(academicYearId);
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get class-wise count for a specific cohort
  static async getClassWiseCount(clusterId, academicYearId) {
    try {
      const [rows] = await db.query(
        `SELECT
          dice_class.class_id as st_class_id,
          dice_class.class_name as st_class_name,
          dice_class.class_code as st_class_code,
          dice_class.class_name as st_class_division,
          COUNT(student_id) AS cnt
        FROM
          dice_students
        JOIN dice_student_class ON st_class_student_id = student_id
        JOIN dice_class ON dice_class.class_id = dice_student_class.st_class_id
        WHERE
          student_active = 0 
          AND st_class_type = 1 
          AND st_class_active = 0 
          AND st_class_cluster_id = ? 
          AND student_academic_year_id = ?
        GROUP BY
          dice_class.class_id
        ORDER BY
          dice_class.class_name`,
        [clusterId, academicYearId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get student list for a specific class
  static async getStudentsByClass(classId, academicYearId) {
    try {
      const [rows] = await db.query(
        `SELECT
          student_id,
          concat(dice_students.student_first_name,' ',dice_students.student_last_name) as student_name,
          student_email,
          dice_students.student_roll_id as student_roll_number,
          dice_students.student_app_id as student_enrollment_number,
          student_mobile,
          dice_class.class_name as st_class_name,
          dice_class.class_code as st_class_division,
          cluster_name,
          dice_certification.certification_name AS program_name,
          school_name
        FROM
          dice_students
        JOIN dice_student_class ON st_class_student_id = student_id
        JOIN dice_class ON dice_class.class_id = dice_student_class.st_class_id 
        JOIN dice_cluster ON dice_student_class.st_class_cluster_id = dice_cluster.cluster_id
        JOIN dice_certification ON dice_cluster.cluster_certification = dice_certification.certification_id
        JOIN dice_school ON school_id = cluster_school
        WHERE
          student_active = 0 
          AND st_class_type = 1 
          AND st_class_active = 0
          AND st_class_id = ?
          AND student_academic_year_id = ?
        ORDER BY
          student_roll_number, student_name`,
        [classId, academicYearId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get dashboard summary
  static async getDashboardSummary(filters) {
    try {
      let query = `SELECT
          COUNT(DISTINCT student_id) AS total_students
        FROM
          dice_students
        JOIN dice_student_class ON st_class_student_id = student_id
        JOIN dice_cluster ON dice_student_class.st_class_cluster_id = dice_cluster.cluster_id
        JOIN dice_certification ON dice_cluster.cluster_certification = dice_certification.certification_id
        WHERE
          student_active = 0 
          AND st_class_type = 1 
          AND st_class_active = 0 
          AND cluster_active = 0
          AND cluster_school IN (7,8,11,13,16)`;
      
      const params = [];
      
      if (filters.graduationYearIds && filters.graduationYearIds.length > 0) {
        query += ` AND cluster_graduation_year IN (?)`;
        params.push(filters.graduationYearIds);
      }
      if (filters.schoolId) {
        query += ` AND cluster_school = ?`;
        params.push(filters.schoolId);
      }
      if (filters.degreeId) {
        query += ` AND dice_cluster.cluster_certification = ?`;
        params.push(filters.degreeId);
      }
      if (filters.programAbbrId) {
        query += ` AND dice_cluster.cluster_degree = ?`;
        params.push(filters.programAbbrId);
      }
      
      query += ` AND student_academic_year_id = ?`;
      params.push(filters.academicYearId);
      
      const [rows] = await db.query(query, params);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get available graduation years
  static async getGraduationYears() {
    try {
      const [rows] = await db.query(
        `SELECT 
          graduation_year_id,
          graduation_year_name,
          graduation_year_start_date,
          graduation_year_end_date
        FROM dice_graduation_year
        WHERE graduation_year_name >= 2026 
        ORDER BY graduation_year_name ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get available academic years
  static async getAcademicYears() {
    try {
      const [rows] = await db.query(
        `SELECT 
          academic_year_id, 
          academic_year_name, 
          academic_year_admission_name 
        FROM dice_academic_year 
        WHERE academic_year_id =9
        ORDER BY academic_year_id ASC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all schools for filter
  static async getAllSchools() {
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT
          school_id,
          school_name
        FROM dice_school
        WHERE school_id IN (7,8,11,13,16)
        ORDER BY school_name`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get programs for a school (for filter)
  static async getProgramsBySchool(schoolId) {
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT
          dice_certification.certification_id as program_id,
          dice_certification.certification_name as program_name
        FROM dice_cluster
        JOIN dice_certification ON dice_cluster.cluster_certification = dice_certification.certification_id
        WHERE cluster_school = ? AND cluster_active = 0
        ORDER BY dice_certification.certification_name`,
        [schoolId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get cohorts for a program (for filter)
  static async getCohortsByProgram(schoolId, programId) {
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT
          cluster_id,
          cluster_name
        FROM dice_cluster
        WHERE cluster_school = ? 
          AND cluster_certification = ? 
          AND cluster_active = 0 AND cluster_type = 1
        ORDER BY cluster_name`,
        [schoolId, programId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get classes for a cohort (for filter)
  static async getClassesByCohort(clusterId) {
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT
          dice_class.class_id,
          dice_class.class_name
        FROM dice_class
        JOIN dice_student_class ON dice_student_class.st_class_id = dice_class.class_id
        WHERE st_class_cluster_id = ? AND st_class_active = 0 AND class_type = 1
        ORDER BY dice_class.class_name`,
        [clusterId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all degrees (certifications) for filter
  static async getAllDegrees() {
    try {
      const [rows] = await db.query(
        `SELECT certification_id, certification_name, certification_short_name 
         FROM dice_certification 
         WHERE 1
         ORDER BY certification_name`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Search students globally by name, email, roll number, enrollment number, or mobile
  static async searchStudents(searchTerm, academicYearId, limit = 50) {
    try {
      const likeTerm = `%${searchTerm}%`;
      const [rows] = await db.query(
        `SELECT
          student_id,
          CONCAT(dice_students.student_first_name, ' ', dice_students.student_last_name) AS student_name,
          student_email,
          dice_students.student_roll_id AS student_roll_number,
          dice_students.student_app_id AS student_enrollment_number,
          student_mobile,
          dice_class.class_name AS st_class_name,
          dice_class.class_id AS st_class_id,
          cluster_name,
          cluster_id,
          dice_certification.certification_name AS program_name,
          school_name,
          school_id
        FROM
          dice_students
        JOIN dice_student_class ON st_class_student_id = student_id
        JOIN dice_class ON dice_class.class_id = dice_student_class.st_class_id
        JOIN dice_cluster ON dice_student_class.st_class_cluster_id = dice_cluster.cluster_id
        JOIN dice_certification ON dice_cluster.cluster_certification = dice_certification.certification_id
        JOIN dice_school ON school_id = cluster_school
        WHERE
          student_active = 0
          AND st_class_type = 1
          AND st_class_active = 0
          AND cluster_active = 0
          AND cluster_school IN (7,8,11,13,16)
          AND student_academic_year_id = ?
          AND (
            CONCAT(dice_students.student_first_name, ' ', dice_students.student_last_name) LIKE ?
            OR student_email LIKE ?
            OR dice_students.student_roll_id LIKE ?
            OR dice_students.student_app_id LIKE ?
            OR student_mobile LIKE ?
          )
        ORDER BY dice_students.student_first_name, dice_students.student_last_name
        LIMIT ?`,
        [academicYearId, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all programs (abbreviations) for filter
  static async getAllPrograms() {
    try {
      const [rows] = await db.query(
        `SELECT id, abbrivation FROM atlas_degree_abbrevation WHERE id IN (1,5,4,8,12,21,10) ORDER BY abbrivation`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Student;
