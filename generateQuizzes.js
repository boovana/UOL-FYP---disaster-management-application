const fs = require('fs');
const path = require('path');

const taskInfo = require('./test/data/TaskInfo.json');


const incorrectAnswersForCommonPrep = [
  'remote', 'cups', 'photos', 'tv', 'games', 'watches', 'perfume', 'sunglasses', 'camera', 'teddy bear',
];


const incorrectAnswersForEvacuation = [
  'dont evacutate', "start evacuation planning only when warnings are issued"
];


const incorrectAnswersForEarthquake = [
  'Wait for earthquake to happen and start preparing', 'Wait for earthquake to pass', ""
];

const incorrectAnswersForFlood = [
  'Wait for flood to happen and start preparing', 'Wait for flood to pass'
];

const incorrectAnswersForHurricane= [
  'Wait for hurricane to happen and start preparing', 'Wait for hurricane to pass'
];

const incorrectAnswersForTornado= [
  'Wait for tornado to happen and start preparing', 'Wait for tornado to pass'
];


const incorrectAnswersForWildfire= [
  'Wait for wildfire to happen and start preparing', 'Wait for wildfire to pass'
];


const incorrectAnswersForTsunami= [
  'Wait for tsunami to happen and start preparing', 'Wait for tsunami to pass'
];

const incorrectAnswersForPandemic= [
  'Wait for pandemic to happen and start preparing', 'Wait for pandemic to pass'
];

const getWrongAnswers = (task) => {
  if (task.title.toLowerCase().includes('Be in the Know',"Before an Evacuation","During an Evacuation","After an Evacuation")) {
    return incorrectAnswersForEvacuation;
  }
  return incorrectAnswersForCommonPrep;
};


const disasterList = ["Flood", "Earthquake", "Hurricane", "Tornado", "Wildfire", "Tsunami", "Pandemic"];

// quiz for tasks common between all the disasters
const hasAllDisasters = (taskDisasters) =>
  disasterList.every(disaster => taskDisasters.includes(disaster));

// quiz for each specific task
const hasOneSpecificDisaster = (taskDisasters, targetDisaster) =>taskDisasters.length === 1 && taskDisasters.includes(targetDisaster);

const generateQuizzes = () => {
  return taskInfo.filter(task => hasAllDisasters(task.disasterTypes)).map((task, i) => {
      const correctOptions = task.steps ? task.steps.slice(0, 3) : ['No steps available'];
      const wrongOptions = getWrongAnswers(task)
        .filter(option => !correctOptions.includes(option))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      // const shuffledWrong = incorrectAnswersForCommonPrep
      //   .filter(item => !correctOptions.includes(item))
      //   .sort(() => 0.5 - Math.random())
      //   .slice(0, 2);

      const allOptions = [...correctOptions, ...wrongOptions].sort(() => 0.5 - Math.random());

      return {
        id: task.id || i.toString(),
        category: task.category,
        question: `Select the correct options for: ${task.title}`,
        options: allOptions,
        correctAnswer: correctOptions,
      };
    });
};

