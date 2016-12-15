
/*===========================================================================*\
 * Pedometer algorithm for node.js
 *
 * Uses a windowed average peak counting algorithm to perform step detection.
 *
 * (c) 2016 Maximilian Bügler
 *
 * Assumes all data to be 2D arrays
 *
 * [[x1, y1, z1],[x2, y2, z2],...]
 * [[pitch1, roll1, yaw1]. [pitch2, roll2, yaw2],... ] (in Radians)
 *
 *===========================================================================*/

module.exports = {
    pedometer: require('./src/pedometer').pedometer
};
