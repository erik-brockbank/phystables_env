/*
 * Library for processing each trial within an experiment. Includes Trial class for bulk of trial handling,
 * as well as classes for other elements of a trial: buttons, score display, trial counter, and key handler
 */

Button = function(color, elemname) {
    this.color = color;
    this.ele = document.getElementById(elemname);
    this.ctx = this.ele.getContext("2d");

    // Setup the drawing
    var wid = this.ele.width;
    var hgt = this.ele.height;
    $("#"+elemname).css({"border-color":this.color});

    var boxleft = 0;

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = "black";
    this.ctx.fillRect(boxleft, 0, wid, hgt);

    this.ctx.font = "30px Times New Roman bold";
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.color === RED ? KEY_COLOR_MAP[RED] : KEY_COLOR_MAP[GREEN], boxleft + wid / 2, hgt / 2);

    this.draw();
};

Button.prototype.draw = function(clear = false) {
    if (clear) this.ctx.clearRect(0, 0, this.ele.width, this.ele.height);
    else {
	    this.ctx.fillStyle = this.color;
        this.ctx.fillRect(0, 0, this.ele.width, this.ele.height);
        $(this.ele).css({"border-color":this.color});
        this.ctx.fillStyle = "black";
        this.ctx.fillText(this.color === RED ? KEY_COLOR_MAP[RED] : KEY_COLOR_MAP[GREEN], this.ele.width / 2, this.ele.height / 2);
    }
};

ScoreDisp = function(elemname) {
    this.ele = document.getElementById(elemname);
    this.ctx = this.ele.getContext("2d");
    this.score = 0;
};

ScoreDisp.prototype.add = function(sc) {
    this.score += sc;
};

ScoreDisp.prototype.draw = function() {
    var ewid = this.ele.width;
    var ehgt = this.ele.height;

    this.ctx.clearRect(0, 0, this.ele.width, this.ele.height);

    this.ctx.font = "20px Times New Roman bold";
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillText("Score:", ewid / 2, 0);

    this.ctx.textBaseline = "bottom";
    this.ctx.fillText(this.score, ewid / 2, ehgt);

};

ScoreDisp.prototype.reset = function() {
    this.score = 0;
};

TrialCounter = function(elemname) {
    this.ele = document.getElementById(elemname);
    this.ctx = this.ele.getContext("2d");
    this.count = 1;
    this.numtrials = 1;
    this.display = false;
};

TrialCounter.prototype.incr = function() {
    this.count += 1;
};

TrialCounter.prototype.setnumtrials = function(numtrials) {
    this.numtrials = numtrials;
};

TrialCounter.prototype.draw = function() {
    if (!this.display) return;

    var ewid = this.ele.width;
    var ehgt = this.ele.height;

    this.ctx.clearRect(0, 0, this.ele.width, this.ele.height);

    this.ctx.font = "20px Times New Roman bold";
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillText("Trial:", ewid - 40, 0);

    this.ctx.textBaseline = "bottom";
    this.ctx.fillText(this.count + "/" + this.numtrials, ewid - 40, ehgt);
    this.ctx.fillStyle = "white";

};

TrialCounter.prototype.reset = function() {
    this.count = 1;
};

/**
 *
 * @param {array} keys - array of keys to keep track of (using jquery numbering)
 * @param {function} onkeypress - a function that takes in the key pressed and gets called when
 *                           one of the tracked keys is pressed
 * @param {function} onkeyrelease - like onkeypress, but for when a key is released
 * @returns {KeyHandler}
 */
