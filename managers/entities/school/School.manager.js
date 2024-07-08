const generateUniqueId = require('generate-unique-id');
const { schoolDto } = require('../../../dto/schoolDto');

module.exports = class School { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels, mongoDB }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongoDB             = mongoDB
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.schoolsCollection   = "schools";
        this.httpExposed         = ['createSchool', 'get=getSchools', 'get=getSchool', 'patch=updateSchool', 'delete=deleteSchool',];
        this.idNotFoundError     = { errors : [{ label: "Missing Values", message : "Query id value is missing." }] }                   
    }

    async getSchools({query, user}){
           
        // Get Logic
        let schoolsResult = await this.mongoDB.getAllItems(user.role == "admin" ? {id: user.schoolId} : {}, this.schoolsCollection, query, schoolDto);

        // Response
        return {
            ...schoolsResult
        };
    }

    async getSchool({query, user}){
         
        // Validate id is sent in query
        if (!query.id) return this.idNotFoundError; 
        if (user.role == 'admin') {
            if (user.schoolId != query.id) return { errors : [{ label: "Unauthorized", message : "User not an admin of this school" }] }
        }

        // Get Logic
        let schoolsResult = await this.mongoDB.getItem(query.id, this.schoolsCollection, schoolDto);

        // Response
        return {
            ...schoolsResult
        };
    }

    async createSchool({name}){
        let school = {name};
        
        // Data validation
        let result = await this.validators.school.createSchool(school);
        if(result) return result;
           
        // Creation Logic
        school.id = generateUniqueId({ length: 15, useLetters: false });
        let schoolResult = await this.mongoDB.postItem(school, this.schoolsCollection, schoolDto);

        // Response
        return {
            school: schoolResult
        };
    }

    async updateSchool({id, name}){
        let school = {id, name};
        
        // Data validation
        let result = await this.validators.school.updateSchool(school);
        if(result) return result;
           
        // Update Logic
        let schoolResult = await this.mongoDB.patchItem(school.id, school, this.schoolsCollection, schoolDto);

        // Response
        return {
            school: schoolResult
        };
    }

    async deleteSchool({query}){

        // Validation
        if (!query.id) return this.idNotFoundError; 
        let classroomsRelated = await this.mongoDB.getAllItems({schoolId: query.id}, "classrooms", undefined, undefined);
        if (classroomsRelated.errors) return classroomsRelated;
        else if (classroomsRelated.length != 0) {
            let classroomsIds = classroomsRelated.map(x => x.id);
            return { 
                errors : [{ 
                    label: "Conflict", 
                    message : "The request could not be completed due to a conflict with the current state of the target resource",
                    conflictedClassroomsIds: `${classroomsIds}` 
                }] 
            }
        }

        // Delete Logic
        let schoolsResult = await this.mongoDB.deleteItem(query.id, this.schoolsCollection, schoolDto);

        // Response
        return {
            ...schoolsResult
        };
    }


}
