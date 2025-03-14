/**************************************************************************
 * INITIALIZATION
**************************************************************************/

// Initialize jsPsych.
var jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: false,
  on_finish: function() {
    //jsPsych.data.displayData();
    saveData();
  }
});

// Capture info from Prolific.
var subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
var study_id = jsPsych.data.getURLVariable('STUDY_ID');
var session_id = jsPsych.data.getURLVariable('SESSION_ID');
jsPsych.data.addProperties({
    subject_id: subject_id,
    study_id: study_id,
    session_id: session_id
});

// Set random seed.
const seed = jsPsych.randomization.setSeed();
jsPsych.data.addProperties({
    rng_seed: seed
});

/**************************************************************************
 * GLOBAL VARIABLES 
**************************************************************************/

var DEBUG = false; // CHANGE TO FALSE FOR REAL EXPERIMENT
var REQUIRE_QUESTIONS = !DEBUG; 

// Get stimuli according to list ID.
var stimuli = test_stimuli; // test_stimuli is read from prefixes_stimuli.js
var stimuli = jsPsych.randomization.sampleWithoutReplacement(test_stimuli, 30); // Shuffle data

if (DEBUG) {
  stimuli = jsPsych.randomization.sampleWithoutReplacement(stimuli, 5); // just use a small number of stimuli when debugging
}
var n_trials = stimuli.length; 

// Conditions.
var CONDITIONS = [
  "improbable", "impossible", "controversial"
];

// Dictionary of keyboard responses.
var RESPONSES = {
  "1": "improbable",
  "0": "impossible",
};

// These variables will be updated on each trial.
var CUR_QUERY = "";
var attempts = 0;

/**************************************************************************
 * HELPER FUNCTIONS
**************************************************************************/

function capitalizeFirstLetter(string) {
  return string[0].toUpperCase() + string.slice(1);
}

function get_stimulus(stimulus) {
  var stim = capitalizeFirstLetter(stimulus);
  return stim
}

/**************************************************************************
 * EXPERIMENT CODE
**************************************************************************/

/* create timeline */
var timeline = [];

// Instructions procedure
var instructions = {
  type: jsPsychHtmlKeyboardResponse,
  choices: " ",
  stimulus: `
  <div class="jspsych-content" align=left style="width:100%;text-align: left;">
  <h2>Hello, and welcome to our study!</h2>
      In this study, we will show you ${n_trials} simple statements.
      <p>
      We need your help deciding whether some things are <strong>improbable</strong> or <strong>impossible</strong>.
      </p>
      <strong>Improbable</strong> means it is possible, but unlikely. 
      <p>
      <ul><li>For example, "I painted the house with my hair."</li></ul>
      <p>
      <strong>Impossible</strong> means it cannot happen in our world given the laws of nature. 
      <p>
      <ul><li>For example, "I painted the house with my mind."</li></ul> 
      <p>
      You are going to be given ${n_trials} statements. Please categorize them into one of the two categories above.
      <p>
      Once you are done reading this page, please press SPACEBAR to continue.
      </p>
  </div>
      `
}
timeline.push(instructions);

// Pre-comprehension
var pre_compre = {
  type: jsPsychHtmlKeyboardResponse,
  choices:" ",
  stimulus: `
  <div class="jspsych-content" align=left style="width:100%;text-align: left;">
      <p>
          We are almost ready for the study. 
          Before we start, we have a few comprehension questions, 
          to make sure you understand the task.
      </p>
      <p>
          You will see a few statements and be asked to categorize them into one of the two categories: improbable or impossible.
      </p>
      <p> 
          You must correctly categorize <b>all</b> of the statements to move onto the experiment!
      </p>
      <p>
          Please press the <b>"1" key for Improbable</b> or the <b>"0" key for Impossible</b>.
      </p>
      <p>
          Press SPACEBAR to begin.
      </p>
      `
}
timeline.push(pre_compre);

// Comprehension stimuli
var compre_stimuli = [
  {q: "Moving furniture with your mind",a:'0'}, 
  {q: "Finding an alligator under your bed",a:'1'},
  {q: "Pouring yourself a glass of honey",a:'1'},
  {q: "Putting the moon in a soda can",a: '0'},
];

