/*
 * Library for processing experiment flow. Includes Experiment and Instructions classes with supporting functions
 * for instructions, running through trials, recording user inputs and trial results, then loading subsequent trials.
 */

 /*
 * Instructions class for providing instructions used during experiment.
 */
Instructions = function(triallist, trialpath, playbook, table, leftctr, rightctr, score, trcounter) {
    this.playbook = playbook;
    this.rol = true;
    this.trial = new Trial(table, leftctr, rightctr, score, trcounter, this.rol);
    this.trial.displaytext("Please wait for all of the data to load.");
    var trialJson = readJson(triallist);
    this.trlist = trialJson.data;
    this.loaded = new TrialList(this.trlist, trialpath);
    this.badtrial = false; // Holder for if window is too small or minimized
    this.trial.trcounter.setnumtrials(this.trlist.length);
    console.log("New Instructions: \n", this);
};

Instructions.prototype.runInstructions = function(playbookIndex, exp) {
    // Callback to be executed after showing instruction text
    // NB: could flesh this out more as needed for more complicated instructions
    instructionsCallback = function() {
        that.runInstructions(++playbookIndex, exp);
    };
    // Callback to be executed after doing an instruction trial
    // Includes logic for assessing minimum score and other conditions for proceeding to the next instruction element
    trialCallback = function() {
        // repeat this instruction element if the screen was not properly sized during the trial
        if (that.badtrial) {
            that.trial.showinstruct(ISIZING, function() {
                that.runInstructions(playbookIndex, exp);
            });
            that.badtrial = false;
            return;
        // if the instruction element includes a score requirement, evaluate whether the user achieved that score
        // then either proceed to the next instruction element or have them repeat this trial to achieve the
        // required score
        } else if ("scoreMin" in instructionElem || "scoreEquals" in instructionElem) {
            assert (("failureMessage" in instructionElem),
                    "Instruction playbook must include `failureMessage` alongside `scoreMin` or `scoreEquals` conditions");
            var canProceed = false;
            if ("scoreMin" in instructionElem) canProceed = (that.trial.lastscore >= instructionElem["scoreMin"]);
            else if ("scoreEquals" in instructionElem) canProceed = (that.trial.lastscore == instructionElem["scoreEquals"]);
            if (canProceed) {
                that.trial.score.reset();
                that.runInstructions(++playbookIndex, exp);
                return;
            } else {
                that.trial.score.reset();
                that.trial.showinstruct(instructionElem["failureMessage"], function() {
                    that.runInstructions(playbookIndex, exp);
                });
                that.badtrial = false;
                return;
            }
        // if none of the above conditions for screen size or trial success/failure, proceed to the next instruction element
        } else {
            that.trial.score.reset();
            that.runInstructions(++playbookIndex, exp);
            return;
        }
    };

    // Execution of instructions
    var that = this;
    if (playbookIndex >= that.playbook.length)  {
        // hacky patch to clear out keyhandlers before starting
        // TODO erikb figure out why exp has residual keyhandlers
        exp.trial.keyhandler = new KeyHandler(
            Object.keys(KEYMAP),
            function(k) {},
            function(k) {}
        );
        exp.startTrials();
    } else {
        var instructionElem = that.playbook[playbookIndex];
        switch (instructionElem["type"]) {
            // If the element is of type `instructions`, show instruction message and proceed to the next instruction element
            case "instruction":
                that.trial.showinstruct(instructionElem["message"], instructionsCallback);
                break;
            // If the element is of type `trial`, have user play through the trial, then run a callback which
            // evaluates a series of conditions for moving on to the next instruction element
            case "trial":
                that.badtrial = false;
                trialIndex = that.loaded.tnms.indexOf(instructionElem["trialName"]);
                assert(trialIndex != -1, "Unable to load instruction trial");
                that.trial.loadFromTList(that.loaded.tnms[trialIndex], that.loaded);
                that.trial.runtrial(DT, DISPLAY_TIME, RESPONSE_TIME, MAX_TIME, trialCallback,
                    instructionElem["randomizegoal"], instructionElem["showscore"]);
                break;
            default:
                return;
        }
    }
};


