/*
 * Startup library for URL processing, loading in html content, and initializing Experiment class
 */

$(window).ready(function() {
    $("#consent").show();
});

clickConsent = function() {
    $("#consent").show();
    /* parse URL for shortcuts and testing
        Ex. http://localhost:1337/exp.html?&mode=test --> `test` mode will write a results json file with TEST_...
        http://localhost:1337/exp.html?&mode=short --> `short` mode will only proceed through instructions and two trials and
                                                        will not write a results json file
    */
    var istest = false;
    var isshort = false;
    var urlParams = new URLSearchParams(window.location.href);
    if (urlParams.has("mode")) {
        var mode = urlParams.get("mode");
        if (mode == "test") istest = true;
        else if (mode == "short") isshort = true;
    }
    $("body").load("canvas.html", function() {
        $(".field").hide(0);

        // Initialize experiment instructions
        var instListPath = CONDITION_LIST_PATH + "/" + CONDITION_LIST_INST;
        var inst = new Instructions(instListPath, CONDITION_LIST_PATH, INSTRUCTION_PLAYBOOK,
            "table", "lbutton", "rbutton", "score", "trialcounter");

        // Initialize experiment
        var trialListPath = CONDITION_LIST_PATH + "/" + CONDITION_LIST;
        if (isshort) trialListPath = CONDITION_LIST_PATH + "/" + CONDITION_LIST_TEST;
        var exp = new Experiment(inst, trialListPath, CONDITION_LIST_PATH, "table", "lbutton", "rbutton", "score", "trialcounter", istest, isshort);

        // Initialize windowsizer to monitor windowsize during experiment
        // ws = new windowsizer(WINDOWSIZER_WIDTH_DEFAULT, WINDOWSIZER_HEIGHT_DEFAULT, exp);
        // ws.checkSize(ws);
        // $(window).resize(function() {ws.checkSize(ws);});
        // $(window).blur(function() {exp.badtrial = true;});

        exp.runInstructions();
    });
}
