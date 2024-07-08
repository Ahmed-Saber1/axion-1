const mongoose      = require('mongoose');
mongoose.Promise    = global.Promise;

module.exports = ({uri})=>{
  //database connection
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // When successfully connected
  mongoose.connection.on('connected', function () {
    console.log('💾  Mongoose default connection open to ' + uri);
  });

  // If the connection throws an error
  mongoose.connection.on('error',function (err) {
    console.log('💾  Mongoose default connection error: ' + err);
    console.log('=> if using local mongodb: make sure that mongo server is running \n'+
      '=> if using online mongodb: check your internet connection \n');
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', function () {
    console.log('💾  Mongoose default connection disconnected');
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', function() {
    mongoose.connection.close(function () {
      console.log('💾  Mongoose default connection disconnected through app termination');
      process.exit(0);
    });
  });

  var mongoFunctions = {
      getAllItems : async function (query, collection, reqOptions, returnDto){
        try{
          const { db } = mongoose.connection;
          const options = reqOptions ? {
              limit: reqOptions.limit ? parseInt(reqOptions.limit) : 25,
              skip: reqOptions.offset ? parseInt(reqOptions.offset) : 0,
              sort: { updatedAt: -1 }
          } : {};
  
          if (reqOptions && options.limit === 0) return [];
          let items = await db.collection(collection).find(query, options).toArray();
          
          if(returnDto){
            var dtoItems = new Array();
            items.forEach(element => {
                dtoItems.push(returnDto(element))
            })
            return dtoItems;
          }

          return items;
        }catch(err){
          return { errors : [{ label: "Generic Error", message : "Unexpected error occured" }]}
        } 
      },
      getAllItemsBasedOnQuery : async function (query, collection){
        try{
          const { db } = mongoose.connection;

          let items = await db.collection(collection).find(query, {}).toArray();

          return items;
        }catch(err){
          return { errors : [{ label: "Generic Error", message : "Unexpected error occured" }]}
        } 
      },
      getItem: async function (id, collection, returnDto){
        try{
          const { db } = mongoose.connection;
  
          let item = await db.collection(collection).findOne({ id: id });
          if (item == null) return { errors : [{ label: "Not Found", message : "Item can't be found" }]}
          else {
            return returnDto(item);
          }
        }catch(err){
          return { errors : [{ label: "Generic Error", message : "Unexpected error occured" }]}
        }
      },
      postItem : async function (body, collection, returnDto){
        try {
          const { db } = mongoose.connection;
          body.createdAt = new Date().toISOString();
          body.updatedAt = new Date().toISOString();

          let item = await db.collection(collection).insertOne(body);
          item = await db.collection(collection).findOne({ _id: item.insertedId});

          return returnDto(item);
        }catch(err){
          return { errors : [{ label: "Generic Error", message : "Unexpected error occured" }]}
        }
      },
      patchItem : async function (id, body, collection, returnDto){
        try {
          const { db } = mongoose.connection;
          body.updatedAt = new Date().toISOString();

          let item = await db.collection(collection).findOneAndUpdate({ id: id }, { $set: body }, { returnOriginal: false });
          if (!item || !item.value) return { errors : [{ label: "Not Found", message : "Item can't be found" }]};
              
          let result = await db.collection(collection).findOne({ id: id });
          return returnDto(result);
          
        }catch(err){
          return { errors : [{ label: "Generic Error", message : "Unexpected error occured" }]}
        }
      },
      deleteItem : async function (id, collection, returnDto){
        try {
          const { db } = mongoose.connection;

          const itemToDelete = await db.collection(collection).findOne({ id: id });
          if (itemToDelete == null) return { errors : [{ label: "Not Found", message : "Item can't be found" }]}

          await db.collection(collection).deleteOne({ id: id });     
          return returnDto(itemToDelete);
          
        }catch(err){
          return { errors : [{ label: "Generic Error", message : "Unexpected error occured" }]}
        }
      },
      checkIfIdExists : async function (id, collection){
        try {
          const { db } = mongoose.connection;

          let item = await db.collection(collection).findOne({ id: id });
          if (item == null) return { exists: false, errors : [{ label: "Not Found", message : `Item ${id} can't be found in  ${collection}` }]}

          return { exists: true };
        }catch(err){
          return { errors : [{ label: "Generic Error", message : "Unexpected error occured" }]}
        }
      }
  }
  return mongoFunctions;
}
