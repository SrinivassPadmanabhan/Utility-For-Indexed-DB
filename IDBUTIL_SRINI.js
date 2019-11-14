/*
$ Author: Srinivass B.E
All copy rights belongs to the Srinivass B.E
Input Details:         
JSON Which has the following details
name: database Name
Version: Version number of the Database
TableDetails: [tableName: tableName,
autoIncrement: false // If is true it will automatically generate the key
keypath: mention the key for the particular record
index: [IndexName : Name of the Indexes
columnName: mention the column Name
]


Sample Input:
var databaseDetails = {
			"name": "library",
			"version": 1,
			"tableDetails":[
				{ tableName: "books", 
				  autoIncrement: false, 
				  keyPath: "isbn",
				  index:[{
				  	indexName: "by_title",
			  		columnName: "title",
			  		unique: true
				  },
				  {
				  	indexName:"by_author",
				  	columnName: "author",
				  }]},{ tableName: "book",
						keyPath: "isbn"}]
		};
*/
var indexedDbUtil = (function(){
	const TransactionType = {
			"READ_ONLY": "readonly",
			"READ_WRITE": "readwrite",
			"VERSION_CHANGE": "versionchange"
		  },
		  TransactionState = {
		  	"success": "onsuccess",
		  	"error":"onerror",
		  	"complete": "oncomplete",
		  	"upgradeNeeded": "onupgradeneeded"
		  },
		  Operation = {
		  	"GET": "get",
		  	"PUT": "put",
		  	"DELETE": "delete"
		  },
		  trace = function(x, y){// utility for log purpose
		  	y = y || "";
		  	console.log(y, JSON.stringify(x));
		  	return x;
		  },
		  on = true,
		  off = false,
		  defaultDatabseName = "TestDatabase";
		  defaultVersionNumber = 1;
		  defaultTableDetails = ["objStore1","objStore2"];
	

	var upgradeResultHandler,
		IDB,
		boundUpgradeNeeded,
		IDBCreation = function(){}, 		
		sequentialExecutionOrder = new asynChronousOPeration();
		function asynChronousOPeration(){};
		asynChronousOPeration.prototype.asynArr = [];
		asynChronousOPeration.prototype.executionList = function(value){//It store in the order in which it needs to executed
			if(this.asynArr.length == 0){ 
				this.asynArr.push(value);
				this.executionOrder()
			} else {
				this.asynArr.push(value);
			}			
		};
		asynChronousOPeration.prototype.executionOrder = function(){//this executes the first element in the array
			var reference = this.asynArr[0];
			reference && reference.transactionSwitch();
		};
		asynChronousOPeration.prototype.executionComplete = function(){// deletes the first element in the execution order
			this.asynArr = Array.prototype.splice.call(this.asynArr, 1);
			this.executionOrder();
		};

	IDBCreation.prototype.openDatabase = function(){ //open Database...
		var self = this;
		sequentialExecutionOrder.executionList(null);
		if(!window.indexedDB){
			trace("sorry your browser does not support indexedDB please upgrade or try with some other browser");
			return;
		}
		boundUpgradeNeeded = upgradeNeeded.bind(this);
		
		this.dbreq = indexedDB.open(this.dbName, this.version);

		this.dbreq[TransactionState.upgradeNeeded] = boundUpgradeNeeded;
		this.dbreq[TransactionState.success] = function(){
			self.db = self.dbreq.result;
			sequentialExecutionOrder.executionComplete();
		}
		//this.db = this.dbreq.result;
		return this;
		//return this.__proto__;
	};
	IDBCreation.prototype.setDBDetails = function(dbDetails){//constructor for the IDB creation
			
			this.dbName = dbDetails.name|| defaultDatabseName;
			this.version = dbDetails.version || defaultVersionNumber;
			dbDetails.tableDetails = dbDetails.tableDetails || defaultTableDetails;
			this.tableDetails = JSON.parse( JSON.stringify(dbDetails.tableDetails) );
			return this;
		};
	IDBCreation.prototype[Operation.GET] = function(objStoreName, inputArr, dbName){// the public get function used to get the values in the db using the keys
		var databaseName = dbName || this.dbName;
		var IDB_T = new IDB_Transaction(databaseName, objStoreName,inputArr, TransactionType.READ_ONLY, Operation.GET, this);
		this.IDB_Transaction = IDB_T;
		sequentialExecutionOrder.executionList(IDB_T);
		return this;
	};
	IDBCreation.prototype[Operation.PUT] = function(objStoreName, inputArr, dbName){// the public put function used to put the values in the db using the keys
		var databaseName = dbName || this.dbName;
		var IDB_T = new IDB_Transaction(databaseName, objStoreName,inputArr, TransactionType.READ_WRITE, Operation.PUT, this);
		this.IDB_Transaction = IDB_T;
		sequentialExecutionOrder.executionList(IDB_T);
		return this;
	};
	IDBCreation.prototype[TransactionState.complete] = function(onCompleteCallback){//assigning the oncomplete function once transaction got completed
		this.IDB_Transaction.completeArgumentArray.push(Array.prototype.splice.call(arguments, 1));
		this.IDB_Transaction.onCompleteHandler = onCompleteCallback;
		return this;
	};
	IDBCreation.prototype[TransactionState.success] = function(onSuccessCallback){// assigning the success function once the Operation got completed
		this.IDB_Transaction.successArgumentArray.push(Array.prototype.splice.call(arguments, 1));
		this.IDB_Transaction.onSuccessHandler = onSuccessCallback;
		return this;
	};
	IDBCreation.prototype[TransactionState.error] = function(onErrorCallback){// assigning the error function once any error occurred in the transaction
		this.IDB_Transaction.errorArgumentArray.push(Array.prototype.splice.call(arguments, 1));
		this.IDB_Transaction.onSuccessHandler = onErrorCallback;
		return this;
	};

	function upgradeNeeded(){ //updating or creating the ObjectStore and Index in the database...
		var keyDetails = {}, 
			objectStore, 
			objectStoreName = "",
			indexCreationStatus = off,
			indexUniqueness = {},
			tempIndexData = {},
			indexDetails = {};
		this.db = this.dbreq.result;
		trace("dbcreated successfully");
		for(var i = 0, n = this.tableDetails.length; i < n; i++){	
			objectStoreName = this.tableDetails[i].tableName;
			if(this.autoIncrement){
				keyDetails =  {
					autoIncrement: on
				};				
			} else {
				keyDetails = {
					keyPath: this.tableDetails[i].keyPath
				};				
			}
			objectStore = (this.db.createObjectStore(objectStoreName, keyDetails));
			indexDetails = this.tableDetails[i].index || [];
			for(var j = 0, len = (indexDetails).length; j < len; j++){
				tempIndexData = indexDetails[j];
				tempIndexData.unique = tempIndexData.unique || off;
				indexUniqueness = {unique: tempIndexData.unique};
				trace(objectStoreName,"The Object Store start ===>")
				objectStore.createIndex(tempIndexData.indexName, tempIndexData.columnName, indexUniqueness);			
			}
			objectStore.transaction[TransactionState.complete] = function(event) {
	    		trace("Object Store is Created for all successfully ===>");
	    		
	   		};
	   		objectStore.transaction[TransactionState.error] = function(event) {
	   			trace(objectStoreName, "Error for this objectStore ===>");
	   			
	   		};
		}
	};

	var IDB_Transaction = function(dbName, objectStoreName, inputArr,transactionType, operationType, that){//constructor for IDB transaction
		trace("the transaction started");
		this.dbName = dbName || "undefined";
		this.transactionType = transactionType;
		this.objectStoreName = objectStoreName||"undefined";
		this.operationType = operationType;
		this.inputArr = inputArr;
		this.IDBCreation = that;
		trace(this.dbName, "DatabaseName ===> ");
		trace(this.inputArr, "inputValue ===> ");
		trace(this.objectStoreName, "ObjectStoreName ===> ");
		//this.transactionSwitch();	
	}; 
	IDB_Transaction.prototype.transactionSwitch = function(){// check whether to execute or not if any error it will return 
		if(this.dbName == undefined || this.inputArr == undefined || this.objectStoreName == undefined){
			trace("the transaction is failure due to undefined values");
			return;
		}
		transactionStart.call(this);		
	};

	IDB_Transaction.prototype.result = {};
	IDB_Transaction.prototype.successArgumentArray = [0];
	IDB_Transaction.prototype.completeArgumentArray = [0];
	IDB_Transaction.prototype.errorArgumentArray = [0];

	var transactionStart = function(){ // this is the actual place where the transaction getting started ...
		var //dbName = [this.dbName],
			transactionType = this.transactionType,
			objectStoreName = this.objectStoreName,
			db = this.IDBCreation.db;
			this.ResultArray = [];
			this.transaction = db.transaction([objectStoreName], transactionType).objectStore(objectStoreName);;
	
			trace("Transaction has been started..");
			this.index = 0;
			operationStart.call(this);
	},operationStart = function(){// this is the place where the every single operation is started like put, get etc...
		var transaction = this.transaction,
			operationType = this.operationType,
			inputArr = this.inputArr,
			index = this.index;
		trace(this.inputArr[this.index], "operation Started for ==>");
		var request = transaction[operationType](inputArr[index]),
		boundOperationSuccessHandler = operationSuccessHandler.bind(this ),
		boundOperationErrorHandler = operationErrorHandler.bind(this);
		request[TransactionState.success] = boundOperationSuccessHandler;
		request[TransactionState.error] =  boundOperationErrorHandler;
	},operationResultHandler = function(){	// this function checks whether to execute further or to finish once the operation got over		
		this.index += 1;
		if(this.inputArr.length > this.index){
			operationStart.call(this);
		} else {
			trace("all the operation got completed...");
			trace("the transaction is closed...");
			this.completeArgumentArray[0] = this.ResultArray;
			this.onCompleteHandler = this.onCompleteHandler || function(){};
			this.onCompleteHandler.apply(this, this.completeArgumentArray);
			sequentialExecutionOrder.executionComplete();			
		}
	},operationSuccessHandler = function(event){// this function is for handling the each success event..
		this.ResultArray.push(event.target.result);
		this.successArgumentArray[0] = event.target.result;
		this.onSuccessHandler = this.onSuccessHandler || function(){};
		this.onSuccessHandler.apply(this, this.successArgumentArray);
		trace(this.inputArr[this.index], "completed successfully ===>");
		operationResultHandler.call(this);
	},operationErrorHandler = function(event){// this function is for handling the each error event..
		trace(this.inputArr[this.index], "failed please check the error code below ===>");
		trace(event.target.result, "error ===>");
		operationResultHandler.call(this);
	}
		return new IDBCreation();
})();
