import React, { useEffect, useState } from 'react';
import { FlatList, View, Text,TouchableOpacity, StyleSheet, Button, ScrollView, ActivityIndicator, Image, PermissionsAndroid} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db} from './firebaseConfig';
import {Platform, Alert } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import DisasterPrepTasks from "./disastersPrep"
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskInfo from './data/TaskInfo.json';
import quizzes from './data/allQuizzes.json';
import earthquakeQuizzes from './data/earthquakeQuizzes.json'
import floodQuizzes from './data/floodQuizzes.json'
import hurricaneQuizzes from './data/hurricaneQuizzes.json'
import tsunamiQuizzes from './data/tsunamiQuizzes.json'
import tornadoQuizzes from './data/tornadoQuizzes.json'
import pandemicQuizzes from './data/pandemicQuizzes.json'
import wildfireQuizzes from './data/wildfireQuizzes.json'

import AntDesign from '@expo/vector-icons/AntDesign';

import * as Linking from 'expo-linking';
import Footer from './footer'

import axios from 'axios';

const AllTasks =() =>{
    const route = useRoute();
    const { selectedDisaster } = route.params;
    const [highestGrade, setHighestGrade] = useState(0);
    const [crossedSteps, setCrossedSteps] = useState([]);

    // get the user id
    const userID = auth.currentUser?.uid;
    const navigation = useNavigation()
    const [videos, setVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [completedTasks, setCompletedTasks] = useState([])
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [document, setDocument] = useState(null);

    const API_KEY ='AIzaSyBGNxrx2-9Z6aIonU8ofk9uEEHAZkMnBuE'

    const disasterList = ["Common preparation and tips","Flood", "Earthquake", "Hurricane", "Tornado", "Wildfire", "Tsunami", "Pandemic"]
    const allDisasters = ["Flood", "Earthquake", "Hurricane", "Tornado", "Wildfire", "Tsunami", "Pandemic"]
    // filter the tasks if its commmon between all
    let filteredTasks;
    let filteredQuizzes;

    if(selectedDisaster == "Common preparation and tips"){
        filteredTasks =TaskInfo.filter(task =>allDisasters.every(disaster => task.disasterTypes.includes(disaster)))
        filteredQuizzes= quizzes.filter(quiz => allDisasters.every(disaster => quiz.category.includes(disaster)))
    }
    else{
        filteredTasks = TaskInfo.filter(task =>task.disasterTypes.length === 1 && task.disasterTypes[0] === selectedDisaster);
          switch (selectedDisaster) {
              case 'Earthquake':
                  filteredQuizzes = earthquakeQuizzes
                  break;
              case 'Flood':
                  filteredQuizzes = floodQuizzes
                  break;
              case 'Hurricane':
                filteredQuizzes = hurricaneQuizzes
                break;
              case 'Tornado':
                  filteredQuizzes = tornadoQuizzes
                  break;
              case 'Wildfire':
                filteredQuizzes = wildfireQuizzes
                break;
              case 'Tsunami':
                  filteredQuizzes = tsunamiQuizzes
                  break;
              case 'Pandemic':
                filteredQuizzes = pandemicQuizzes
                break;
              default:
                  break;
          }
    }
    // load the score for the quiz for each disaster 
    useEffect(()=>{
      const loadScore = async () => {
        try {
          const docRef = doc(db, 'userProgress', userID);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const grade = data?.quizScores?.[selectedDisaster];
            if (grade !== undefined) {
              setHighestGrade(grade);
              console.log(`Loaded quiz score for ${selectedDisaster}:`, grade);
            } else {
              setHighestGrade(0);
              console.log(`No quiz score found for ${selectedDisaster}`);
            }
          } else {
            console.log('No user progress document found');
          }
        } catch (error) {
          console.error('Error loading quiz score from Firestore:', error);
        }
      };
      loadScore()
    },[userID, selectedDisaster])
    


    //calculate total number of tasks and quizzes 
    const allTasks = TaskInfo.filter(task =>task.disasterTypes.some(disaster => allDisasters.includes(disaster)));
    const allQuizzes = quizzes.filter(quiz =>quiz.category.some(category => allDisasters.includes(category)));
    // ratio of completed tasks to total number of tasks to reflect on the home progress bar 
    const totalTasks = (allTasks.length + allQuizzes.length)

    // if a task from a category is completed, update the progress
    const markTaskAsCompleted = async (task) => {
      try {
        const updatedTasks = [...completedTasks, task];
        setCompletedTasks(updatedTasks);

        const docRef = doc(db, 'userProgress', userID);
        await setDoc(docRef, {
          completedTasks: updatedTasks
        }, { merge: true });

        console.log(`✅ Marked "${task}" as completed in Firestore`);
      } catch (error) {
        console.error("❌ Error updating completedTasks:", error);
      }
    };


    // total completed tasks
    const completedCount = filteredTasks.filter(task => completedTasks.includes(task.title)).length;
    // completed tasks per disaster
    const allPrepTasksPerDisasterCompleted = filteredTasks.every(task =>completedTasks.includes(task.title));

    // considered completed if user pass the quiz
    const quizCompleted = typeof highestGrade === 'number' && highestGrade >= 50;

    const allDisasterTasksCompleted = allPrepTasksPerDisasterCompleted && quizCompleted;

  
    const disasterTotalTasks = filteredTasks.length + filteredQuizzes.length;
    const disasterCompletedCount = filteredTasks.filter(task => completedTasks.includes(task.title)).length + (quizCompleted ? 1 : 0);
    const progressValue = disasterTotalTasks === 0 ? 0 : disasterCompletedCount / disasterTotalTasks;


    // save user progress for each disasster
    const saveProgress = async (disasterType, progress) => {
      try {
        const docRef = doc(db, 'userProgress', userID);
        await setDoc(docRef, {progress: {[disasterType]: progress}}, { merge: true });

      } 
      catch (error) {
        console.error('❌ Error saving progress to Firestore:', error);
      }
    };

    useEffect(() => {
      if (selectedDisaster && userID) {
        saveProgress(selectedDisaster, progressValue);
      }
    }, [progressValue, selectedDisaster, userID]);

    // save the completed tasks 
    useEffect(() => {
      const fetchUserProgress = async () => {
        if (!userID) return;
        try {
          const docRef = doc(db, 'userProgress', userID);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const progress = data?.progress?.[selectedDisaster] || Array(filteredTasks.length).fill(false);
            setCrossedSteps(progress);

            const completed = data?.completedTasks || [];
            setCompletedTasks(completed);

            const grade = data?.quizScores?.[selectedDisaster];
            if (grade !== undefined) {
              setHighestGrade(grade);
            }
          } 
          else {
            console.log('📭 No progress found in Firestore.');
          }
        } catch (error) {
          console.error('❌ Error loading progress from Firestore:', error);
        }
      };

      const unsubscribe = navigation.addListener('focus', fetchUserProgress);
      return unsubscribe;
    }, [navigation, selectedDisaster, userID]);
   
    // save the completeion status of the disaster categories
    useEffect(() => {
      const saveCompletionStatus = async () => {
        if (allDisasterTasksCompleted && selectedDisaster) {
          try {
            console.log("trying to save disaster compeletion" )
            const docRef = doc(db, 'userProgress', userID);
            const docSnap = await getDoc(docRef);

            let existingData = docSnap.exists() ? docSnap.data() : {};
            let currentCompletion = existingData.disasterCompletion || {};

            currentCompletion[selectedDisaster] = true;

            await setDoc(docRef, {
              disasterCompletion: currentCompletion
            }, { merge: true });

            console.log(`✅ Saved completion for ${selectedDisaster}`);
          } catch (error) {
            console.error('❌ Error saving disaster completion status to Firestore:', error);
          }
        }
      };

      saveCompletionStatus();
    }, [allDisasterTasksCompleted, selectedDisaster]);


    // fetch videos from youtube
    useEffect(() => {
      const fetchVideos = async () => {
          try {
            const query = selectedDisaster === 'Common preparation and tips'
                ? 'disaster preparedness'
                : `${selectedDisaster} safety tips`;

            const res = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 3,
                key: API_KEY,
                },
          });
          setVideos(res.data.items);
          } 
          catch (err) {
            console.error('Error fetching YouTube videos:', err);
          } 
          finally {
            setLoadingVideos(false);
          }
      };

    fetchVideos();
    }, [selectedDisaster]);
  

    // download the pdf files 
    const downloadPDF = async (url) => {
      const { config, fs } = RNBlobUtil;
      const fileName = 'disaster-info-file.pdf';
      const downloadPath = `${fs.dirs.DownloadDir}/${fileName}`;

      try {
        const res = await config({
          fileCache: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            path: downloadPath,
            description: 'Downloading PDF',
            mime: 'application/pdf',
            mediaScannable: true,
          },
        }).fetch('GET', url);

        Alert.alert('Download complete', `Saved to Downloads folder.`);
      } catch (err) {
        Alert.alert('Download failed', 'Check storage permissions and try again!');
      }
    };
  
    

   
  return (
    <View style={{ flex: 1, backgroundColor:'white'}}>
      <ScrollView style={{ padding: 16}} contentContainerStyle={{ paddingBottom: 150 }}>
        <FlatList
          data={filteredTasks}
          keyExtractor={(item, i) => i.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.taskTitleContainer} onPress={() => {navigation.navigate('prepTasks', { selectedTitle: item.title, selectedDisaster:selectedDisaster, }, console.log(`selected ${item.title} from ${selectedDisaster}`) )}}>
              <Text style={{ fontSize: 15, fontFamily:'times new roman',color:'#3B444B'  }}>{item.title}</Text>
              {completedTasks?.includes(item.title) && (
                <AntDesign
                  style={styles.icon}
                  color="#008080"
                  name="checksquare"
                  size={15}
                />
              )}
            </TouchableOpacity>
          )}
          scrollEnabled={false} 
        />

        {/* additional educational Videos */}
        <Text style={{ fontSize: 17, fontFamily:'times new roman', marginTop: 15, marginBottom:15, fontWeight:'bold', color:'#54626F'}}>Preparation Videos</Text>

        {loadingVideos ? (
          <ActivityIndicator size="large" />
        ) : (
          videos.map(video => (
            <TouchableOpacity 
              key={video.id.videoId}
              onPress={() => navigation.navigate('playVideo', { videoId: video.id.videoId })}
            >
              <Image
                source={{ uri: video.snippet.thumbnails.medium.url }}
                style={{ width: '100%', height: 200, borderRadius: 10, marginVertical: 10 }}
              />
              <Text style={styles.videoTitle}>{video.snippet.title}</Text>
            </TouchableOpacity>
          ))
        )}
        {/* common emergency plan*/}
        {selectedDisaster === "Common preparation and tips" && (
        <View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('viewPDF', {
                url: 'https://www.redcross.org/content/dam/redcross/get-help/pdfs/American-Red-Cross-Emergency-Contact-Card.pdf',
                title: 'Make a plan'
              })
            }
            style={styles.taskTitleContainer}
          >
            <Text style={styles.pdfLink}>
              Create an emergency contact card
            </Text>
          </TouchableOpacity>
            {/** nav to the interactive game on ready.gov to build a kit */}
          <TouchableOpacity
            onPress={() => navigation.navigate('buildKitGame')}
            style={styles.taskTitleContainer}>
            <Text style={styles.pdfLink}>
              Can you build a kit?
            </Text>
          </TouchableOpacity>
        </View>
          
        )}

        {/* flood information sheet*/}
        {selectedDisaster === "Flood" && (
          <View style={styles.taskTitleContainer}>
            <View> 
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('viewPDF', {
                    url: 'https://www.ready.gov/sites/default/files/2025-01/fema_flood-hazard-info-sheet.pdf',
                    title: 'FEMA Flood Hazard Info Sheet'
                  })
                }>
                <Text style={styles.pdfLink}>
                  Flood hazard information sheet
                </Text>
              </TouchableOpacity>  
              <TouchableOpacity onPress={() => downloadPDF('https://www.ready.gov/sites/default/files/2025-01/fema_flood-hazard-info-sheet.pdf')} >
                <Text style={{color:'red'}} >Download</Text>
              </TouchableOpacity>            
            </View>    
            
          </View>
          
        )}
        {/* earthquake information sheet*/}
        {selectedDisaster === "Earthquake" && (
          <View style={styles.taskTitleContainer}>
            <View >
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('viewPDF', {
                    url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_earthquake_hazard-info-sheet.pdf',
                    title: 'Earthquake information poster'
                  })
                }>
                <Text style={styles.pdfLink}>
                  Earthquake information sheet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadPDF('https://www.ready.gov/sites/default/files/2024-03/ready.gov_earthquake_hazard-info-sheet.pdf')} >
                <Text style={{color:'red'}} >Download</Text>
              </TouchableOpacity> 
            </View>
          </View>
        )}
        {/* hurricane information sheet*/}
        {selectedDisaster === "Hurricane" && (
          <View style={styles.taskTitleContainer}>
            <View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('viewPDF', {
                    url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_hurricane_hazard-info-sheet.pdf',
                    title: 'Hurricane information poster'
                  })
                }>
                <Text style={styles.pdfLink}>
                  Hurricane information sheet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadPDF('https://www.ready.gov/sites/default/files/2024-03/ready.gov_hurricane_hazard-info-sheet.pdf')} >
                <Text style={{color:'red'}} >Download</Text>
              </TouchableOpacity> 
            </View>
          </View>
          
        )}

        {/* pandemic information sheet*/}
        {selectedDisaster === "Pandemic" && (
          <View style={styles.taskTitleContainer}> 
            <View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('viewPDF', {
                    url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_novel-pandemic_hazard-info-sheet.pdf',
                    title: 'Pandemic information poster'
                  })
                }>
                <Text style={styles.pdfLink}>
                  Pandemic information sheet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadPDF('https://www.ready.gov/sites/default/files/2024-03/ready.gov_novel-pandemic_hazard-info-sheet.pdf')} >
                <Text style={{color:'red'}} >Download</Text>
              </TouchableOpacity> 
            </View>
          </View>
          
        )}
        {/* tornado information sheet*/}
        {selectedDisaster === "Tornado" && (
          <View style={styles.taskTitleContainer}>
            <View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('viewPDF', {
                    url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_tornado_hazard-info-sheet.pdf',
                    title: 'Tornado information poster'
                  })
                }>
                <Text style={styles.pdfLink}>
                  Tornado information sheet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadPDF('https://www.ready.gov/sites/default/files/2024-03/ready.gov_tornado_hazard-info-sheet.pdf')} >
                <Text style={{color:'red'}} >Download</Text>
              </TouchableOpacity> 
            </View>
          </View>
          
        )}
        {/* tsunami information sheet*/}
        {selectedDisaster === "Tsunami" && (
          <View style={styles.taskTitleContainer}>
            <View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('viewPDF', {
                    url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_tsunami_hazard-info-sheet.pdf',
                    title: 'Tsunami information poster'
                  })
                }>
                <Text style={styles.pdfLink}>
                  Tsunami information sheet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadPDF('https://www.ready.gov/sites/default/files/2024-03/ready.gov_tsunami_hazard-info-sheet.pdf')} >
                <Text style={{color:'red'}} >Download</Text>
              </TouchableOpacity> 
            </View>
          </View>
          
        )}
        {/* Wildfire information sheet*/}
        {selectedDisaster === "Wildfire" && (
          <View style={styles.taskTitleContainer}>
            <View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('viewPDF', {
                    url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_wildfire_hazard-info-sheet.pdf',
                    title: 'Wildfire information poster'
                  })
                }>
                <Text style={styles.pdfLink}>
                  Wildfire information sheet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadPDF('https://www.ready.gov/sites/default/files/2024-03/ready.gov_wildfire_hazard-info-sheet.pdf')} >
                <Text style={{color:'red'}} >Download</Text>
              </TouchableOpacity> 
            </View>
          </View>
          
        )}

        {/* quiz start Button */}
        <View style={styles.quizOutsideContainer}> 
          <View style={styles.quizContainer}>
            <Text style={styles.quizText}>It's quiz time!</Text>
            <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('quiz', { quizzes: filteredQuizzes, selectedDisaster: selectedDisaster, highestGrade:highestGrade})}>
              <Text style={{textAlign:'center', fontFamily:'times new roman', padding:5, color:'black'}}>Start</Text>
            </TouchableOpacity>
          </View>
          <Text style={{textAlign:'right', padding:10, fontSize:16, fontFamily:'times new roman', color:'black'}}>Highest grade: {highestGrade}%</Text>
        </View>
       
        
      </ScrollView>
      <Footer navigation={navigation} />
    </View>
  );
};



