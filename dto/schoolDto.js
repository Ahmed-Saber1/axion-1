const schoolDto = (school) => {
    return {
        id: school.id,
        name: school.name,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt
    }
}; 

module.exports = { schoolDto };