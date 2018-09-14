'use strict';

var fs=require("fs");
var readline=require("readline");
var _=require("underscore");
var CIVIS_DATA= "../civis-data/";

var computeCheckDigit = function(numberStr) {
  var oddSum = 0;
  var evenSum = 0;
  _.each(numberStr,function(digit,index){
    if(index % 2) {
      evenSum += parseInt(digit);
    } else {
      oddSum += parseInt(digit);
    }
  })
  return (oddSum*3 + evenSum) % 10;
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

readAddresses();

function readAddresses(){
    try{
    fs.readdirSync(CIVIS_DATA).filter(function(name){return name.endsWith("apts.csv");})
	.forEach(function(nm){
    var file = fs.createReadStream(CIVIS_DATA+nm);
	  readline.createInterface({terminal: false, input:file})
		.on('line', function(line){
		    if(!line)
			return;
    		    var ln= line.split(",");
		    if(!ln[3])
			return;
        var code = computeCheckDigit(ln[0].replace(/-/g,'')) + String("0000" + parseInt(ln[0].split("-")[1])*3).slice(-4);;
		    console.log('"' + ln[0]+'","'+code+'","'+ln[3].match(/[^0-9]+|[0-9]+/g).join(" ")+'","'+ln[5].split('/').map(function(s){return s.split(/(?=[A-Z])/).join(" ").split("- ").join("-");}).join(", ") + '"');
		});
	});
    }catch(x){
	console.log("Static Stockholm consumption data not found ",x.message);
	console.log(x.stack);
    }

}




