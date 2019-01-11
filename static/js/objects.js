/*
 * Library for handling object animations during trials. Includes classes for ball, wall,
 * occluder, goal, and table, which handles the bulk of animations in the canvas.
 */


/**
 *
 * @param {type} px - x position of center of ball
 * @param {type} py - y position of center of ball
 * @param {type} vx - x velocity (px/s)
 * @param {type} vy - y velocity (px/s)
 * @param {type} rad - radius in pixels
 * @param {type} space - cp.Space object to attach to
 * @returns {Ball}
 */
Ball = function(px, py, vx, vy, rad, color = BLUE, elast = 1., space) {
    // Record inputs
    var pos = new cp.Vect(px, py);
    var vel;
    if (Math.abs(vx) == 1 || Math.abs(vy) == 1) {
        // Ball has default velocities from trial creation process (e.g. [1, -1])
        vel = new cp.Vect(DEFAULTVEL[0] * vx, DEFAULTVEL[1] * vy)
    } else if (Math.abs(vx) >= 10 || Math.abs(vy) >= 10) {
        // Ball has velocities overriding default from trial creation process
        vel = new cp.Vect(vx, vy);
    } else {
        // Set default velocities if none of the above hold
        vel = new cp.Vect(DEFAULTVEL[0], DEFAULTVEL[1]);
    }
    this.rad = rad;
    this.space = space;
    this.col = color;
    this.elast = elast;

    // Add new body to chipmunk space
    var mom = cp.momentForCircle(1, 0, this.rad, cp.vzero);
    this.body = new cp.Body(1.0, mom);
    this.circ = new cp.CircleShape(this.body, rad, cp.vzero);
    this.circ.setElasticity(elast);
    this.body.setPos(pos);
    this.body.setVel(vel);
    this.space.addBody(this.body);
    this.space.addShape(this.circ);

};

Ball.prototype.setpos = function(newx, newy) {
    var newpos = new cp.Vect(newx, newy);
    // TO ADD: Error & boundary checking
    this.body.setPos(newpos);
};

Ball.prototype.getpos = function() {
    return this.body.getPos();
};

Ball.prototype.setvel = function(nvx, nvy) {
    var newvel = new cp.Vect(nvx, nvy);
    this.body.setVel(newvel);
};

Ball.prototype.getvel = function() {
    return this.body.getVel();
};

Ball.prototype.getbounds = function() {
    var ctr = this.getpos();
    return [ctr[0] - this.rad, ctr[0] + this.rad, ctr[1] - this.rad, ctr[1] + this.rad];
};

Ball.prototype.draw = function (ctx) {
    ctx.fillStyle = this.col;
    var pos = this.getpos();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.arc(pos.x, pos.y, this.rad, 0, 2 * Math.PI, true);
    ctx.fill();
};

Ball.prototype.clone = function(newspace) {
    var pos = this.getpos();
    var vel = this.getvel();
    return new Ball(pos.x, pos.y, vel.x, vel.y, this.rad, this.col, this.elast, newspace);
};

/*
 *
 * @param {type} rect: any type of object that has top, bottom, left, right
 *                     (e.g., walls, occluders, goals)
 * @returns {bool} if there's an intersection
 */
Ball.prototype.intersectRect= function(rect) {
    var pos = this.getpos();
    var r = this.rad;
    var top = pos.y - r;
    var bottom = pos.y + r;
    var right = pos.x + r;
    var left = pos.x - r;

    // Collision between bounding rectangles
    if (!(rect.left > right || rect.right < left ||
            rect.top > bottom || rect.bottom < top)) {

        // Cheap non-distance calcs
        //  1) if a vertical collision and center is in, it's a hit
        if ((bottom > rect.top || top < rect.bottom) &&
                pos.x > rect.left && pos.x < rect.right) {return true;}
        // 2) if a horizontal collision and center is in vert, it's a hit
        if ((right > rect.left || left < rect.right) &&
                pos.y > rect.top && pos.y < rect.bottom) {return true;}

        // Otherwise, check if center is less than r from edge points
        if (edistwithin(pos.x, pos.y, rect.left, rect.top, r)) return true;
        if (edistwithin(pos.x, pos.y, rect.right, rect.top, r)) return true;
        if (edistwithin(pos.x, pos.y, rect.left, rect.bottom, r)) return true;
        if (edistwithin(pos.x, pos.y, rect.right, rect.bottom, r)) return true;

        // Passed all checks
        return false;
    }
    return false;
};

/**
 *
 * @param {int} top
 * @param {int} left
 * @param {int} bottom
 * @param {int} right
 * @param {cp.Space} space: space object to attach wall to
 * @returns {Wall}
 */