/*
 * Experiment class for cycling through trials and recording results.
 * This class initiates a Trial class for each trial but handles the bulk of overall experiment logic.
 */
Experiment = function(instructions, triallist, trialpath, table, leftctr, rightctr, score, trcounter, istest, isshort) {
    this.istest = istest; // `test` experiments simulate a real experiment but write results as TEST_{exptid}.json
    this.isshort = isshort; // `short` experiments run only instructions and two trials and do not write results to the server

    this.instructions = instructions;
    exptindex = new Date().getTime(); // unique user identifier based on unix timestamp
    if (this.istest) {
        this.exptid = "TEST_" + exptindex;
    } else {
        this.exptid = "user_" + exptindex;
    }

    // Load in the trial object
    this.rol = Math.random() < 0.5;
    this.trial = new Trial(table, leftctr, rightctr, score, trcounter, this.rol);
    this.trial.displaytext("Please wait for all of the data to load.");
    // Load in the list of trials to use & shuffle them
    var trialJson = readJson(triallist);
    this.trlist = shuffle(trialJson.data); // NB: comment this out during testing
    this.tridx = 0;
    this.loaded = new TrialList(this.trlist, trialpath);
    this.badtrial = false; // Holder for if window is too small or minimized
    this.trial.trcounter.setnumtrials(this.trlist.length);
    this.trial.trcounter.display = true;
    console.log("New Experiment: \n", this);
};

Experiment.prototype.runInstructions = function() {
    var that = this;
    var playbookIndex = 0;
    this.instructions.runInstructions(playbookIndex, that);
};

Experiment.prototype.startTrials = function() {
    var that = this;
    that.trial.loadFromTList(that.loaded.tnms[0], that.loaded);
    that.trial.draw();
    that.run(that);
};

Experiment.prototype.run = function(me) {
    me.badtrial = false;
    me.trial.runtrial(DT, DISPLAY_TIME, RESPONSE_TIME, MAX_TIME, function () {
        me.recordTrial(me);
        me.nextTrial(me);
    });
};

Experiment.prototype.nextTrial = function(me) {
    me.badtrial = false; // Reset badness
    me.tridx++;
    if (me.tridx >= me.trlist.length) {
        me.trial.showinstruct("Congrats! You are now done!<br><br>Press the spacebar to clear the screen.",
            function() {me.endExp(me);});
        return;
    }
    me.trial.trcounter.incr();
    me.trial.loadFromTList(me.loaded.tnms[me.tridx], me.loaded);
    me.run(me);
};

Experiment.prototype.recordTrial = function(me) {
    assert(me.trial.done, "Cannot record trial that is not finished");
    if (me.badtrial) {
        var bi = "Please keep the window open, on top of the screen, and large enough to see everything";
        me.trial.showinstruct(bi, function() {me.nextTrial(me);});
        return;
    }

    var ts = new Date().getTime(); // timestamp for trial completion logging
    var trname = me.trial.tb.name; // trial name
    var trstruct = me.loaded.trials[me.tridx]; // original json structure of this trial so that we could re-construct it if necessary
    var goalsw = me.trial.isswitched(); // whether goal was switched at trial run time

    var resp;  // response selected
    if (me.trial.response in SERVER_LOG_LOOKUP) resp = SERVER_LOG_LOOKUP[me.trial.response];
    var realgoal; // correct goal (red or green)
    if (me.trial.realgoal in SERVER_LOG_LOOKUP) realgoal = SERVER_LOG_LOOKUP[me.trial.realgoal];

    var resptime = me.trial.resptime; // response time
    var simultime = me.trial.simultime; // time to simulate outcome
    var sc = me.trial.lastscore; // trial score

    var trialData = {
        "logts": ts, // timestamp for this trial completion
        "trialname": trname, // name of the file used for this trial
        "trialindex": me.trial.trcounter.count, // ordinality for this trial completion
        "trialstructure": trstruct, // location of all elements in the trial so we could re-construct it as needed
        "goaldistances": me.trial.goaldistances, // closest line to each of the goals from the ball's waiting position
        "numwalls": trstruct.Walls.length, // number of walls and obstacles in this trial
        "walldistances": me.trial.walldistances, // closest line to each of the walls from the ball's waiting position
        "numbounces": me.trial.bounces, // number of times the ball bounced off a wall or obstacle
        "ballstartpos": me.trial.ballstartpos, // Starting position of the ball
        "ballwaitpos": me.trial.ballwaitpos, // Position of the ball when participants guess a target
        "trialtarget": realgoal, // true target the ball hit first on this trial ('red' or 'green')
        "targetswitched": goalsw, // whether the target color was switched at trial display time
        "usertarget": resp, // which target the user selected in this trial ('red', 'green', or 'no response')
        "responsetime": resptime, // response time for the user selecting a target in this trial
        "simtime": simultime, // time required for simulating the result of the ball in this trial
        "score": sc // score given to the user in this trial (exponential decay function of responsetime)
    };

    if (me.isshort) console.log("Gathered trial data: ", trialData); // NB: this can slow down browser over many trials
    me.trial.trialData.push(trialData);
};

