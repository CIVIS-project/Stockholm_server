/*global require s0 */

var vm = require('vm');
var fs = require('fs');
var httpRequest=require('./httpRequest.js');
var Q=require("q");
Q.longStackSupport = true;

const file='./max-accounts.json';
const fileOpts='utf-8';
const replyDelay=1000;

var accounts=JSON.parse(fs.readFileSync(file, fileOpts));

httpRequest(readAPI)()
    .then(vm.runInThisContext)
    .then(httpRequest(getScriptSessionId))
    .then(function(sessionId){
	return accounts
	    .map(function(a){ return {account:a, scriptSessionId:sessionId};})
	    .map(function(ctx){ return function(){ return treatAccount(ctx);};})
	    .reduce(Q.when, Q());
    })
    .done();
;

function treatAccount(context){
    return Q(context)
	.then(httpRequest(getCookie))
    	.then(function(value){context.cookie=value; return context;})
	.then(httpRequest(getCubeStatus))
        .then(function(value){context.status=value; return context;})
	.then(formatCubeStatus)
	.then(function(formatted){ return formatted.split('\n');})
	.then(function(strings){
	    return strings
		.map(function(s){
		    return function(){
			return Q(s).tap(console.log).then(httpRequest(logCubeRoom)).delay(replyDelay);
		    };
		}
		    )
		.reduce(Q.when, Q());
	})
    ;
} 

function formatCubeStatus(context){
    return context.status.rooms.reduce(function(soFar, room){
	var unixTimestamp= Date.now();
	
	return soFar
	    .concat('\n')
	    .concat(context.account.apt).concat(';')
	    .concat(unixTimestamp).concat(';')
	    .concat(context.status.serialNumber).concat(';')
	    .concat(room.name).concat(';')
	    .concat(room.comfortTemperature).concat(';')
//	    .concat(room.ecoTemperature).concat(';')
	    .concat(room.actualTemperature)
	;
	
    }, "").substring(1);
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
	    responseScript= responseScript
		.substring(0, responseScript.indexOf("dwr.engine._remoteHandleCallback"));    
	    vm.runInThisContext(responseScript);
	    return s0;
	}
    };
}

function logCubeRoom(content){
    return {
	method:'post',
	url:'http://civis.cloud.reply.eu/Sweden/DataParser.svc/postMaxCubeData',
	headers: {
	    'Content-Type': 'application/text' ,
	    'Accept': 'text/plain',
	    'Accept-Charset': 'utf-8'
	},
	body: content,
	postprocess:function(response){
	    // TODO
	    console.log(response.body);
	}	
    };
}