const generateEarthquakeQuizzes =() =>{
  return taskInfo.filter(task => hasOneSpecificDisaster(task.disasterTypes, "Earthquake")).map((task, i) => {
      const correctOptions = task.steps ? task.steps.slice(0, 3) : ['No steps available'];

      const shuffledWrong = incorrectAnswersForEarthquake
        .filter(item => !correctOptions.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const allOptions = [...correctOptions, ...shuffledWrong].sort(() => 0.5 - Math.random());

      return {
        id: task.id || i.toString(),
        category: task.category,
        question: `What are some correct actions to take for: ${task.title}?`,
        options: allOptions,
        correctAnswer: correctOptions,
      };
    });

}

const generateFloodQuizzes =() =>{
  return taskInfo.filter(task => hasOneSpecificDisaster(task.disasterTypes, "Flood")).map((task, i) => {
      const correctOptions = task.steps ? task.steps.slice(0, 3) : ['No steps available'];

      const shuffledWrong = incorrectAnswersForFlood
        .filter(item => !correctOptions.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const allOptions = [...correctOptions, ...shuffledWrong].sort(() => 0.5 - Math.random());

      return {
        id: task.id || i.toString(),
        category: task.category,
        question: `What are some correct actions to take for: ${task.title}?`,
        options: allOptions,
        correctAnswer: correctOptions,
      };
    });

}


const generateHurricaneQuizzes =() =>{
  return taskInfo.filter(task => hasOneSpecificDisaster(task.disasterTypes, "Hurricane")).map((task, i) => {
      const correctOptions = task.steps ? task.steps.slice(0, 3) : ['No steps available'];

      const shuffledWrong = incorrectAnswersForHurricane
        .filter(item => !correctOptions.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const allOptions = [...correctOptions, ...shuffledWrong].sort(() => 0.5 - Math.random());

      return {
        id: task.id || i.toString(),
        category: task.category,
        question: `What are some correct actions to take for: ${task.title}?`,
        options: allOptions,
        correctAnswer: correctOptions,
      };
    });

}


const generateTornadoQuizzes =() =>{
  return taskInfo.filter(task => hasOneSpecificDisaster(task.disasterTypes, "Tornado")).map((task, i) => {
      const correctOptions = task.steps ? task.steps.slice(0, 3) : ['No steps available'];

      const shuffledWrong = incorrectAnswersForTornado
        .filter(item => !correctOptions.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const allOptions = [...correctOptions, ...shuffledWrong].sort(() => 0.5 - Math.random());

      return {
        id: task.id || i.toString(),
        category: task.category,
        question: `What are some correct actions to take for: ${task.title}?`,
        options: allOptions,
        correctAnswer: correctOptions,
      };
    });

}



const generateWildfireQuizzes =() =>{
  return taskInfo.filter(task => hasOneSpecificDisaster(task.disasterTypes, "Wildfire")).map((task, i) => {
      const correctOptions = task.steps ? task.steps.slice(0, 3) : ['No steps available'];

      const shuffledWrong = incorrectAnswersForWildfire
        .filter(item => !correctOptions.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const allOptions = [...correctOptions, ...shuffledWrong].sort(() => 0.5 - Math.random());

      return {
        id: task.id || i.toString(),
        category: task.category,
        question: `What are some correct actions to take for: ${task.title}?`,
        options: allOptions,
        correctAnswer: correctOptions,
      };
    });

}


const generateTsunamiQuizzes =() =>{
  return taskInfo.filter(task => hasOneSpecificDisaster(task.disasterTypes, "Tsunami")).map((task, i) => {
      const correctOptions = task.steps ? task.steps.slice(0, 3) : ['No steps available'];

      const shuffledWrong = incorrectAnswersForTsunami
        .filter(item => !correctOptions.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const allOptions = [...correctOptions, ...shuffledWrong].sort(() => 0.5 - Math.random());

      return {
        id: task.id || i.toString(),
        category: task.category,
        question: `What are some correct actions to take for: ${task.title}?`,
        options: allOptions,
        correctAnswer: correctOptions,
      };
    });

}



const generatePandemicQuizzes =() =>{
  return taskInfo.filter(task => hasOneSpecificDisaster(task.disasterTypes, "Pandemic")).map((task, i) => {
      const correctOptions = task.steps ? task.steps.slice(0, 3) : ['No steps available'];

      const shuffledWrong = incorrectAnswersForPandemic
        .filter(item => !correctOptions.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const allOptions = [...correctOptions, ...shuffledWrong].sort(() => 0.5 - Math.random());

      return {
        id: task.id || i.toString(),
        category: task.category,
        question: `What are some correct actions to take for: ${task.title}?`,
        options: allOptions,
        correctAnswer: correctOptions,
      };
    });
}


const quizzes = generateQuizzes();
const earthquakeQuizzes = generateEarthquakeQuizzes();
const floodQuizzes = generateFloodQuizzes();
const hurricaneQuizzes = generateHurricaneQuizzes();
const tornadoQuizzes = generateTornadoQuizzes();
const wildfireQuizzes = generateWildfireQuizzes();
const tsunamiQuizzes = generateTsunamiQuizzes();
const pandemicQuizzes = generatePandemicQuizzes();

const outputPath = path.join(__dirname, 'allQuizzes.json');
const outputPathForEarthquake = path.join(__dirname, 'earthquakeQuizzes.json');
const outputPathForFlood = path.join(__dirname, 'earthquakeQuizzes.json');
const outputPathForHurricane = path.join(__dirname, 'hurricaneQuizzes.json');
const outputPathForTornado = path.join(__dirname, 'tornadoQuizzes.json');
const outputPathForWildfire = path.join(__dirname, 'wildfireQuizzes.json');

const outputPathForTsunami = path.join(__dirname, 'tsunamiQuizzes.json');
const outputPathForPandemic = path.join(__dirname, 'pandemicQuizzes.json');


fs.writeFileSync(outputPath, JSON.stringify(quizzes, null, 2));