Wall = function(left, top, right, bottom, color, elast, space) {
    this.top = top;
    this.left = left;
    this.bottom = bottom;
    this.right = right;
    this.space = space;
    this.col = color;
    this.elast = elast;

    this.bb = new cp.bb(left, top, right, bottom);

    this.shape = this.space.addShape(new cp.BoxShape2(this.space.staticBody, this.bb));
    this.shape.setElasticity(elast);
};

Wall.prototype.draw = function(ctx) {
    var w = this.right - this.left;
    var h = this.bottom - this.top;
    ctx.fillStyle = this.col;
    ctx.fillRect(this.left, this.top, w, h);
};

Wall.prototype.clone = function(newspace) {
    return new Wall(this.left, this.top, this.right, this.bottom, this.col,
        this.elast, newspace);
};

Occluder = function(left, top, right, bottom, color) {
   this.top = top;
   this.left = left;
   this.bottom = bottom;
   this.right = right;
   this.col = color;
};

Occluder.prototype.draw = function(ctx) {
    var w = this.right - this.left;
    var h = this.bottom - this.top;
    ctx.fillStyle = this.col;
    ctx.fillRect(this.left, this.top, w, h);
};

Occluder.prototype.clone = function() {
    return new Occluder(this.left, this.top, this.right, this.bottom, this.col);
};

Goal = function(left, top, right, bottom, color, onreturn) {
    this.top = top;
    this.left = left;
    this.bottom = bottom;
    this.right = right;

    this.onret = onreturn;
    this.color = color;
};

Goal.prototype.draw = function(ctx) {
    w = this.right - this.left;
    h = this.bottom - this.top;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.left, this.top, w, h);
};

Goal.prototype.clone = function() {
    return new Goal(this.left, this.top, this.right, this.bottom, this.color, this.onret);
};

Table = function(name, dimx, dimy, canvas, closedends = [true, true, true, true],
    backgroundcolor = WHITE, timeres = 1 / 1000.) {

    this.tres = timeres;
    this.bkc = backgroundcolor;
    this.name = name;

    // revise canvas dimensions dynamically to match trial dims
    // allows trials to have dims other than what's initially specified in canvas.html
    canvas.width = dimx;
    canvas.height = dimy;
    this.dims = new cp.Vect(dimx, dimy);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.onstep = function() {};
    this.time = 0.;
    this.clocktime = new Date().getTime();

    this.space = new cp.Space();
    this.ball;
    this.walls = [];
    this.goals = [];
    this.occs = [];
    this.ces = closedends;

    var ce;

    this.ends = [];
    if (closedends[0]) {
        ce = this.space.addShape(new cp.SegmentShape(this.space.staticBody, cp.v(-1, -10), cp.v(dimx + 1, -10), 10));
        ce.setElasticity(1.);
        this.ends[this.ends.length] = ce;
    }
    if (closedends[1]) {
        ce = this.space.addShape(new cp.SegmentShape(this.space.staticBody, cp.v(dimx + 10, -1), cp.v(dimx + 10, dimy + 10), 10));
        ce.setElasticity(1.);
        this.ends[this.ends.length] = ce;
    }
    if (closedends[2]) {
        ce = this.space.addShape(new cp.SegmentShape(this.space.staticBody, cp.v(-1, dimy + 10), cp.v(dimx + 1, dimy + 10), 10));
        ce.setElasticity(1.);
        this.ends[this.ends.length] = ce;
    }
    if (closedends[3]) {
        ce = this.space.addShape(new cp.SegmentShape(this.space.staticBody, cp.v(-10, -1), cp.v(-10, dimy + 1), 10));
        ce.setElasticity(1.);
        this.ends[this.ends.length] = ce;
    }

};

Table.prototype.addball = function(px, py, vx, vy, rad, color = BLUE, elast = 1.) {
    var b = new Ball(px, py, vx, vy, rad, color, elast, this.space);
    if (typeof(this.ball) !== "undefined") console.log("Overwriting ball");
    this.ball = b;
    return b;
};

Table.prototype.addwall = function(left, top, right, bottom, color = BLACK, elast = 1.) {
    var w = new Wall(left, top, right, bottom, color, elast, this.space);
    this.walls[this.walls.length] = w;
    return w;
};

Table.prototype.addoccluder = function(left, top, right, bottom, color = "grey") {
    var o = new Occluder(left, top, right, bottom);
    this.occs[this.occs.length] = o;
    return o;
};

Table.prototype.addgoal = function(left, top, right, bottom, color, onreturn) {
    var g = new Goal(left, top, right, bottom, color, onreturn);
    this.goals[this.goals.length] = g;
    return g;
};

