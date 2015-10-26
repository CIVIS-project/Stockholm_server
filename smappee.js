var Q= require('q');
var fs = require('fs');
var httpRequest = require('./httpRequest.js');
Q.longStackSupport = true;

const tokenFile='./smappee-accounts-token.json';
const fileOpts='utf-8';
	  
var accounts=JSON.parse(fs.readFileSync(tokenFile, fileOpts));

Q.invoke(accounts, "map", treatAccount)
    .all()
    .done()
;

function treatAccount(account){
    return Q(account)
	.then(httpRequest(getConsumption))
	.then(function(value){account.cons=value;return account;})
	.then(formatConsumption)
	.tap(console.log)
    ;
}

function getConsumption(account){
    var unixTimestamp = Date.now()-10*60000;
    return     {
	method:'get',
	url:'https://app1pub.smappee.net/dev/v1/servicelocation/'+account.smapeeId+
	    '/consumption?aggregation=1&from=' + (unixTimestamp-15*60000+1) +'&to='+unixTimestamp,
	auth: {
	    'bearer': account.accessToken
	}
	,postprocess: function(response){
	    return JSON.parse(response.body).consumptions;
	}
    };
}

function formatConsumption(account){
    return account.smapeeId+';'
	+(account.cons[0].timestamp-30000)+';'
	+account.cons[2].timestamp+';'
	+(account.cons[0].consumption+ account.cons[1].consumption+ account.cons[2].consumption);
}

function logOptions(content){
    return {
	url:'http://civis.cloud.reply.eu/Sweden/DataParser.svc/postSmappeeData',
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
	