// experiment.js

import { db, auth, signInAnonymously, onAuthStateChanged } from './firebase.js';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', function() {
  // Handle Authentication
  onAuthStateChanged(auth, user => {
    if (user) {
      console.log("User authenticated with UID:", user.uid);
      startExperiment(user.uid);
    } else {
      signInAnonymously(auth).catch(error => {
        console.error("Authentication error:", error);
      });
    }
  });

  async function startExperiment(uid) {
    console.log("Starting experiment with UID:", uid);

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
            await setDoc(docRef, { participated: true, uid: uid, memorizedWords: [] });
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

    const displayWords = {
      type: 'html-button-response',
      stimulus: `
        <div id="timer" style="font-size: 24px; text-align: center;"></div>
        <div style="text-align: center;">
          <ul style="list-style-type: none;">
            ${words.map(word => `<li style="font-size: 20px;">${word}</li>`).join('')}
          </ul>
        </div>
      `,
      choices: ['Next'],
      on_load: function() {
        let timer = 180; // 3 minutes in seconds
        const timerElement = document.getElementById('timer');
        const interval = setInterval(() => {
          const minutes = Math.floor(timer / 60);
          const seconds = timer % 60;
          timerElement.textContent = `Time left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          if (timer === 0) {
            clearInterval(interval);
            jsPsych.finishTrial();
          }
          timer--;
        }, 1000);
      }
    };

    const recall = {
      type: 'html-button-response',
      stimulus: `
        <p>Type each word you remember and press Enter. The input will clear after each word.</p>
        <input type="text" id="recall-input" autocomplete="off">
        <p id="error-message" style="color: red;"></p>
      `,
      choices: ['Finish'],
      button_html: '<button class="jspsych-btn" id="finish-btn">%choice%</button>',
      on_load: function() {
        const input = document.getElementById('recall-input');
        const errorMessage = document.getElementById('error-message');
        input.addEventListener('keypress', async function(event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            const word = input.value.trim().toLowerCase();
            const id = jsPsych.data.get().values()[0].studentID;
            const docRef = doc(db, "participants", id);

            if (words.includes(word)) {
              await updateDoc(docRef, {
                memorizedWords: arrayUnion(word)
              });
              input.value = ''; // Clear the input
              errorMessage.textContent = ''; // Clear error message
            } else {
              errorMessage.textContent = 'Invalid word. Please try again.';
              input.value = ''; // Clear the input
            }
          }
        });

        document.getElementById('finish-btn').addEventListener('click', async function() {
          const id = jsPsych.data.get().values()[0].studentID;
          const docRef = doc(db, "participants", id);
          await updateDoc(docRef, {
            submissionTime: new Date().toISOString(),
            forcedSubmission: false
          });
          jsPsych.finishTrial();
        });

        setTimeout(async function() {
          const id = jsPsych.data.get().values()[0].studentID;
          const docRef = doc(db, "participants", id);
          await updateDoc(docRef, {
            submissionTime: new Date().toISOString(),
            forcedSubmission: true
          });
          jsPsych.finishTrial();
        }, 2 * 60 * 1000); // 2 minutes for recall phase
      }
    };

    const thankYou = {
      type: 'html-button-response',
      stimulus: '<p>Thank you for your participation.</p>',
      choices: ['Finish']
    };

    const condition = Math.random() > 0.5 ? 'music' : 'no_music';
    console.log("Assigned condition:", condition);

    const timeline = [
      welcome,
      studentID,
      condition === 'music' ? instructions_with_music : instructions_without_music,
      ...(condition === 'music' ? [playMusic] : []),
      displayWords,
      ...(condition === 'music' ? [stopMusic] : []),
      recall,
      thankYou
    ];

    jsPsych.init({
      timeline: timeline,
      on_finish: async function() {
        console.log("Experiment completed");
      }
    });
  }
});