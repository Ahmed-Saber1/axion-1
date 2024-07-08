const generateUniqueId = require('generate-unique-id');
const { studentDto } = require('../../../dto/studentDto');
const { classroomDto } = require('../../../dto/classroomDto');

module.exports = class Student { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels, mongoDB }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongoDB             = mongoDB
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.studentsCollection   = "students";
        this.httpExposed         = ['createStudent', 'get=getStudents', 'get=getStudent', 'patch=updateStudent', 'delete=deleteStudent',];
        this.idNotFoundError     = { errors : [{ label: "Missing Values", message : "Query id value is missing." }] }                   
    }

    async getStudents({query, user}){
           
        // Get Logic
        let classroomsResult = [];
        if (user.role == "admin") {
            let classrooms = await this.mongoDB.getAllItems({schoolId: user.schoolId}, "classrooms", undefined, classroomDto);
            var classroomIds = classrooms.map(x => x.id);     
        }
        classroomsResult = await this.mongoDB.getAllItems(user.role == "admin" ? {classroomId: {$in : classroomIds}} : {}, this.studentsCollection, query, studentDto);

        // Response
        return {
            ...classroomsResult
        };
    }

    async getStudent({query, user}){
         
        // Validate id is sent in query
        if (!query.id) return this.idNotFoundError; 

        // Get Logic
        let studentResult = await this.mongoDB.getItem(query.id, this.studentsCollection, studentDto);
        if (user.role == 'admin' && !studentResult.errors) {
            let classroomResult = await this.mongoDB.getItem(studentResult.classroomId, "classrooms", classroomDto);
            if (user.schoolId != classroomResult.schoolId) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }

        // Response
        return {
            ...studentResult
        };
    }

    async createStudent({name, email, phoneNumber, classroomId, user}){
        let student = {name, email, phoneNumber, classroomId};
        
        // Data validation
        let result = await this.validators.student.createStudent(student);
        if(result) return result;
        
        let isExistResult = await this.mongoDB.checkIfIdExists(student.classroomId, 'classrooms');
        if (!isExistResult.exists) return { errors : [{ label: "Not Found", message : "classroomId can't be found" }] }

        if (user.role == 'admin') {
            let classroomResult = await this.mongoDB.getItem(student.classroomId, "classrooms", classroomDto);
            if (user.schoolId != classroomResult.schoolId) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }
           
        // Creation Logic
        student.id = generateUniqueId({ length: 15, useLetters: false });
        let studentResult = await this.mongoDB.postItem(student, this.studentsCollection, studentDto);

        // Response
        return {
            student: studentResult
        };
    }

    async updateStudent({id, name, email, phoneNumber, classroomId, user}){
        let student = {id, name, email, phoneNumber, classroomId};
        
        // Data validation
        let result = await this.validators.student.updateStudent(student);
        if(result) return result;

        let isExistResult = await this.mongoDB.checkIfIdExists(student.classroomId, 'classrooms');
        if (!isExistResult.exists) return { errors : [{ label: "Not Found", message : "classroomId can't be found" }] }

        if (user.role == 'admin') {
            let classroomResult = await this.mongoDB.getItem(student.classroomId, "classrooms", classroomDto);
            if (user.schoolId != classroomResult.schoolId) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }
        
        // Update Logic
        let studentResult = await this.mongoDB.patchItem(student.id, student, this.studentsCollection, studentDto);

        // Response
        return {
            student: studentResult
        };
    }

    async deleteStudent({query, user}){

        // Validate id is sent in query
        if (!query.id) return this.idNotFoundError; 

        let getStudentResult = await this.mongoDB.getItem(query.id, this.studentsCollection, studentDto);
        if (getStudentResult.errors) return getStudentResult;

        let getClassroomResult = await this.mongoDB.getItem(getStudentResult.classroomId, "classrooms", classroomDto);
        if (user.role == 'admin' && !getClassroomResult.errors) {
            if (user.schoolId != getClassroomResult.schoolId) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }

        // Delete Logic
        let studentResult = await this.mongoDB.deleteItem(query.id, this.studentsCollection, studentDto);

        // Response
        return {
            ...studentResult
        };
    }


}
