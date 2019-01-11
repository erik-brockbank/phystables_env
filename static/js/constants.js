/*
 * Global variables related to experiments that are run with these libraries
 * These are stored here rather than in individual js libraries for easier modification
 */

const TASK_NAME = "containment_physics"; // Logged as part of experiment data
const TASK_VERSION = "1.0"; // Logged as part of experiment data, modify in case we run subsequent versions

// Reading trial data and writing results
const CONDITION_LIST_PATH = "trials"
const CONDITION_LIST = "ConditionList.json"
const CONDITION_LIST_TEST = "ConditionListTest.json"
const CONDITION_LIST_INST = "ConditionListInstructions.json"
const DATA_WRITE_ENDPOINT = "submit.php"

// window size correction constants
const WINDOWSIZER_WIDTH_DEFAULT = 1010;
const WINDOWSIZER_HEIGHT_DEFAULT = 755;

// Constants for experiment flow
const DT = 0.025; // Interval for drawing ball movements
const DISPLAY_TIME = 0.5; // Amount of time (secs) to show inital simulation before participant response
const RESPONSE_TIME = 10; // Max amount of (secs) time for participant response after initial simulation
const MAX_TIME = 20; // Max amount of time (secs) for simulating ball movement after participant response

const DEFAULTVEL = [175, 180];

// Color constants
const BLUE = "rgb(0,0,255)";
const BLACK = "rgb(0,0,0)";
const GREEN = "rgb(0,255,0)";
const RED = "rgb(255,0,0)";
const WHITE = "rgb(255,255,255)";

//  Return constants
const TIMEUP = 101;
const SUCCESS = 102;
const FAILURE = 103;
const OUTOFBOUNDS = 104;
const UNCERTAIN = 105;
const REDGOAL = 201;
const GREENGOAL = 202;
const BLUEGOAL = 203;
const YELLOWGOAL = 204;
const NORESPONSE = 299;

// Maps return constants to human-readable logging vals
// Add to this as needed for logging purposes
const SERVER_LOG_LOOKUP = {
    201: "red",
    202: "green",
    299: "no response"
}

// Keymap constants
const KEYMAP = {
    32: "space",
    82: "r",
    71: "g"
};

const KEYMAP_INV = {
    "space": 32,
    "r": 82,
    "g": 71
};

const KEY_COLOR_MAP = {
    "rgb(255,0,0)": "r",
    "rgb(0,255,0)": "g"
};

// Variables for scoring
const STARTING_SCORE = 100; // Starting score for a given trial, goes down as response time increases. NB: it's possible to get more than 100 because of the buffer constant
const DISCOUNT_FACTOR = 0.0001; // response time (ms) multiplied by discount factor in score calculation
const BUFFER_CONSTANT = 250; // buffer constant (ms) subtracted from response time for better score calculation


// Text constants for each phase of instructions
var ISIZING = "Please keep the window open and large enough for the experiment";

var I1 = "In this experiment, you will see a ball bouncing around the screen for a short amount " +
    "of time and then stop.<br><br> You will need to predict whether it would go into the red or " +
    "the green goal if it continued to move on its trajectory.<br><br> There are walls and obstacles " +
    "that the ball can bounce off of, which affect which goal the ball would go into.<br><br> " +
    "Press the spacebar to continue.";

var I2 = "There will be a red 'r' button and a green 'g' button at the bottom of the screen. " +
    "You should press the 'r' key if you think the ball will go in the red goal, or the 'g' key " +
    "if you think the ball will go in the green goal.<br><br> But you can't make your prediction " +
    "at any time - you will need to press the key corresponding to your prediction after the keys " +
    "flash on at the bottom of the screen. <br><br> Once you have made your prediction, you will " +
    "see the full path of the ball.<br><br> Press the spacebar to see an example.";

var I3 = "The longer you take to push the button and make your prediction, the fewer points you get.<br><br> " +
    "Press the spacebar to continue, then press the 'r' key after it flashes at the bottom of " +
    "the screen to earn some points.";

var I4 = "Watch out though - if you press the key for the wrong goal, you will lose points.<br><br> " +
    "Press the spacebar to continue, then press the 'g' key to see how you can lose points.";

var I5 = "Now let's try a couple sample games before we start the experiment.<br><br> Press the spacebar to continue.";

var I6 = "One more practice round.<br><br> Press the spacebar to continue.";

var I7 = "You are now done with the instructions. <br> <br> Press the spacebar to start earning points!";

var Ifailure1 = "You didn't press the 'r' key fast enough.<br><br> Press the spacebar to try again";
var Ifailure2 = "You didn't press the 'g' key.<br><br> Press the spacebar to try again";


/*
 * INSTRUCTION_PLAYBOOK has each element that a user must work through for the instructions of the experiment.
 * The elements of the playbook can be of type `instructions` or type `trial`. The `instructions` type must include a message
 * and the `trial` type must include the name of a trial to load, whether to randomize the goal and show the score afterwards,
 * and then optionally a condition for success on the trial. The processing code in exp.js Instructions.runInstructions
 * currently supports success conditions of "scoreMin" and "scoreEquals", i.e. the user must get a minimum score of X or
 * a score equal to Y in order to proceed to the next segment of instructions. However, other such conditions could easily
 * be added, e.g. "timeMin" for a minimum response time. When such success conditions are included, a `failureMessage`
 * must also be included to indicate to the user that they failed to meet the success conditions.
 */
const INSTRUCTION_PLAYBOOK = [
    {
        "type": "instruction",
        "message": I1
    },
    {
        "type": "instruction",
        "message": I2
    },
    {
        "type": "trial",
        "trialName": "InstTr1.json",
        "randomizegoal": false,
        "showscore": false
    },
    {
        "type": "instruction",
        "message": I3
    },
    {
        "type": "trial",
        "trialName": "InstTr1.json",
        "randomizegoal": false,
        "showscore": true,
        "scoreMin": 10, // user must get a score >= 10 to proceed to the next phase of instructions
        "failureMessage": Ifailure1
    },
    {
        "type": "instruction",
        "message": I4
    },
    {
        "type": "trial",
        "trialName": "InstTr1.json",
        "randomizegoal": false,
        "showscore": true,
        "scoreEquals": -10, // user must get a score equal to -10 to proceed to the next phase of instructions
        "failureMessage": Ifailure2
    },
    {
        "type": "instruction",
        "message": I5
    },
    {
        "type": "trial",
        "trialName": "InstTr2.json",
        "randomizegoal": false,
        "showscore": true,
    },
    {
        "type": "instruction",
        "message": I6
    },
    {
        "type": "trial",
        "trialName": "InstTr3.json",
        "randomizegoal": false,
        "showscore": true,
    },
    {
        "type": "instruction",
        "message": I7
    },
];
