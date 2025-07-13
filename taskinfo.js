

import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';  



async function fetchCommonTaskInfoFromWeb(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const tasks=[]
  const sections =[]

  const subtitle = $('meta[name="description"]').attr('content')

  $('h2').each((i, heading) => {

    const title = $(heading).text().trim();
    const ul = $(heading).nextAll().filter((_, el) => $(el).find('ul').length > 0).first().find('ul').first();

    const stepsToTake = [];

    if (ul.length) {
      ul.find('li').each((j, liElem) => {
        stepsToTake.push($(liElem).text().trim());
      });
    } 
   

    if (stepsToTake.length > 0) {
      sections.push({ title, stepsToTake });
    }
  })

    sections.forEach(section => {
    const task = {
      id: uuidv4(),
      title: section.title,
      description: subtitle,
      isCompleted: false,
      category: "supplies",
      disasterTypes: ["Flood", "Earthquake", "Hurricane", "Tornado", "Wildfire", "Tsunami", "Pandemic"],
      steps: section.stepsToTake,
      imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1000&q=80"
    };

    tasks.push(task);
  });
  return tasks; 
}


// tasks specifically for earthquakes
async function fetchEarthquakeTaskInfoFromWeb(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const earthquakeTasks=[]
  const sections =[]

  const subtitle = $('meta[name="description"]').attr('content')

  $('h2').each((i, heading) => {

    const title = $(heading).text().trim();
    const ul = $(heading).nextAll().filter((_, el) => $(el).find('ul').length > 0).first().find('ul').first();

    const stepsToTake = [];

    if (ul.length) {
      ul.find('li').each((j, liElem) => {
        stepsToTake.push($(liElem).text().trim());
      });
    } 
   

    if (stepsToTake.length > 0) {
      sections.push({ title, stepsToTake });
    }
  })

    sections.forEach(section => {
    const task = {
      id: uuidv4(),
      title: section.title,
      description: subtitle,
      isCompleted: false,
      category: "supplies",
      disasterTypes: [ "Earthquake"],
      steps: section.stepsToTake,
      imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1000&q=80"
    };

    earthquakeTasks.push(task);
  });
  return earthquakeTasks; 
}

//tasks specifically for floods 
async function fetchFloodTaskInfoFromWeb(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const floodTasks=[]
  const sections =[]

  const subtitle = $('meta[name="description"]').attr('content')

  $('h2').each((i, heading) => {

    const title = $(heading).text().trim();
    const ul = $(heading).nextAll().filter((_, el) => $(el).find('ul').length > 0).first().find('ul').first();

    const stepsToTake = [];

    if (ul.length) {
      ul.find('li').each((j, liElem) => {
        stepsToTake.push($(liElem).text().trim());
      });
    } 
    if (stepsToTake.length > 0) {
      sections.push({ title, stepsToTake });
    }
  })

    sections.forEach(section => {
    const task = {
      id: uuidv4(),
      title: section.title,
      description: subtitle,
      isCompleted: false,
      category: "supplies",
      disasterTypes: [ "Flood"],
      steps: section.stepsToTake,
      imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1000&q=80"
    };

    floodTasks.push(task);
  });
  return floodTasks; 
}


/////tasks specifically for hurricane
async function fetchHurricaneTaskInfoFromWeb(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const hurricaneTasks=[]
  const sections =[]

  const subtitle = $('meta[name="description"]').attr('content')

  $('h2').each((i, heading) => {

    const title = $(heading).text().trim();
    const ul = $(heading).nextAll().filter((_, el) => $(el).find('ul').length > 0).first().find('ul').first();

    const stepsToTake = [];

    if (ul.length) {
      ul.find('li').each((j, liElem) => {
        stepsToTake.push($(liElem).text().trim());
      });
    } 
   

    if (stepsToTake.length > 0) {
      sections.push({ title, stepsToTake });
    }
  })

    sections.forEach(section => {
    const task = {
      id: uuidv4(),
      title: section.title,
      description: subtitle,
      isCompleted: false,
      category: "supplies",
      disasterTypes: [ "Hurricane"],
      steps: section.stepsToTake,
      imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1000&q=80"
    };

    hurricaneTasks.push(task);
  });
  return hurricaneTasks; 
}


/////tasks specifically for wildfires
async function fetchWildfireTaskInfoFromWeb(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const wildfiresTasks=[]
  const sections =[]

  const subtitle = $('meta[name="description"]').attr('content')

  $('h2').each((i, heading) => {

    const title = $(heading).text().trim();
    const ul = $(heading).nextAll().filter((_, el) => $(el).find('ul').length > 0).first().find('ul').first();

    const stepsToTake = [];

    if (ul.length) {
      ul.find('li').each((j, liElem) => {
        stepsToTake.push($(liElem).text().trim());
      });
    } 
   

    if (stepsToTake.length > 0) {
      sections.push({ title, stepsToTake });
    }
  })

    sections.forEach(section => {
    const task = {
      id: uuidv4(),
      title: section.title,
      description: subtitle,
      isCompleted: false,
      category: "supplies",
      disasterTypes: [ "Wildfire"],
      steps: section.stepsToTake,
      imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1000&q=80"
    };

    wildfiresTasks.push(task);
  });
  return wildfiresTasks; 
}


