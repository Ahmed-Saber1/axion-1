

module.exports = {
    createSchool: [
        {
            model: 'name',
            required: true
        }
    ],
    updateSchool: [
        {
            model: 'id',
            required: true
        },
        {
            model: 'name',
            required: true
        }
    ]
}


