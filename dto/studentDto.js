const studentDto = (student) => {
    return {
        id: student.id,
        name: student.name,
        email: student.email,
        phoneNumber: student.phoneNumber,
        classroomId: student.classroomId,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
    }
}; 

module.exports = { studentDto };