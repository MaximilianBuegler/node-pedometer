/*===========================================================================*\
 * Pedometer algorithm for node.js
 *
 * Uses windowed average peak counting algorithm step detection.
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
    it('Signal of long walk', function () {
        var data=loadData('test/DataWalking.csv');
        var steps=pedometer(data.acc,data.att,100,{ windowSize:1, 
                                                    minPeak:2, 
                                                    maxPeak:8, 
                                                    minStepTime: 0.4, 
                                                    peakThreshold: 0.5, 
                                                    minConsecutiveSteps: 3,
                                                    maxStepTime: 0.8 });
        check(steps.length,106,0);
    });
    it('Signal of random movement', function () {
        var data=loadData('test/DataNotWalking.csv');
        var steps=pedometer(data.acc,data.att,100,{ windowSize:1, 
                                                    minPeak:2, 
                                                    maxPeak:8, 
                                                    minStepTime: 0.4, 
                                                    peakThreshold: 0.5, 
                                                    minConsecutiveSteps: 3,
                                                    maxStepTime: 0.8 });
        check(steps.length,9,0);
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



