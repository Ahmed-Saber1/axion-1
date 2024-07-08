
const userDto = (user) => {
    return {
        id: user.id,
        userName: user.userName,
        password: user.password,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }
}; 

module.exports = { userDto };