var vm = require('vm');
var fs = require('fs');
var httpRequest=require('./httpRequest.js');
var Q=require("q");
Q.longStackSupport = true;

const file='./max-accounts.json';
const fileOpts='utf-8';
	  
var accounts=JSON.parse(fs.readFileSync(file, fileOpts));

httpRequest(readAPI)()
    .then(vm.runInThisContext)
    .then(httpRequest(getScriptSessionId))
    .then(makeContext)
    .invoke("map", treatAccount)
    .all()
    .tap(console.log)
    .done();
;

function makeContext(sessionId){
    return accounts.map(function(a){
	return {account:a, scriptSessionId:sessionId};
    });
}

function treatAccount(context){
    return Q(context)
	.then(httpRequest(getCookie))
    	.then(function(value){context.cookie=value; return context;})
	.then(httpRequest(getCubeStatus))
	.then(formatCubeStatus)
    ;
} 

function formatCubeStatus(maxCubeState){
    // TODO
    return maxCubeState.rooms[1].name;
}

function readAPI(){
    return {
	method:'get',
	url:'https://max.eq-3.de/dwr/interface/MaxRemoteApi.js',
	postprocess:function(response){ return response.body; }
    };
}

function getScriptSessionId() {
    return  {
	method:'get',
	url:'https://max.eq-3.de/dwr/engine.js',
	postprocess:function(response){
	    const marker= 'dwr.engine._origScriptSessionId = "';
	    var index= response.body.indexOf(marker)+marker.length;

	    return response.body.substring(index, response.body.indexOf('"', index))
		+Math.floor(Math.random() * 1000);
	}
    };
}
    
function getCookie(context){
    return	{
	method:'post',
	url: 'https://max.eq-3.de/dwr/call/plaincall/MaxRemoteApi.login.dwr',
	body: 'callCount=1\n'+
	    'page=/dwr/test/MaxRemoteApi\n'+
	    'httpSessionId=\n'+
	    'scriptSessionId='+context.scriptSessionId+'\n'+
	    'c0-scriptName=MaxRemoteApi\n'+
	    'c0-methodName=login\n'+
	    'c0-id=0\n'+
	    'c0-param0=string:'+context.account.username+'\n'+
	    'c0-param1=string:'+context.account.password+'\n'+
	    'batchId=0',
	postprocess:function(response){
	    var firstCookie= response.headers['set-cookie'][0];
	    return firstCookie.substring(firstCookie.indexOf('=')+1, firstCookie.indexOf(';'));
	}	    
    };    
}

function getCubeStatus(context){
    return{
	method: 'post',
	url: 'https://max.eq-3.de/dwr/call/plaincall/MaxRemoteApi.getMaxCubeState.dwr',
	body: 'callCount=1\n'+
	    'page=/dwr/test/MaxRemoteApi\n'+
	    'httpSessionId='+context.cookie+'\n'+
	    'scriptSessionId='+context.scriptSessionId+'\n'+
	    'c0-scriptName=MaxRemoteApi\n'+
	    'c0-methodName=getMaxCubeState\n'+
	    'c0-id=0\n'+
	    'batchId=1',
        headers:{
	    Cookie:'JSESSIONID='+context.cookie
	},
	postprocess:function(response){
	    var responseScript=response.body.substring(response.body.indexOf("//#"));
	    responseScript= responseScript.substring(0, responseScript.
						     indexOf("dwr.engine._remoteHandleCallback"));    
	    vm.runInThisContext(responseScript);
	    return s0;
	}
    };
}
