/*===========================================================================*\
 * Pedometer algorithm for node.js
 *
 * Debugger class
 *
 * (c) 2016 Maximilian Bügler
 *
 *===========================================================================*/



var pedometer = require('../').pedometer,
    fs = require('fs'),
    parse = require('csv-parse/lib/sync');

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


//load test data
var dataSets=[  loadData('test/DataNotWalking1.csv'),
                loadData('test/DataNotWalking2.csv'),
                loadData('test/DataNotWalking3.csv'),
                loadData('test/DataNotWalking4.csv'),
                loadData('test/DataNotWalking5.csv'),
                loadData('test/DataWalking1.csv'),
                loadData('test/DataWalking2.csv'),
                loadData('test/DataWalking3.csv'),
                loadData('test/DataWalking4.csv'),
                loadData('test/DataWalking5.csv'),
                loadData('test/DataMixed1.csv'),
                loadData('test/DataMixed2.csv')];

var data=dataSets[9]; //Select dataset

pedometer(data.acc,data.att,100,{debug:true});  //Debug: true --> Prints matlab readable output to console