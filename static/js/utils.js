/*
 * Generalized util functions that aren't specific to individual js libraries or classes (e.g. Experiment, Trial)
 */


ajaxStruct = function() {
    this.data; // Holder for ajax data
};

function readJson(filepath) {
    var lst = new ajaxStruct();
    $.ajax({
        dataType: "json",
        url: filepath,
        async: false,
        success: function(data) {
            lst.data = data
        },
        error: function(error) {
            throw new Error("Failure to load json file at: " + filepath + "\n" + error);
        }
    });
    return lst;
}

function assert(value, message) {
	if (!value) {
		throw new Error("Assertion failed: " + message);
	}
};

// From https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
};

/*
 *
 * @param {num} x1: x coordinate of point 1
 * @param {num} y1: y coordinate of point 1
 * @param {num} x2: x coordinate of point 2
 * @param {num} y2: y coordinate of point 2
 * @param {num} r: radius of separation
 * @returns {bool}: true if points 1 and 2 are within r px of each other
 */
 function edistwithin(x1, y1, x2, y2, r) {
    var dx2 = (x1 - x2) * (x1 - x2);
    var dy2 = (y1 - y2) * (y1 - y2);
    return dx2 + dy2 < r * r;
};

// Get Euclidean distance between two points (x1, y1) and (x2, y2)
function edist(x1, y1, x2, y2) {
    return Math.sqrt((Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
};

// Get closest line between a ball at (x1, y1) and a wall or target described by (left, top), (right, bottom)
function cleverdist(x1, y1, left, top, right, bottom) {
    var closestdist;
    if (x1 >= left && x1 <= right) {
        // If ball is directly below target, get distance to bottom
        if (y1 >= bottom) closestdist = y1 - bottom;
        else closestdist = top - y1;
    } else if (y1 <= bottom && y1 >= top) {
        if (x1 >= right) closestdist = x1 - right;
        else closestdist = left - x1;
    } else {
        closestdist = Math.min(edist(x1, y1, left, top),
                                edist(x1, y1, right, top),
                                edist(x1, y1, left, bottom),
                                edist(x1, y1, right, bottom))
    }
    return closestdist;
}

// Utility function to adjust for data without alpha channel
function makeColor(col) {
    if (col.length === 3) {
        return "rgba(" + col[0] + "," + col[1] + "," + col[2] + ",255)";
    } else {
        return "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + col[3] + ")";
    }
};
