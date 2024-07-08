module.exports = ({ meta, config, managers }) =>{
    return ({req, res, next})=>{
        if (req.params.moduleName == 'user' || req.params.moduleName == 'status'){
            next();
        }else {
            if(!req.headers.authorization){
                console.log('token required but not found')
                return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
            }
            let decoded = null;
            try {
                decoded = managers.token.verifyLongToken({token: req.headers.authorization.split(' ')[1]});
                if(!decoded){
                    console.log('failed to decode-1')
                    return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
                }
                else if (decoded.user.role == 'admin' && req.params.moduleName == 'school' && req.method.toUpperCase() != 'GET' ){
                    return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
                }
            } catch(err){
                console.log('failed to decode-2')
                return managers.responseDispatcher.dispatch(res, {ok: false, code:401, errors: 'unauthorized'});
            }
            next(decoded);
        }
    }
}