// Comprehension process
var comprehension = {
  type: jsPsychHtmlKeyboardResponse,
  prompt: `<p>
          Please press the <b>"1" key for Improbable</b> or the <b>"0" key for Impossible</b>.
      </p>`,
  stimulus: jsPsych.timelineVariable('q'),
  choices: ['1', '0'],
  margin_vertical: "24px",
  data: {
      task_type: 'comprehension',
      correct_response: jsPsych.timelineVariable('a'),
      attempts: 1
  },
  on_finish: function(data){
      data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
      data.attempts = attempts;
  }
}

// Comprehension procedure
var comprehension_procedure = {
  timeline: [comprehension],
  timeline_variables: compre_stimuli,
  loop_function: function(data){
      var responses = data.filter({task_type: "comprehension"});
      correct_responses = responses.select("correct");
      if (correct_responses.values.every(Boolean)) {
          return false; // don't loop
      }
      else {
          attempts += 1;
          alert("You answered one or more questions incorrectly! Try to pay attention this time and answer the questions correctly.")
          return true; // loop
      }
  }
}
timeline.push(comprehension_procedure);

// Post-comprehension check
var begin = {
  type: jsPsychHtmlKeyboardResponse,
  choices: " ",
  stimulus:  `
    <div class="jspsych-content" align=left style="width:100%;text-align: left;">
    <p>Congratulations, you passed the comprehension check! Now we will move onto the experiment.</p>
    <p>Remember, your task is to categorize sentences into one of these two categories: 
    <p>
    <strong>Improbable</strong> means it is possible, but unlikely. 
    <p>
    <ul><li>For example, "I painted the house with my hair."</li></ul>
    <p>
    <strong>Impossible</strong> means it cannot happen in our world given the laws of nature. 
    <p>
    <ul><li>For example, "I painted the house with my mind."</li></ul> 
    <p>
  <p>For the trials, we will show you one sentence at a time. Please try to categorize the sentence as quickly as you can. 
  </p>
  <p>Press SPACEBAR to begin the experiment.</p>
  </div>`
}
timeline.push(begin);

// Procedure for the trial slides
var trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    // Get last element of pre-generated order of conditions.
    CUR_QUERY = get_stimulus(
      jsPsych.timelineVariable("stimulus"), 
    );
    var html = `<div style="font-size:20px;"><p>${CUR_QUERY}</p></div>`;
    return html
  },
  choices: ['1', '0'],
  prompt: `<p>
          Please press the <b>"1" key for Improbable</b> or the <b>"0" key for Impossible</b>.
      </p>`,
  margin_vertical: "24px",
  data: {}
}
trial.on_start = function(trial){
  trial.data = jsPsych.getAllTimelineVariables();
  trial.data.task_type = "critical";
};
trial.on_finish = function(data){
  // at the end of each trial, update the progress bar
  // based on the current value and the proportion to update for each trial
  var cur_progress_bar_value = jsPsych.getProgressBarCompleted();
  jsPsych.setProgressBar(cur_progress_bar_value + (1/n_trials));

  // Save other variables.
  data.response_label = RESPONSES[data.response];
  data.query = CUR_QUERY;
};

// Prompt that follows each stimulus
var end_test_prompt = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
  <div style="font-size:20px;">
      <p>Your response has been logged.</p>
  </div>
  `,
  trial_duration: 1000,
  choices: "NO_KEYS",
  data: {
      task: 'prompt'
  }
}

/* define test procedure */
var test_procedure = {
  timeline: [trial, end_test_prompt],
  timeline_variables: stimuli,
  randomize_order: true
};
timeline.push(test_procedure);

/* define postquestionnaire */
var post_test_survey = {
  type: jsPsychSurveyText,
  preamble: `
    <p>Thanks for contributing to our study, and have a nice day!</p>
    <p>The following questions are optional, but your feedback would really help us improve our study for future participants.</p>
  `,
  questions: [
    {prompt: "What is your native language?", name: 'language'},
    {prompt: "What is your gender?", name: 'gender'},
    {prompt: "Please leave any additional feedback in the text box below.", name: 'feedback', rows: 10}
  ],
  on_finish: function(data) {data.task_type = "survey"}
};
timeline.push(post_test_survey);

/* start the experiment */
function run_experiment() {
    jsPsych.run(timeline);
}