import React, { useEffect, useState } from 'react';
import { FlatList, View, Text,TouchableOpacity, StyleSheet, Button, ScrollView, ActivityIndicator, Image} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { auth, db} from './firebaseConfig';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import {Platform, Alert } from 'react-native';

// import * as MediaLibrary from 'expo-media-library';
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
    // useEffect(() => {
    //   const loadScore = async () => {
    //     try {
    //       const stored = await AsyncStorage.getItem(`${userID}_quizScores`);
    //       if (stored) {
    //         const scores = JSON.parse(stored);
    //         if (scores[selectedDisaster]) {
    //           setHighestGrade(scores[selectedDisaster]);
    //         }
    //       }
    //     } catch (err) {
    //       console.error('Error loading quiz score:', err);
    //     }
    //   };
    //   loadScore()
    // }, [selectedDisaster]);
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


    // const addCompletedTask = (taskTitle) => {
    //   setCompletedTasks(prev => {
    //     if (!prev.includes(taskTitle)) {
    //       return [...prev, taskTitle];
    //     }
    //     return prev;  
    //   });
    // };

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

    console.log('Checking disaster completion...');
    console.log('Filtered tasks:', filteredTasks.map(t => t.title));
    console.log('Completed tasks:', completedTasks);
    console.log('All prep tasks per disaster completed:', allPrepTasksPerDisasterCompleted);
    console.log('Quiz completed:', quizCompleted);
    console.log('All disaster tasks completed:', allDisasterTasksCompleted);


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
    // const saveProgress = async (disasterType, progress) => {
    //   try {
    //     const stored = await AsyncStorage.getItem(`${userID}_userProgress`);
    //     const progressMap = stored ? JSON.parse(stored) : {};

    //     progressMap[disasterType] = progress;

    //     await AsyncStorage.setItem(`${userID}_userProgress`, JSON.stringify(progressMap));
    //     console.log(`✅ Saved ${disasterType} progress:`, progress);
    //   } catch (error) {
    //     console.error('❌ Error saving progress:', error);
    //   }
    // };

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
    // useEffect(() => {
    //   const loadCompleted = async () => 
    //     {
    //       try {
    //         const saved = await AsyncStorage.getItem(`${userID}_completedTasks`);
    //         if (saved) {
    //           // setCompletedTasks(JSON.parse(saved));
    //           const parsed = JSON.parse(saved);
    //           if (Array.isArray(parsed)) 
    //             {
    //             setCompletedTasks(parsed);
    //           } 
    //           else {
    //             console.warn('⚠️ Invalid data in completedTasks');
    //             setCompletedTasks([]);
    //           }
    //         } 
    //         else {
    //           setCompletedTasks([]);
    //         }
    //       }
    //     catch (e) {
    //       console.error('Error loading completed tasks:', e);
    //     }
    //   };

    //   const unsubscribe = navigation.addListener('focus', loadCompleted);
    //   return unsubscribe;
    // }, [navigation]);

    // save the completion of each disaster
    // useEffect(() => {
    //   const saveCompletionStatus = async () => {
    //     if (allDisasterTasksCompleted) {
    //       try {
    //         const stored = await AsyncStorage.getItem(`${userID}_disasterCompletion`);
    //         const completion = stored ? JSON.parse(stored) : {};
    //         completion[selectedDisaster] = true;  
    //         await AsyncStorage.setItem(`${userID}_disasterCompletion`, JSON.stringify(completion));
    //         // console.log(`Saved completion for ${selectedDisaster}, ${JSON.stringify(completion)}`);
    //       } 
    //       catch (error) {
    //         console.error('Error saving disaster completion status:', error);
    //       }
    //     }
    //   };

    //   saveCompletionStatus();
    // }, [allDisasterTasksCompleted, selectedDisaster]);
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
    // const markTaskAsCompleted = async (task) => {
    //   try {
    //     const updatedTasks = [...completedTasks, task];
    //     setCompletedTasks(updatedTasks);

    //     const docRef = doc(db, 'userProgress', userID);
    //     await setDoc(docRef, {
    //       completedTasks: updatedTasks
    //     }, { merge: true });

    //     console.log(`✅ Marked "${task}" as completed in Firestore`);
    //   } catch (error) {
    //     console.error("❌ Error updating completedTasks:", error);
    //   }
    // };

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
    
    // const downloadPDF = async(url) =>{
    //   const downloadUrl = url;
    //   const fileUri = FileSystem.documentDirectory +'flood-info.pdf';

    //   try {
    //     const { uri } = await FileSystem.downloadAsync(url, fileUri);
    //     console.log('Downloaded to:', uri);

    //     const permission = await MediaLibrary.requestPermissionsAsync();
    //     if (!permission.granted) {
    //       alert('Permission to access media library is required!');
    //       return;
    //     }

    //     const asset = await MediaLibrary.createAssetAsync(uri);
    //     await MediaLibrary.createAlbumAsync('Download', asset, false);

    //     IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    //       data: asset.uri,
    //       flags: 1,
    //       type: 'application/pdf',
    //     });
    //   } catch (err) {
    //     console.error('Download error:', err);
    //     alert('Failed to download or open PDF.');
    //   }
    // } 
    const downloadPDF = async (url) => {
      try {
        const fileUri = FileSystem.documentDirectory + "downloaded-file.pdf";

        // Download file
        const { uri } = await FileSystem.downloadAsync(url, fileUri);
        console.log('File downloaded to:', uri);

        if (Platform.OS === 'android') {
          // Use IntentLauncher to open the PDF on Android
          IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: uri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/pdf',
          });
        } else {
          // For iOS, use Linking to open the file
          Linking.openURL(uri).catch(() => {
            Alert.alert('Error', 'Cannot open PDF file');
          });
        }
      } catch (error) {
        console.error('Download or open error:', error);
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
            onPress={() => Linking.openURL('https://www.ready.gov/kids/games/data/bak-english/index.html')} style={styles.taskTitleContainer}>
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
                <Text style={{color:'red'}} >Download PDF</Text>
              </TouchableOpacity>            
            </View>    
            
          </View>
          
        )}
        {/* earthquake information sheet*/}
        {selectedDisaster === "Earthquake" && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('viewPDF', {
                url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_earthquake_hazard-info-sheet.pdf',
                title: 'Earthquake information poster'
              })
            }
            style={styles.taskTitleContainer}
          >
            <Text style={styles.pdfLink}>
              Earthquake information sheet
            </Text>
          </TouchableOpacity>
        )}
        {/* hurricane information sheet*/}
        {selectedDisaster === "Hurricane" && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('viewPDF', {
                url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_hurricane_hazard-info-sheet.pdf',
                title: 'Hurricane information poster'
              })
            }
            style={styles.taskTitleContainer}
          >
            <Text style={styles.pdfLink}>
              Hurricane information sheet
            </Text>
          </TouchableOpacity>
        )}

        {/* pandemic information sheet*/}
        {selectedDisaster === "Pandemic" && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('viewPDF', {
                url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_novel-pandemic_hazard-info-sheet.pdf',
                title: 'Pandemic information poster'
              })
            }
            style={styles.taskTitleContainer}
          >
            <Text style={styles.pdfLink}>
              Pandemic information sheet
            </Text>
          </TouchableOpacity>
        )}
        {/* tornado information sheet*/}
        {selectedDisaster === "Tornado" && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('viewPDF', {
                url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_tornado_hazard-info-sheet.pdf',
                title: 'Tornado information poster'
              })
            }
            style={styles.taskTitleContainer}
          >
            <Text style={styles.pdfLink}>
              Tornado information sheet
            </Text>
          </TouchableOpacity>
        )}
        {/* tsunami information sheet*/}
        {selectedDisaster === "Tsunami" && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('viewPDF', {
                url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_tsunami_hazard-info-sheet.pdf',
                title: 'Tsunami information poster'
              })
            }
            style={styles.taskTitleContainer}
          >
            <Text style={styles.pdfLink}>
              Tsunami information sheet
            </Text>
          </TouchableOpacity>
        )}
        {/* Wildfire information sheet*/}
        {selectedDisaster === "Wildfire" && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('viewPDF', {
                url: 'https://www.ready.gov/sites/default/files/2024-03/ready.gov_wildfire_hazard-info-sheet.pdf',
                title: 'Wildfire information poster'
              })
            }
            style={styles.taskTitleContainer}
          >
            <Text style={styles.pdfLink}>
              Wildfire information sheet
            </Text>
          </TouchableOpacity>
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