const styles = StyleSheet.create({
    container:{
        backgroundColor:'white',
    },
    question:{
        backgroundColor:'grey',
        
    },
    choicesContainer:{
        backgroundColor:'yellow',
        flexDirection :'column',
        margin:10,
        padding:5,
    },
    choice:{
        padding:20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20,
    },

    backButton: {
        backgroundColor: '#6c757d',
        padding: 15,
        borderRadius: 8,
    },

    nextButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
    },
    startButton:{
      backgroundColor:'#9DC183',
      width:'28%',
      height:'120%',
      borderRadius:5
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },

    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },

    nextButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    videoTitle:{
        fontSize:16,
        padding:10,
        fontWeight:'bold',
        textAlign:'left',
        // fontStyle:'italic',
        fontFamily:'Times New Roman',
        color:'#3B444B'
    },
    pdfLink:{
      fontSize: 16, 
      textDecorationLine: 'underline',
      fontFamily:'times new roman',
      color:'#2D68C4'
    },
    quizOutsideContainer:{
      borderTopWidth:3,
      borderBottomWidth:3,
      borderColor:'#B2BEB5',
      marginTop:10
    },
    quizContainer:{
      flexDirection:'row',
      alignItems:'center',
      marginTop:20,
      padding:10,
      justifyContent:'space-between',
    },
    quizText:{
      fontFamily:'times new roman', 
      fontSize:16,
      fontWeight:'bold',
      color:'#54626F'
    },
    taskTitleContainer:{
      flexDirection:'row',
      padding:20,
      // backgroundColor:'red',
      // width:'100%',
      // height:'10%',
      backgroundColor:'#F5ECCF',
      marginTop:10,
      borderRadius:10,
      borderWidth:1,
      borderColor:'#B2BEB5',
      elevation:2,
    },
    icon:{
      marginLeft:10
    }

});

export default AllTasks