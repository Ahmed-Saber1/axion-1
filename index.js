const config                = require('./config/index.config.js');
const Cortex                = require('ion-cortex');
const ManagersLoader        = require('./loaders/ManagersLoader.js');
const Aeon                  = require('aeon-machine');

process.on('uncaughtException', err => {
    console.log(`Uncaught Exception:`)
    console.log(err, err.stack);

    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at ', promise, `reason:`, reason);
    process.exit(1)
})

// creating mongoDB object
const mongoDB = config.dotEnv.MONGO_URI ? require('./connect/mongo')({
    uri: config.dotEnv.MONGO_URI
}) : null;

// creating redis client and returns redis obj to use.
const cache      = require('./cache/cache.dbh')({
    prefix: config.dotEnv.CACHE_PREFIX ,
    url: config.dotEnv.CACHE_REDIS
});

// creating redis client and returns redis obj to use V2.
const Oyster  = require('oyster-db');
const oyster     = new Oyster({ 
    url: config.dotEnv.OYSTER_REDIS, 
	prefix: config.dotEnv.OYSTER_PREFIX 
});

// redis communication protocol
const cortex     = new Cortex({
    prefix: config.dotEnv.CORTEX_PREFIX,
    url: config.dotEnv.CORTEX_REDIS,
    type: config.dotEnv.CORTEX_TYPE,
    state: ()=>{
        return {} 
    },
    activeDelay: "50",
    idlDelay: "200",
});

// schedule calls using cortex object
const aeon = new Aeon({ cortex , timestampFrom: Date.now(), segmantDuration: 500 });

const managersLoader = new ManagersLoader({config, cache, cortex, oyster, aeon, mongoDB});
const managers = managersLoader.load();

managers.userServer.run();
