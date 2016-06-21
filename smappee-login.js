/*global require*/
var Q= require('q');
var fs = require('fs');
var httpRequest = require('./httpRequest.js');
Q.longStackSupport = true;

const file='./smappee-accounts.json';
const tokenFile='./smappee-accounts-token.json';
const fileOpts='utf-8';
	  
var accounts=JSON.parse(fs.readFileSync(file, fileOpts));

accounts.map(function(a){  return function(){ return treatAccount(a);};})
    .reduce(Q.when, Q())
    .then(function(){return JSON.stringify(accounts, null, 2);})
    .then(function (string){
	return Q.denodeify(fs.writeFile)(tokenFile, string, fileOpts);
    })
    .done();

function treatAccount(account){
    return Q(account)
	.then(httpRequest(getAccessToken))
	.then(function(value){account.accessToken=value; return account;})
    	.then(httpRequest(getServiceLocation))
	.then(function(value){account.serviceLocationId=value; return account;})
	.tap(console.log)
    ;
}

function getAccessToken(account){
    return  {
	method:'post',
	url:'https://app1pub.smappee.net/dev/v1/oauth2/token', 
	form:{
	    client_id:account.id,
	    client_secret:account.secret,
	    username:account.username,
	    password:account.password,
	    grant_type:'password'
        },
	postprocess:function(response){
	    return JSON.parse(response.body).access_token;
	}
    };
}

function getServiceLocation(account){
    return  {
	method:'get',
	url:'https://app1pub.smappee.net/dev/v1/servicelocation',
	auth: {
	    'bearer': account.accessToken
	},
	postprocess:function(response){
	    return JSON.parse(response.body).serviceLocations[0].serviceLocationId;
	}
    };
}   
	