Table.prototype.draw = function() {
    var oldcompop = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = "source-over";

    var w, g, o;

    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.dims.x, this.dims.y);
    if (typeof(this.ball) !== "undefined") this.ball.draw(this.ctx);
    for (var i = 0; i < this.walls.length; i++){
        w = this.walls[i];
        w.draw(this.ctx);
    }
    // Other goals, occluders
    for (var i =0; i < this.goals.length; i++) {
        g = this.goals[i];
        g.draw(this.ctx);
    }

    for (var i = 0; i < this.occs.length; i++) {
        o = this.occs[i];
        o.draw(this.ctx);
    }
    this.ctx.globalCompositeOperation = oldcompop;
};

Table.prototype.checkend = function() {
   var g;
   for (j = 0; j < this.goals.length; j++) {
       g = this.goals[j];
       if (this.ball.intersectRect(g)) return g.onret;
   }
   return 0;
};

Table.prototype.step = function(t, maxtime) {
    var nsteps = t / this.tres;
    if (nsteps % 1 !== 0) console.log("Steps not evenly divisible... may be off");
    var e;
    for (i = 0; i < nsteps; i++) {
        this.onstep();
        this.space.step(this.tres);
        this.time += this.tres;
        e = this.checkend();
        if (e !== 0) return e;
        if (maxtime && this.time > maxtime) return TIMEUP;
    }
    return e;
};

Table.prototype.clone = function() {
    var newtb = new Table(this.name, this.dims.x, this.dims.y, this.canvas, this.ces, this.bkc,this.tres);
    var newsp = newtb.space;
    newtb.ball = this.ball.clone(newsp);
    var i;
    for (i = 0; i < this.walls.length; i++) {
        newtb.walls[i] = this.walls[i].clone(newsp);
    }
    for (i = 0; i < this.occs.length; i++) {
        newtb.occs[i] = this.occs[i].clone();
    }
    for (i = 0; i < this.goals.length; i++) {
        newtb.goals[i] = this.goals[i].clone();
    }
    return newtb;
};

TrialList = function(triallist, trialpath) {
    assert(triallist instanceof Array, "triallist must be an array");
    this.tnms = triallist.map(x => x[0]);
    this.trials = [];

    for (var i = 0; i < this.tnms.length; i++) {
        this.trials[i] = this.preloadTrial(trialpath + "/" + this.tnms[i]);
    }
};

TrialList.prototype.preloadTrial = function(jsonfile) {
    var failure = false;
    var trdat = new ajaxStruct();
    $.ajax({
        dataType: "json",
        url: jsonfile,
        async: false,
        success: function(data) {
            trdat.data = data;
        },
        error: function(req) {
            alert("Error loading JSON file; " + req.status);
            failure = true;
        }
    });
    return trdat.data;
};

TrialList.prototype.loadTrial = function(trialname, canvas) {
    var tdat = this.trials[this.tnms.indexOf(trialname)];
    return this.loadFromData(tdat, canvas);
};

TrialList.prototype.loadFromData = function(d, canvas) {
    var tdims = d.Dims;
    var ces = [false, false, false, false];
    var bkar = d.BKColor;
    var bkc = makeColor(bkar);
    for (i = 0; i < d.ClosedEnds.length; i++) {
        ces[d.ClosedEnds[i] - 1] = true;
    }
    var tab = new Table(d.Name, tdims[0], tdims[1], canvas, ces, bkc);

    // Add the ball
    var b = d.Ball;
    var bcol = makeColor(b[3]);
    tab.addball(b[0][0], b[0][1], b[1][0], b[1][1], b[2], bcol, b[4]);

    var w, wcol, o, ocol, g, gcol;

    // Add walls
    for (i = 0; i < d.Walls.length; i++) {
        w = d.Walls[i];
        wcol = makeColor(w[2]);
        tab.addwall(w[0][0], w[0][1], w[1][0], w[1][1], wcol, w[3]);
    }

    // Add occluders
    for (i = 0; i < d.Occluders.length; i++) {
        o = d.Occluders[i];
        ocol = makeColor(o[2]);
        tab.addoccluder(o[0][0], o[0][1], o[1][0], o[1][1], ocol);
    }

    // Add goals
    for (i = 0; i < d.Goals.length; i++) {
        g = d.Goals[i];
        gcol = makeColor(g[3]);
        tab.addgoal(g[0][0], g[0][1], g[1][0], g[1][1], gcol, g[2]);
    }

    // AbnormWalls and Paddles not implemented (yet)
    if (d.AbnormWalls.length !== 0) alert("AbnormWalls not supported");
    if (d.Paddle) alert("Paddle not supported");

    return tab;
};
