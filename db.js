 var MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    config = require('./config');
 
 
 var PoolManager = function PoolManager(){
     var pools = [];
     config.MongoInstances.forEach(function(instance){
            var pool = {dbClient:null,lock:'',name:instance.name,host:instance.host,client:null,state:1};
            pool.client =  new MongoClient(new Server(instance.host, instance.port,{auto_reconnect: true, poolSize: 4},{safe:true, native_parser: true}));
            pool.client.open(function(error,client){
                pool.dbClient = client;
            });
            pools.push(pool);
        });
        
    this.getDb  = function(dbname){
        var instance = this.getMongoInstance(dbname);
        return instance.client.db(dbname);
              
    };
    this.getMongoInstance = function(dbname){
        var i=0,length,state=false;
        
        for(i=0,length=pools.length;i<length;i++){
            if(pools[i].state===1){
                pools[i].lock = dbname;
                pools[i].state=0;
                state=true;
                break;
            }
            
        }
        if(state) return pools[i];
        else{
            if(pools.length < 11){
                var pool = {dbClient:null,lock:dbname,name:'default'+pools.length,host:'127.0.0.1',client:null,state:0};
                pool.client =  new MongoClient(new Server('127.0.0.1', 27017,{auto_reconnect: true, poolSize: 4},{safe:true, native_parser: true}));
                pool.client.open(function(error,client){
                    pool.dbClient = client;
                });
                pools.push(pool);
                return pool;
                
            }else{
                var pool = Math.floor(Math.random() * pools.length); 
                pools[pool].lock = dbname;
                return pools[pool];
            }
        }
             
        
                
     }; 
     
     this.closeDb = function(dbname){
        for(var i=0,length=pools.length;i<length;i++){
            if(pools[i].lock===dbname){
                pools[i].state=1;
                pools[i].lock ='';
                break;
            }
            
        }
         
     };
 };      

PoolManager._instance = null;
PoolManager.getInstance = function(){
    if(this._instance === null) this._instance = new PoolManager();
    return this._instance;
};

     
module.exports = PoolManager.getInstance();

