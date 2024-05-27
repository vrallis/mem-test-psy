// experiment.js

import { db, auth, signInAnonymously, onAuthStateChanged } from './firebase.js';
import { collection, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', function() {
  // Handle Authentication
  onAuthStateChanged(auth, user => {
    if (user) {
      startExperiment(user.uid);
    } else {
      signInAnonymously(auth).catch(error => {
        console.error("Authentication error:", error);
      });
    }
  });

  async function startExperiment(uid) {
    const words = [
        "Table", "Giraffe", "Pencil", "Mountain", "Butterfly", "Computer", "Ocean", "Bottle", "Lamp", "Keyboard",
        "River", "Camera", "Bread", "Elephant", "Chair", "Airplane", "Banana", "Clock", "Window", "Garden"
    ]

    const welcome = {
      type: 'html-button-response',
      stimulus: '<p>Welcome to the memory test experiment. By group 16!</p>',
      choices: ['Start']
    };

    const studentID = {
      type: 'survey-text',
      questions: [
        {prompt: "Please enter your Student ID (starting with 'i' followed by 7 digits):", rows: 1, columns: 20}
      ],
      data: { task: 'studentID' },
      on_finish: async function(data) {
        const id = data.response.Q0;
        if (!/^i\d{7}$/.test(id)) {
          alert("Invalid Student ID. Please refresh and try again.");
          jsPsych.endExperiment("Invalid Student ID");
        } else {
          const docRef = doc(db, "participants", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            alert("You have already participated in this experiment. Thank you!");
            jsPsych.endExperiment("Already Participated");
          } else {
            await setDoc(docRef, { participated: true, uid: uid });
            jsPsych.data.addProperties({ studentID: id });
          }
        }
      }
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

    let audio; // Variable to hold the audio object

    const playMusic = {
      type: 'call-function',
      func: function() {
        audio = new Audio('assets/music_for_stats.mp3');
        audio.loop = true;
        audio.play();
      }
    };

    const stopMusic = {
      type: 'call-function',
      func: function() {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
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

    const condition = Math.random() > 0.5 ? 'music' : 'no_music';

    const timeline = [
      welcome,
      studentID,
      {
        timeline: condition === 'music' ? [
          instructions_with_music,
          playMusic,
          ...wordStimuli,
          stopMusic,
          recall,
          thankYou
        ] : [
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
        const data = jsPsych.data.get().csv();
        downloadCSV(data);
      }
    });

    function downloadCSV(data) {
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'experiment_data.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }
});
