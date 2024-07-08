module.exports = {
    'userName': (data)=>{
        if(data.trim().length < 3){
            return false;
        }
        return true;
    },
}