const pkg = require('../../../package.json')

module.exports = class Student { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels, mongoDB }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongoDB             = mongoDB
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.httpExposed         = ['get=getStatus'];
    }

    async getStatus({}){         
        // Get Logic
        return {
            name: pkg.name,
            status: 'ok',
            version: pkg.version
        }
    }



}