KeyHandler = function(keys, onkeypress, onkeyrelease) {
    this.keys = keys;
    this.state = {};
    for (i = 0; i < keys.length; i++) {
        this.state[keys[i]] = false;
    }
    this.onkp = onkeypress;
    this.onkr = onkeyrelease;
    // Set handlers
    var that = this;
    var k;
    $(document).keydown(function(event) {
        k = event.which;
        if (that.keys.indexOf(k + "") > -1) {
            if (that.state[k] === false) {
                that.state[k] = true;
                that.onkp(k);
            }
        }
    });
    $(document).keyup(function(event) {
        k = event.which;
        if (that.keys.indexOf(k + "") > -1) {
            that.state[k] = false;
            that.onkr(k);
        }
    });
};
KeyHandler.prototype.getstate = function() {return this.state;};
KeyHandler.prototype.setpress = function(fn) {this.onkp = fn;};
KeyHandler.prototype.setrelease = function(fn) {this.onkr = fn;};

Trial = function(table, leftbtn, rightbtn, score, trcounter, redonleft) {
    this.trialData = []; // List for storing data from each trial, used when logging at end
    this.rol = redonleft;
    this.tbele = tbele = document.getElementById(table);

    if (redonleft) {lbcol = RED; rbcol = GREEN;}
    else {lbcol = GREEN; rbcol = RED;}
    this.lbtn = new Button(lbcol, leftbtn);
    this.rbtn = new Button(rbcol, rightbtn);

    this.score = new ScoreDisp(score);
    this.trcounter = new TrialCounter(trcounter);
    this.response = NORESPONSE;
    this.resptime = -1;
    this.goalswitched = false;
    this.done = false;
    this.paused = false;

    assert(tbele.getContext, "No support for canvases!");
    this.tb = new Table("tmp", tbele.width, tbele.height, tbele);

    // Initialize handler with no functions
    this.keyhandler = new KeyHandler(
        Object.keys(KEYMAP),
        function(k) {},
        function(k) {}
    );
};

Trial.prototype.loadFromTList = function(trname, trlist) {
    this.tb = trlist.loadTrial(trname, this.tbele);
    this.done = false;
    this.realgoal = this.gettrialgoal(DT);
    this.bounces = this.gettrialbounces(DT);
    this.response = NORESPONSE;
    this.resptime = -1;
};

Trial.prototype.draw = function(displayButtons = true) {
    this.tb.draw();
    this.lbtn.draw(displayButtons);
    this.rbtn.draw(displayButtons);
    this.score.draw();
    this.trcounter.draw();
};

Trial.prototype.step = function(dt) {
    var e = this.tb.step(dt);
    // Do event handling here
    this.draw();
    return e;
};

Trial.prototype.gettrialsteps = function(dt) {
    var tableclone = this.tb.clone();
    var nsteps = 0;
    var e = 0;
    while (e === 0) { e = tableclone.step(dt); nsteps++; }
    return nsteps;
};

Trial.prototype.gettrialgoal = function(dt) {
    // BEWARE this function can fail to terminate which quietly hangs the browser
    var tableclone = this.tb.clone();
    var e = 0;
    while (e === 0)
        e = tableclone.step(dt);
    return e;
};

Trial.prototype.gettrialbounces = function(dt) {
    // BEWARE this function can fail to terminate which quietly hangs the browser
    var tableclone = this.tb.clone();
    tableclone.bounces = 0;
    var e = 0;
    while (e === 0)
        e = tableclone.step(dt);
    return tableclone.bounces;
};

Trial.prototype.displaytext = function(text, textcol = "black", bkcol = "white", hideall = true) {
    if (text.substring(0, 6) === "<span>") htmtext = text;
    else htmtext = "<span>" + text + "</span>";
    $("#" + this.tbele.id).hide(0);
    if (typeof(hideall) !== "undefined" & hideall) {
        $("#" + this.lbtn.ele.id).hide(0);
        $("#" + this.score.ele.id).hide(0);
        $("#" + this.rbtn.ele.id).hide(0);
        $("#" + this.trcounter.ele.id).hide(0);
    }
    tf = $("#textfield");
    tf.html(htmtext);
    tf.css({"background-color":bkcol, "color":textcol});
    tf.show(0);
};

