var synaptic = require('synaptic');
var parse = require('csv-parse/lib/sync');
var fs = require('fs');

var stepdata=fs.readFileSync('./data/steps.csv','utf8');
stepdata=parse(stepdata, {trim: true, auto_parse: true,relax_column_count:true });


var nostepdata=fs.readFileSync('./data/noSteps.csv','utf8');
nostepdata=parse(nostepdata, {trim: true, auto_parse: true,relax_column_count:true });


var set=[];

var inputsize=40;

var setcounter=0;
for (var i=0;i<stepdata.length;i++){
    if (stepdata[i].length>=inputsize){
        var inputdata=[];
        for (var j=0;j<inputsize;j++){
            var scaledPosition=j*stepdata[i].length/inputsize;
            //Linear interpolation
            inputdata[j]=stepdata[i][Math.floor(scaledPosition)]*(1-(scaledPosition%1))+stepdata[i][Math.ceil(scaledPosition)]*(scaledPosition%1);
        }
        set[setcounter++]={
            input:inputdata,
            output:[1]
        };
    }
}
for (var i=0;i<nostepdata.length;i++){
    if (nostepdata[i].length>=inputsize){    
        var inputdata=[];
        for (var j=0;j<inputsize;j++){
            var scaledPosition=j*nostepdata[i].length/inputsize;
            //Linear interpolation
            inputdata[j]=nostepdata[i][Math.floor(scaledPosition)]*(1-(scaledPosition%1))+nostepdata[i][Math.ceil(scaledPosition)]*(scaledPosition%1);
        }
        set[setcounter++]={
            input:inputdata,
            output:[0]
        };
    }
}


var Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;
var myPerceptron = new Architect.Perceptron(inputsize, 5,5, 1);
var trainer = new Trainer(myPerceptron);

function shuffle(o) { //v1.0
  for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

shuffle(set);

trainer.train(set,{
    rate: 0.001,
    iterations: 50000,
    error: 0.0005,
    shuffle: true,
    log: 10,
    cost: Trainer.cost.MSE,
    crossValidate: {
        testSize: 0.5
    }
});
//myPerceptron.optimize();
fs.writeFileSync('./data/neuralnetwork.json',JSON.stringify(myPerceptron.toJSON()),'utf8');

console.log('trained with '+set.length+' samples');