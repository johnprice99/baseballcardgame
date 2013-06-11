/* Common functions that are not directly related to the app itself */

Array.prototype.sum = function() {
	return this.reduce(function(a,b){return a+b;});
};
Array.max = function(array){
	console.log(array);
    return Math.max.apply(Math, array);
};

function randomIntBetween(low, high) {
	return Math.floor(Math.random() * high) + low;
}