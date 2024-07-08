const { update } = require("lodash");
const generateUniqueId = require('generate-unique-id');
const bcrypt = require('bcrypt');
const { userDto } = require('../../../dto/userDto');

module.exports = class User { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels, mongoDB }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongoDB             = mongoDB
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.usersCollection     = "users";
        //this.userExposed         = ['createUser'];
        this.httpExposed         = ['createUser', 'get=getToken'];
        this.logInError          = { errors : [{ label: "Unauthorized", message : "Username or password is not matching." }] }                   
    }

    async createUser({userName, email, password, role, schoolId}){
        let user = {userName, email, password, role, schoolId};
        
        // Data validation
        let result = await this.validators.user.createUser(user);
        if(result) return result;
        if (user.role == 'admin') {
            if (!user.schoolId) return { errors : [{ label: "required", message : "schoolId is required if role is admin" }] }
            else {
                let isExistResult = await this.mongoDB.checkIfIdExists(user.schoolId, 'schools');
                if (!isExistResult.exists) return { errors : [{ label: "Not Found", message : "schoolId can't be found" }] }
            }
        }
           
        // Creation Logic
        user.id = generateUniqueId({ length: 15, useLetters: false });
        const hashedPassword = bcrypt.hashSync(password, 10);
        user.password  = hashedPassword;
        let userResult = await this.mongoDB.postItem(user, this.usersCollection, userDto);
        let longToken  = this.tokenManager.genLongToken({ user: userResult });
        delete userResult.password;

        // Response
        return {
            user: userResult, 
            longToken,
            tokenExpiresIn: "3 Years"
        };
    }

    async getToken ({headers}) {
        // Get creds from the header
        const credentials = Buffer.from(headers.authorization.split(" ")[1], 'base64').toString();
        const id = credentials.split(':')[0];
        const password = credentials.split(':')[1];
        
        // Check user and password
        var userResult = await this.mongoDB.getItem(id, this.usersCollection, userDto);
        if(userResult.errors) return this.logInError;    
        const isValidPassword = bcrypt.compareSync(password, userResult.password);
        if(!isValidPassword)  return this.logInError;

        // Generate new token
        let longToken  = this.tokenManager.genLongToken({ user: userResult });

        return {
            longToken,
            tokenExpiresIn: "3 Years"
        };
    }

}
