document.addEventListener('DOMContentLoaded', function() {
    const words = [
      "apple", "banana", "carrot", "door", "elephant", "flower", "guitar",
      "house", "ice", "jacket", "kite", "lemon", "monkey", "notebook",
      "orange", "piano", "queen", "river", "sun", "tree"
    ];
  
    const welcome = {
      type: 'html-button-response',
      stimulus: '<p>Welcome to the memory test experiment</p>',
      choices: ['Start']
    };
  
    const instructions_with_music = {
      type: 'html-button-response',
      stimulus: '<p>Memorize the following words while listening to music.</p>',
      choices: ['Begin']
    };
  
    const instructions_without_music = {
      type: 'html-button-response',
      stimulus: '<p>Memorize the following words without any music.</p>',
      choices: ['Begin']
    };
  
    const playMusic = {
      type: 'call-function',
      func: function() {
        const audio = new Audio('music_for_stats.mp3');
        audio.loop = true;
        audio.play();
        jsPsych.data.addProperties({ music: audio });
      }
    };
  
    const stopMusic = {
      type: 'call-function',
      func: function() {
        const audio = jsPsych.data.get().select('music').values[0];
        audio.pause();
      }
    };
  
    const wordStimuli = words.map(word => ({
      type: 'html-keyboard-response',
      stimulus: `<p>${word}</p>`,
      choices: jsPsych.NO_KEYS,
      trial_duration: 9000
    }));
  
    const recall = {
      type: 'survey-text',
      questions: [
        {prompt: "Type as many words as you can remember:", rows: 10, columns: 50}
      ],
      data: { task: 'recall' }
    };
  
    const thankYou = {
      type: 'html-button-response',
      stimulus: '<p>Thank you for your participation.</p>',
      choices: ['Finish']
    };
  
    const timeline = [
      welcome,
      {
        timeline: [
          instructions_with_music,
          playMusic,
          ...wordStimuli,
          stopMusic,
          recall,
          thankYou
        ]
      },
      {
        timeline: [
          instructions_without_music,
          ...wordStimuli,
          recall,
          thankYou
        ]
      }
    ];
  
    jsPsych.init({
      timeline: timeline,
      on_finish: function() {
        jsPsych.data.displayData();
      }
    });
  });
  