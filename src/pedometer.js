/*===========================================================================*\
 * Pedometer algorithm for node.js
 *
 * Uses autocorrelation and neural networks for robust step detection.
 *
 * (c) 2016 Maximilian Bügler
 *
 *===========================================================================*/


var parse = require('csv-parse/lib/sync');
var fs = require('fs');
var synaptic = require('synaptic');
var neuralnetwork=network.fromJSON(JSON.parse(fs.readFileSync('./data/neuralnetwork.json','utf8')));

module.exports = {
    pedometer: function pedometer(acceleration, orientation, samplingrate){
        
        
    }
};

