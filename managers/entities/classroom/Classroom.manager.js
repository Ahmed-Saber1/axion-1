const generateUniqueId = require('generate-unique-id');
const { classroomDto } = require('../../../dto/classroomDto');

module.exports = class Classroom { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels, mongoDB }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongoDB             = mongoDB
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.classroomsCollection   = "classrooms";
        this.httpExposed         = ['createClassroom', 'get=getClassrooms', 'get=getClassroom', 'patch=updateClassroom', 'delete=deleteClassroom',];
        this.idNotFoundError     = { errors : [{ label: "Missing Values", message : "Query id value is missing." }] }                   
    }

    async getClassrooms({query, user}){
           
        // Get Logic
        let classroomsResult = await this.mongoDB.getAllItems(user.role == "admin" ? {schoolId: user.schoolId} : {}, this.classroomsCollection, query, classroomDto);

        // Response
        return {
            ...classroomsResult
        };
    }

    async getClassroom({query, user}){
         
        // Validate id is sent in query
        if (!query.id) return this.idNotFoundError; 

        // Get Logic
        let classroomResult = await this.mongoDB.getItem(query.id, this.classroomsCollection, classroomDto);
        if (user.role == 'admin' && !classroomResult.errors) {
            if (user.schoolId != classroomResult.schoolId) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }

        // Response
        return {
            ...classroomResult
        };
    }

    async createClassroom({name, schoolId, user}){
        let classroom = {name, schoolId};
        
        // Data validation
        let result = await this.validators.classroom.createClassroom(classroom);
        if(result) return result;
        
        let isExistResult = await this.mongoDB.checkIfIdExists(classroom.schoolId, 'schools');
        if (!isExistResult.exists) return { errors : [{ label: "Not Found", message : "schoolId can't be found" }] }

        if (user.role == 'admin') {
            if (user.schoolId != classroom.schoolId) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }
           
        // Creation Logic
        classroom.id = generateUniqueId({ length: 15, useLetters: false });
        let classroomResult = await this.mongoDB.postItem(classroom, this.classroomsCollection, classroomDto);

        // Response
        return {
            classroom: classroomResult
        };
    }

    async updateClassroom({id, name, schoolId, user}){
        let classroom = {id, name, schoolId};
        
        // Data validation
        let result = await this.validators.classroom.updateClassroom(classroom);
        if(result) return result;

        let isExistResult = await this.mongoDB.checkIfIdExists(classroom.schoolId, 'schools');
        if (!isExistResult.exists) return { errors : [{ label: "Not Found", message : "schoolId can't be found" }] }

        if (user.role == 'admin') {
            if (user.schoolId != classroom.schoolId) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }
        
        // Update Logic
        let classroomResult = await this.mongoDB.patchItem(classroom.id, classroom, this.classroomsCollection, classroomDto);

        // Response
        return {
            classroom: classroomResult
        };
    }

    async deleteClassroom({query, user}){

        // Validate id is sent in query
        if (!query.id) return this.idNotFoundError; 

        let getClassroomResult = await this.mongoDB.getItem(query.id, this.classroomsCollection, classroomDto);
        if (user.role == 'admin' && !getClassroomResult.errors) {
            if (user.schoolId != getClassroomResult.schoolId) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }

        let studentsRelated = await this.mongoDB.getAllItems({classroomId: query.id}, "students", undefined, undefined);
        if (studentsRelated.length != 0) {
            let studentIds = studentsRelated.map(x => x.id);
            return { 
                errors : [{ 
                    label: "Conflict", 
                    message : "The request could not be completed due to a conflict with the current state of the target resource",
                    conflictedStudentsIds: `${studentIds}` 
                }] 
            }
        }

        // Delete Logic
        let classroomResult = await this.mongoDB.deleteItem(query.id, this.classroomsCollection, classroomDto);

        // Response
        return {
            ...classroomResult
        };
    }


}