Trial.prototype.hidetext = function() {
    $("#" + this.tbele.id).show(0);
    $("#" + this.lbtn.ele.id).show(0);
    $("#" + this.score.ele.id).show(0);
    $("#" + this.rbtn.ele.id).show(0);
    $("#" + this.trcounter.ele.id).show(0);
    $("#textfield").hide(0);
};

Trial.prototype.showinstruct = function(text, callback, textcol = "black", bkcol = "white", hideall = true) {
    this.displaytext(text, textcol, bkcol, hideall);
    // Wait until a click
    var that = this;
    this.keyhandler.setpress(function(k) {
        if (k === KEYMAP_INV["space"]) {
            that.hidetext();
            that.keyhandler.setpress(function(k) {});
            callback();
        }
    });
};

Trial.prototype.replaceText = function(newtext, textcol, bkcol, hideall) {
    this.oldtext = $("#textfield").html();
    this.displaytext(newtext, textcol, bkcol, hideall);
};

Trial.prototype.restoreText = function(textcol, bkcol, hideall) {
    this.displaytext(this.oldtext, textcol, bkcol, hideall);
    this.oldtext = "";
};

Trial.prototype.writenewscore = function(newscore, showscore = true) {
    // Only allow showscore to be false when it is explicitly set as such
    var tx1 = "You earned " + newscore + " points on this trial";
    var tx2 = "Press spacebar to continue";

    var ctx = this.tbele.getContext("2d");
    ctx.font = "30px Times New Roman";
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.textAlign = "center";

    var newwid = 10 + Math.max(ctx.measureText(tx1).width, ctx.measureText(tx2).width);

    var centx = this.tbele.width / 2;
    var centy = this.tbele.height / 2;

    ctx.clearRect(centx - newwid / 2, centy - 37.5, newwid, 75);
    ctx.strokeRect(centx - newwid / 2, centy - 37.5, newwid, 75);

    // Unless showscore is explicitly false, show score
    if (!showscore) {
        ctx.textBaseline = "middle";
        ctx.fillText(tx2, centx, centy);
    } else {
        ctx.textBaseline = "top";
        ctx.fillText(tx1, centx, centy - 32.5);
        ctx.textBaseline = "bottom";
        ctx.fillText(tx2, centx, centy + 32.5);
    }
};

Trial.prototype.calculateScore = function() {
    var that = this;
    var score = 0;
    if (that.response !== that.realgoal & that.response !== NORESPONSE) {
        score = -10;
    } else if (that.response === that.realgoal) {
        /*
        Scoring mechanism: exponential decay subtracts X% from score for every ms of response time
        Response times close to 0 will have score close to STARTING_SCORE, otherwise exponential decay towards 0
        NB: can fiddle with the DISCOUNT_FACTOR and BUFFER_CONSTANT for more or less gradual decay
        */
        score = Math.pow(STARTING_SCORE, (1 - (DISCOUNT_FACTOR * (that.resptime - BUFFER_CONSTANT))));
        score = Math.round(score, 0);
    }
    return score;
};