Experiment.prototype.endExp = function(me) {
    // Clear out screen elements
    $(me.trial.lbtn.ele).hide();
    $(me.trial.rbtn.ele).hide();
    $(me.trial.score.ele).hide();
    $(me.trial.trcounter.ele).hide();
    $(me.trial.tbele).hide();

    var expt = {
        "exptname": TASK_NAME, // name of experiment for easy reference
        "exptversion": TASK_VERSION // version number for the broader experiment run (in case we modify subsequently)
    };
    var client = {
        "sid": me.exptid, // unique ID for this user. NB: this needs to be called `sid` for data logging in submit.php
        "test": me.istest
    };
    var data = {
        "expt": expt,
        "client": client,
        "trials": me.trial.trialData
    };

    console.log("Data collected: \n", data);
    if (me.isshort) {
        console.log("In `short` mode so NOT writing data to server.");
    } else {
        console.log("Writing data to server.");
        me.logToServer(data);
    }
};

Experiment.prototype.logToServer = function(data) {
    results = JSON.stringify(data);
    $.ajax({
        dataType: "json",
        type: "POST",
        url: DATA_WRITE_ENDPOINT,
        data: {data: results},
        success: function(data){console.log("Success saving data!");},
        error: function(xhr, status, error) {
            console.log("Failure saving data. \n" +
                        "Response: " + xhr.responseText + "\n" +
                        "Status: " + status + "\n" +
                        "Error: " + error);
        }
    });
}

/*
 * Function to check the window size, and determine whether it is
 * large enough to fit the given experiment. If the window size is not
 * large enough, it hides the experiment display and instead displays
 * the error in the #window-error DOM element. If the window size is
 * large enough, then this centers the experiment horizontally and
 * vertically.
 *
 * From Jessica Hamrick - thanks Jess!
 *
 * @param {Experiment} exp - The experiment object
 */
windowsizer = function(minx, miny, exp) {
    this.x = minx;
    this.y = miny;
    this.tbshown = false;
    this.replaced = false;
    this.exp = exp;

    this.checkSize = function(wsme) {
        var maxWidth = $(window).width(),
            maxHeight = $(window).height();

        $("#textfield").width(Math.min(1000, maxWidth));

        if ((minx > maxWidth) || (miny > maxHeight)) {
            wsme.exp.badtrial = true;
            if ($("#table").is(":visible")) {
                $("#table").hide(0);
                wsme.tbshown = true;
            }
            if (!wsme.replaced) {
                wsme.exp.trial.replaceText("Your window is too small for this experiment. Please make it larger.", hideall = false);
                wsme.replaced = true;
            }
            $("#textfield").show(0);
            return;
        }
        if (wsme.replaced) {
            wsme.exp.trial.restoreText(hideall = false);
            wsme.replaced = false;
        }
        if (wsme.tbshown) {
            $("#table").show(0);
            $("#textfield").hide(0);
        }
        wsme.tbshown = false;
    };
};
