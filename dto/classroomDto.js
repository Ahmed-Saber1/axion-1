const classroomDto = (classroom) => {
    return {
        id: classroom.id,
        name: classroom.name,
        schoolId: classroom.schoolId,
        createdAt: classroom.createdAt,
        updatedAt: classroom.updatedAt
    }
}; 

module.exports = { classroomDto };