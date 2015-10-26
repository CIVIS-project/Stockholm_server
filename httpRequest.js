var Q= require('q');

var req= Q.denodeify(require('request'));

function fun(options){
    return req(options)
	//.tap(console.log)
	.then(
	    function(response){
		if(response[0].statusCode!=200)
		    throw "http status "+response[0].statusCode;
		return response[0];
	    })
	.then(options.postprocess);
}

module.exports=function(f){
    return function(x){
	return fun(f.apply(x, Array.prototype.slice.call(arguments)));
    };
};



