var parse = require('csv-parse/lib/sync');
var fs = require('fs');
var synaptic = require('synaptic');
var network = synaptic.Network;


var neuralnetwork=network.fromJSON(JSON.parse(fs.readFileSync('./data/neuralnetwork.json','utf8')));

var stepdata=fs.readFileSync('./data/steps.csv','utf8');
stepdata=parse(stepdata, {trim: true, auto_parse: true,relax_column_count:true });

var inputsize=20;
var i=100;
    var inputdata=[];
    for (var j=0;j<inputsize;j++){
        var scaledPosition=j*stepdata[i].length/inputsize;
        //Linear interpolation
        inputdata[j]=stepdata[i][Math.floor(scaledPosition)]*(1-(scaledPosition%1))+stepdata[i][Math.ceil(scaledPosition)]*(scaledPosition%1);
    }
//console.log(inputdata);
console.log(neuralnetwork.activate(inputdata));