Trial.prototype.showtrial = function(dt, displaytime, responsetime, maxtime, callback, showscore) {
    var that = this;
    // store trial ball vel
    var vel = this.tb.ball.getvel();

    // function to be called after subject response
    var finishtrial = function() {
        that.keyhandler.setpress(function(k) {});
        // display trial ending for feedback at triple speed
        var pev = 0;
        starttime = new Date()
        interid = setInterval(function () {
            pev = that.tb.step(dt, maxtime);

            that.draw(true);

            if (pev !== 0) {
                if (pev == TIMEUP) {
                    console.warn("Trial took to long, exited before target result: ", this.exp.trial.tb.name);
                }
                clearInterval(interid);
                // set time to simulate
                that.simultime = (new Date() - starttime);
                // Update score
                var score = that.calculateScore();
                that.score.add(score);
                that.draw(true);
                that.writenewscore(score, showscore);
                that.done = true;
                that.lastscore = score;
                that.keyhandler.setpress(function(k) {
                    if (k === KEYMAP_INV["space"]) {
                        that.hidetext();
                        that.keyhandler.setpress(function(k) {});
                        callback();
                    }
                });

            }
        }, dt * 1000 / 3);
    };

    // function to be called after trial display, to wait for response
    var waitresponse = function() {
        // Flash something to signal beginning of response period
        that.draw(false);

        var timeoutid;
        var start = new Date();
        // Collect relevant data about state while ball is paused
        that.ballwaitpos = Object.assign({}, that.tb.ball.getpos());
        that.goaldistances = [];
        that.walldistances = [];
        for (i = 0; i < that.tb.goals.length; i++) {
            g = that.tb.goals[i];
            var closestdist = cleverdist(that.ballwaitpos.x, that.ballwaitpos.y,
                                            g.left, g.top, g.right, g.bottom);
            var goalname;
            if (g.onret == REDGOAL) goalname = "red";
            else goalname = "green";
            that.goaldistances.push({"name": goalname, "goal": g, "goaldist": closestdist});
        }
        for (i = 0; i < that.tb.walls.length; i++) {
            g = that.tb.walls[i];
            var closestdist = cleverdist(that.ballwaitpos.x, that.ballwaitpos.y,
                                            g.left, g.top, g.right, g.bottom);
            that.walldistances.push({"wall": g, "walldist": closestdist});
        }

        that.keyhandler.setpress(function(k) {
            if (k === KEYMAP_INV["r"]) {
                that.keyhandler.setpress(function(k) {});
                clearTimeout(timeoutid);
                that.resptime = (new Date() - start); // response time in ms
                that.response = REDGOAL;
                finishtrial();
            }
            else if (k === KEYMAP_INV["g"]) {
                that.keyhandler.setpress(function(k) {});
                clearTimeout(timeoutid);
                that.resptime = (new Date() - start);
                that.response = GREENGOAL;
                finishtrial();
            }
        });
        // Possible race condition, multiple calls to finishtrial
        timeoutid = setTimeout(finishtrial, responsetime * 1000);
    };

    // set ball vel by motion condition
    this.tb.ball.setvel(vel["x"], vel["y"]);
    // display trial
    var pev = 0;
    interid = setInterval(function () {
        pev = that.tb.step(dt, displaytime);
        that.draw(true);
        if (pev !== 0) {
            assert(pev === TIMEUP, "Oddly, your trial ended too soon");
            clearInterval(interid);
            waitresponse();
        }
    }, dt * 1000);
};

Trial.prototype.switchgoal = function() {
    var g;
    for (i = 0; i < this.tb.goals.length; i++) {
        g = this.tb.goals[i];
        if (g.onret === GREENGOAL) {
            g.onret = REDGOAL;
            g.color = RED;
        } else {
            g.onret = GREENGOAL;
            g.color = GREEN;
        }
    }

    if (this.realgoal === GREENGOAL) {
        this.realgoal = REDGOAL;
    } else {
	    this.realgoal = GREENGOAL;
    }
};

Trial.prototype.isswitched = function() {
    return this.goalswitched;
};

Trial.prototype.runtrial = function(dt, displaytime, responsetime, maxtime, callback, randomizegoal = true, showscore) {
    if (randomizegoal) {
        if (Math.random() < 0.5) {
            this.switchgoal();
            this.goalswitched = true;
        } else this.goalswitched = false;
    } else this.goalswitched = false;

    var that = this;
    that.ballstartpos = Object.assign({}, that.tb.ball.getpos());
    var runfn = function() {that.showtrial(dt, displaytime, responsetime, maxtime, callback, showscore);};
    this.showinstruct("Press the spacebar to begin", runfn, "black", "lightgrey");
};