/////tasks specifically for tsunami
async function fetchTornadoTaskInfoFromWeb(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const tornadoesTasks=[]
  const sections =[]

  const subtitle = $('meta[name="description"]').attr('content')

  $('h2').each((i, heading) => {

    const title = $(heading).text().trim();
    const ul = $(heading).nextAll().filter((_, el) => $(el).find('ul').length > 0).first().find('ul').first();

    const stepsToTake = [];

    if (ul.length) {
      ul.find('li').each((j, liElem) => {
        stepsToTake.push($(liElem).text().trim());
      });
    } 
   

    if (stepsToTake.length > 0) {
      sections.push({ title, stepsToTake });
    }
  })

    sections.forEach(section => {
    const task = {
      id: uuidv4(),
      title: section.title,
      description: subtitle,
      isCompleted: false,
      category: "supplies",
      disasterTypes: [ "Tornado"],
      steps: section.stepsToTake,
      imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1000&q=80"
    };

    tornadoesTasks.push(task);
  });
  return tornadoesTasks; 
}


/////tasks specifically for tsunami
async function fetchTsunamiTaskInfoFromWeb(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const tsunamiTasks=[]
  const sections =[]

  const subtitle = $('meta[name="description"]').attr('content')

  $('h2').each((i, heading) => {

    const title = $(heading).text().trim();
    const ul = $(heading).nextAll().filter((_, el) => $(el).find('ul').length > 0).first().find('ul').first();

    const stepsToTake = [];

    if (ul.length) {
      ul.find('li').each((j, liElem) => {
        stepsToTake.push($(liElem).text().trim());
      });
    } 
   

    if (stepsToTake.length > 0) {
      sections.push({ title, stepsToTake });
    }
  })

    sections.forEach(section => {
    const task = {
      id: uuidv4(),
      title: section.title,
      description: subtitle,
      isCompleted: false,
      category: "supplies",
      disasterTypes: [ "Tsunami"],
      steps: section.stepsToTake,
      imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1000&q=80"
    };

    tsunamiTasks.push(task);
  });
  return tsunamiTasks; 
}

/////tasks specifically for pandemic]
async function fetchPandemicTaskInfoFromWeb(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const pandemicTasks=[]
  const sections =[]

  const subtitle = $('meta[name="description"]').attr('content')

  $('h2').each((i, heading) => {

    const title = $(heading).text().trim();
    const ul = $(heading).nextAll().filter((_, el) => $(el).find('ul').length > 0).first().find('ul').first();

    const stepsToTake = [];

    if (ul.length) {
      ul.find('li').each((j, liElem) => {
        stepsToTake.push($(liElem).text().trim());
      });
    } 
   

    if (stepsToTake.length > 0) {
      sections.push({ title, stepsToTake });
    }
  })

    sections.forEach(section => {
    const task = {
      id: uuidv4(),
      title: section.title,
      description: subtitle,
      isCompleted: false,
      category: "supplies",
      disasterTypes: [ "Pandemic"],
      steps: section.stepsToTake,
      imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1000&q=80"
    };

    pandemicTasks.push(task);
  });
  return pandemicTasks; 
}


const url1 = 'https://www.ready.gov/kit';
const url2 = 'https://www.ready.gov/car';
const url3 = 'https://www.ready.gov/food';
const url4 = 'https://www.ready.gov/water';
const url5 ='https://www.ready.gov/earthquakes#before';
const url6 ='https://www.ready.gov/floods';
const url7 ='https://www.ready.gov/hurricanes';
const url8 ='https://www.ready.gov/tornadoes';
const url9 ='https://www.ready.gov/wildfires';
const url10 ='https://www.ready.gov/tsunamis';
const url11='https://www.ready.gov/pandemic';

const url12='https://www.ready.gov/evacuation';
const url13='https://www.ready.gov/get-tech-ready'
const url14='https://www.ready.gov/people-disabilities'

const url15='https://www.ready.gov/pets'
const url16='https://www.ready.gov/shelter'
const url17='https://www.ready.gov/home-fire-escape-plan'


async function writeIntoJson(){
  const tasksFromURL1 = await fetchCommonTaskInfoFromWeb(url1);
  const tasksFromURL2 = await fetchCommonTaskInfoFromWeb(url2);
  const tasksFromURL3 = await fetchCommonTaskInfoFromWeb(url3);
  const tasksFromURL4 = await fetchCommonTaskInfoFromWeb(url4);
  const tasksFromURL5 = await fetchEarthquakeTaskInfoFromWeb(url5);
  const tasksFromURL6 = await fetchFloodTaskInfoFromWeb(url6);
  const tasksFromURL7 = await fetchHurricaneTaskInfoFromWeb(url7);
  const tasksFromURL8 = await fetchTornadoTaskInfoFromWeb(url8);
  const tasksFromURL9 = await fetchWildfireTaskInfoFromWeb(url9);
  const tasksFromURL10 = await fetchTsunamiTaskInfoFromWeb(url10);
  const tasksFromURL11 = await fetchPandemicTaskInfoFromWeb(url11);
  const tasksfromURL12 = await fetchCommonTaskInfoFromWeb(url12)

  const tasksfromURL13 = await fetchCommonTaskInfoFromWeb(url13)
  const tasksfromURL14 = await fetchCommonTaskInfoFromWeb(url14)
  const tasksfromURL15 = await fetchCommonTaskInfoFromWeb(url15)
  const tasksfromURL16 = await fetchCommonTaskInfoFromWeb(url16)
  const tasksfromURL17 = await fetchCommonTaskInfoFromWeb(url17)


  const allTasks = [...tasksfromURL16];

  await writeFile('./taskInfo.json', JSON.stringify(allTasks, null, 2));

}

writeIntoJson();
