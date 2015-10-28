/*global require module */

var Q= require('q');

var req= Q.denodeify(require('request'));

function promise(options){
    return req(options)
	//.tap(console.log)
	.then(
	    function(response){
		if(response[0].statusCode!=200)
		    throw "http status "+response[0].statusCode+"\n"+response[0].body;
		return response[0];
	    })
	.then(options.postprocess);
}

module.exports=function(f){
    return function(x){
	return promise(
	    f.apply(x, Array.prototype.slice.call(arguments))
	);
    };
};



