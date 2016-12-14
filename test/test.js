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
        var steps=pedometer(data.acc,data.att,100);
        check(steps,[ 90, 133, 191, 258, 316, 369, 431, 476, 537, 601, 656, 713, 768, 830, 882, 999, 1058, 1116, 1166, 1231, 1288, 1349, 1393, 1461, 1518, 1577, 1623, 1693, 1749, 1809, 1856, 1926, 1980, 2043, 2097, 2154, 2207, 2257, 2312, 2370, 2436, 2492, 2547, 2606, 2661, 2716, 2773, 2832, 2927, 2984, 3052, 3165, 3222, 3281, 3393, 3505, 3564, 3613, 3674, 3731, 3842, 3896, 3955, 4011, 4066, 4118, 4280, 4400, 4457, 4515, 4626, 4683, 4738, 4852, 4966, 5128, 5297, 5358, 5415, 5460, 5584, 5630, 5697, 5756, 5812, 5868, 5922, 5967, 6034, 6092, 6201, 6368, 6430, 6483, 6539, 6656, 6716 ],0);
    });
    it('Signal of random movement', function () {
        var data=loadData('test/DataNotWalking.csv');
        var steps=pedometer(data.acc,data.att,100);
        check(steps,[ 1137, 1209, 1306, 1403, 1576, 2264, 2314, 15176 ],0); //Some false positives detected
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

