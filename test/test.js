/*===========================================================================*\
 * Pedometer algorithm for node.js
 *
 * Performs 10 unit tests on different sample files
 *
 * (c) 2016 Maximilian Bügler
 *
 * Test setup adapted from fft-js in https://github.com/vail-systems/node-fft
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 *===========================================================================*/



var assert = require('assert'),
    pedometer = require('../').pedometer,
    fs = require('fs'),
    parse = require('csv-parse/lib/sync');

describe('Detect steps in acceleration signal', function () {
    it('Test 1 - Signal of walk 1', function () {
        var data=loadData('test/DataWalking1.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,116,0);
    });
    it('Test 2 - Signal of walk 2', function () {
        var data=loadData('test/DataWalking2.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,292,0);
    });
    it('Test 3 - Signal of walk 3', function () {
        var data=loadData('test/DataWalking3.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,25,0);
    });
    it('Test 4 - Signal of walk 4', function () {
        var data=loadData('test/DataWalking4.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,27,0);
    });
    it('Test 5 - Signal of walk 5', function () {
        var data=loadData('test/DataWalking5.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,483,0);
    });

    it('Test 6 - Signal of not walking 1', function () {
        var data=loadData('test/DataNotWalking1.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,16,0);
    });
    it('Test 7 - Signal of not walking 2', function () {
        var data=loadData('test/DataNotWalking2.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,10,0);
    });
    it('Test 8 - Signal of not walking 3', function () {
        var data=loadData('test/DataNotWalking3.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,28,0);
    });
    it('Test 9 - Signal of not walking 4', function () {
        var data=loadData('test/DataNotWalking4.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,0,0);
    });
    it('Test 10 - Signal of not walking 5', function () {
        var data=loadData('test/DataNotWalking5.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,23,0);
    });
    it('Test 11 - Signal of mixed action 1', function () {
        var data=loadData('test/DataMixed1.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,68,0);
    });    
    it('Test 12 - Signal of mixed action 2', function () {
        var data=loadData('test/DataMixed2.csv');
        var steps=pedometer(data.acc,data.att,100);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,46,0);
    });
    it('Test 13 - Custom parameters', function () {
        var data=loadData('test/DataMixed2.csv');
	var options={
    		windowSize:1, //Length of window in seconds
		minPeak:2, //minimum magnitude of a steps largest positive peak
   		maxPeak:8, //maximum magnitude of a steps largest positive peak
    		minStepTime: 0.3, //minimum time in seconds between two steps
    		peakThreshold: 0.5, //minimum ratio of the current window's maximum to be considered a step
    		minConsecutiveSteps: 3, //minimum number of consecutive steps to be counted
    		maxStepTime: 0.8, //maximum time between two steps to be considered consecutive
    		meanFilterSize: 2, //Amount of smoothing
   		debug: true //Enable output of debugging data in matlab/octave format
	};
        var steps=pedometer(data.acc,data.att,100,options);
        console.log("The algorithm detected "+steps.length+" steps.");
        check(steps.length,43,0);
    });
});

function loadData(filename){
    var data=fs.readFileSync(filename,'utf8');
    data=parse(data, {trim: true, auto_parse: true});
    var acc=[],att=[];
    for (var i=0;i<data.length;i++){
        acc[i]=data[i].slice(0,3);
        att[i]=[data[i][4], -data[i][5],data[i][3]];  
    }
    return {acc:acc,att:att};
}

function check(result, desired,threshold) {
    if (Array.isArray(desired)){
        assert(Array.isArray(result));
        assert(result.length==desired.length);
        for (var i=0;i<result.length;i++){
            check(result[i],desired[i],threshold);
        }
    }
    else{
        assert(equalWithThreshold(desired,result,threshold));
    }
}

function equalWithThreshold(val1, val2, threshold) {
    return val1==val2 || ((val1 > val2 - threshold) &&
           (val1 < val2 + threshold));
}



