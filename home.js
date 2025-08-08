import React, { useState, useEffect, useCallback } from "react";
import {View,Text, TouchableOpacity,Image,ScrollView,StyleSheet,SafeAreaView, Button, Alert,FlatList, Dimensions} from "react-native";
import { auth, db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import ProgressBar from 'react-native-progress/Bar';
import { useRoute, useNavigation,useFocusEffect } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';
import quizzes from './data/allQuizzes.json';
import earthquakeQuizzes from './data/earthquakeQuizzes.json'
import floodQuizzes from './data/floodQuizzes.json'
import hurricaneQuizzes from './data/hurricaneQuizzes.json'
import tsunamiQuizzes from './data/tsunamiQuizzes.json'
import tornadoQuizzes from './data/tornadoQuizzes.json'
import pandemicQuizzes from './data/pandemicQuizzes.json'
import wildfireQuizzes from './data/wildfireQuizzes.json'
import AntDesign from '@expo/vector-icons/AntDesign';
import { NativeModules } from 'react-native';


import AsyncStorage from '@react-native-async-storage/async-storage';

import Footer from './footer'

const Home = ({ navigation }) => {
  const [progressValue, setProgressValue] = useState(0);
  const [storedAlerts, setStoredAlerts] = useState([]);
  const [reloadAlerts, setReloadAlerts] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const [badges, setBadges] = useState(null)
  const route = useRoute()
  const {highestGrade} = route.params || {};
    
  const [completedDisasters, setCompletedDisasters] = useState({})
  // states for 1/4 through the list
  const[quarterlyQuiz, setQuarterlyQuiz] = useState(false)
  const [quarterlyBadgeAwarded, setQuarterlyBadgeAwarded] = useState(false);
  const [quarterlyChallengeCompleted, setQuarterlyChallengeCompleted] = useState(false);

  // states for 1/2 through the list
  const[halfWayQuiz, setHalfWayQuiz] = useState(false)
  const [halfWayBadgeAwarded, setHalfWayBadgeAwarded] = useState(false);
  const [halfWayChallengeCompleted, setHalfWayChallengeCompleted] = useState(false);

  // states for 3/4 through the list
  const[threeQuarterQuiz, setThreeQuarterQuiz] = useState(false)
  const [threeQuarterBadgeAwarded, setThreeQuarterBadgeAwarded] = useState(false);
  const [threeQuarterChallengeCompleted, setThreeQuarterChallengeCompleted] = useState(false);

  // states for completing through the list
  const[finalQuiz, setFinalQuiz] = useState(false)
  const [finalBadgeAwarded, setFinalBadgeAwarded] = useState(false);
  const [finalChallengeCompleted, setFinalChallengeCompleted] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [eligibility, setEligibility] = useState({
    completedDisasters: [],
    perfectScore: false,
    AllPerfectScores:false
  });
  // console.log('Loaded and ahome page!')

  
  //get the current user ID
  const userID = auth?.currentUser?.uid;

  // get users progress from their learning materials
  // useEffect(() => {
  //   if (!auth.currentUser){
  //     return
  //   } 
  //   const userID = auth.currentUser.uid;
  //   const loadProgress = async () => {
  //     try {
  //       // save the progress to each user
  //       const saved = await AsyncStorage.getItem(`${userID}_userProgress`);
  //       if (saved) {
  //         const parsedProgress = JSON.parse(saved);
  //         // console.log('loaded user progress:', saved.length)
  //         // setProgressValue(parsedProgress);
  //         const totalProgress = Object.values(parsedProgress).reduce((sum, val) => {
  //           return typeof val === 'number' && !isNaN(val) ? sum + val : sum;
  //         }, 0);

  //         const normalizedProgress = totalProgress / Object.keys(parsedProgress).length;

  //         setProgressValue(normalizedProgress || 0);
  //       }
  //     } 
  //     catch (e) {
  //       console.error('Failed to load progress:', e);
  //     }
  //   };
  //   loadProgress();
  // }, [auth.currentUser]);

  useEffect(()=>{
    const loadProgress =async () =>{
      try {
        const userID = auth.currentUser.uid;
        
        const docRef = doc(db, 'userProgress', userID);
        
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const progressData = data.progress || {}; 
          
          const totalProgress = Object.values(progressData).reduce((sum, val) => {
            return typeof val === 'number' && !isNaN(val) ? sum + val : sum;
          }, 0);

          const normalizedProgress =
            Object.keys(progressData).length > 0
              ? totalProgress / Object.keys(progressData).length
              : 0;

          setProgressValue(normalizedProgress);
          // console.log('✅ Loaded progress from Firestore:', normalizedProgress);
        } 
        else {
          console.log('No progress found in Firestore for user.');
          setProgressValue(0);
        }
      } 
      catch (error) {
        console.error('❌ Failed to load progress from Firestore:', e);
        setProgressValue(0);
      }
    }
    loadProgress()
  },[auth.currentUser])

  useFocusEffect(
    useCallback(() =>{
      const loadAlerts = async () =>{
        try {
          // console.log('gettgin alerts from alerts page')
          const docRef = doc(db, 'alerts', userID);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStoredAlerts(data.data || []);
            // console.log("storedalerts:", storedAlerts)
            // console.log('✅ Loaded alerts from Firestore');
          } else {
            // console.log('❌ No alert document found for user');
            setStoredAlerts([]);
          }
          } catch (error) {
            console.error('🔥 Error loading alerts from Firestore:', error);
            setStoredAlerts([]);
          }
      }
      loadAlerts()
    }, [userID])
  )
  // // load alerts from the alerts page
  // useFocusEffect(
  //   useCallback(() => {
  //     const loadAlerts = async () => {
  //       try {
  //         const json = await AsyncStorage.getItem(`${userID}_alerts`);
  //         if (json) {
  //           // console.log('loaded alerts')
  //           setStoredAlerts(JSON.parse(json));
  //         } 
  //         else {
  //           setStoredAlerts([]);
  //         }
  //       } catch (e) {
  //         console.error('Failed to load alerts:', e);
  //         setStoredAlerts([]);
  //       }
  //     };
  //     loadAlerts();
  //   }, [])
  // );

  // //load user badges 
  // useFocusEffect(
  //   useCallback(() => {
  //     const loadBadge = async () => {
  //       try {
  //         const allBadges = await AsyncStorage.getItem(`${userID}_userBadge`);
  //         if (allBadges){
  //           console.log('loaded user badges:', allBadges)
  //           const parsed = JSON.parse(allBadges);
  //           setBadges(parsed);
  //         }
  //         else{
  //           // console.log('no user badges')
  //         }
  //       } 
  //       catch (err) {
  //         console.error("Failed to load badge:", err);
  //       }
  //     };
  //     loadBadge();
  //   }, [])
  // );
  useFocusEffect(
    useCallback(() => {
      const loadBadge = async () => {
        try {
          const docRef = doc(db, 'userBadges', userID);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // console.log('✅ Loaded user badges from Firestore:', data);
            setBadges(data);
          } 
          else {
            console.log('No badge data found in Firestore.');
            setBadges({});
          }
        } catch (error) {
          console.error("❌ Failed to load badge from Firestore:", error);
          setBadges({});
        }
      };

      loadBadge();
    }, [])
  );

  // useEffect(() => {
  //   const loadChallengeProgress = async () => {
  //     try {
  //       const isDisasterTaskCompleted = await AsyncStorage.getItem(`${userID}_disasterCompletion`);
  //       const scoresPerDisaster = await AsyncStorage.getItem(`${userID}_quizScores`);

  //       const milestoneChallenges = ['Quarterly Challenge','Halfway Challenge','Tri-Quarter Challenge','Final Challenge'];

  //       const completions = isDisasterTaskCompleted ? JSON.parse(isDisasterTaskCompleted) : {};
  //       const scores = scoresPerDisaster ? JSON.parse(scoresPerDisaster) : {};

  //       const completedDisasters = Object.keys(completions).filter(key => completions[key] && !milestoneChallenges.includes(key));
  //       const numCompleted = completedDisasters.length;

  //       const perfectScoreDisasters = completedDisasters.filter(
  //         (disaster) => parseFloat(scores[disaster]) === 100
  //       )
  //       // total number of disasters with perfect score
  //       const numPerfectScores = perfectScoreDisasters.length;

  //       setCompletedDisasters(completedDisasters);

  //       // show badge placeholders based on completion count
  //       // if completed disaster is >= 2, show the badge but unable to attmept the quiz
  //       if (numCompleted >= 2) {
  //         setQuarterlyBadgeAwarded(true); 
  //         await AsyncStorage.setItem(`${userID}_quarterlyBadgeAwarded`, JSON.stringify(true));
  //       }
  //       else{
  //         setQuarterlyBadgeAwarded(false); 
  //         await AsyncStorage.setItem(`${userID}_quarterlyBadgeAwarded`, JSON.stringify(false));
  //       }
  //        // if completed disaster is >= 4, show the midway badge but unable to attmept the quiz
  //       if (numCompleted >= 4) {
  //         setHalfWayBadgeAwarded(true); 
  //         await AsyncStorage.setItem(`${userID}_halfWayBadgeAwarded`, JSON.stringify(true));
  //       }
  //       else{
  //         setHalfWayBadgeAwarded(false)
  //         await AsyncStorage.setItem(`${userID}_halfWayBadgeAwarded`, JSON.stringify(false));
  //       }
  //       // if completed disaster is >= 6, show the 3/4 badge but unable to attmept the quiz
  //       if (numCompleted >= 6) {
  //         setThreeQuarterBadgeAwarded(true); 
  //         await AsyncStorage.setItem(`${userID}_threeQuarterBadgeAwarded`, JSON.stringify(true));
  //       }
  //       else{
  //         setThreeQuarterBadgeAwarded(false)
  //         await AsyncStorage.setItem(`${userID}_threeQuarterBadgeAwarded`, JSON.stringify(false));
  //       }

  //       // if completed disaster is >= 8, show the 3/4 badge but unable to attmept the quiz
  //       if (numCompleted >= 8) {
  //         setFinalBadgeAwarded(true); 
  //         await AsyncStorage.setItem(`${userID}_finalBadgeAwarded`, JSON.stringify(true));
  //       }
  //       else{
  //         setFinalBadgeAwarded(false)
  //         await AsyncStorage.setItem(`${userID}_finalBadgeAwarded`, JSON.stringify(false));
  //       }

  //       // if completed disaster is >= 1 and has a perfectn score, show the badge and can attempt quiz
  //       if (numPerfectScores >= 2) {
  //         setQuarterlyQuiz(true); 
  //       }
  //       // if completed disaster is >= 2 and has a perfect score, show the midway badge and can attempt quiz
  //       if (numPerfectScores >= 4) {
  //         setHalfWayQuiz(true); 
  //       }
  //       // if completed disaster is >= 3 and has a perfect score, show the 3/4 badge and can attempt quiz
  //       if (numPerfectScores >= 6) {
  //         setThreeQuarterQuiz(true); 
  //       }

  //       // if completed disaster is >= 3 and has a perfect score, show the final badge and can attempt quiz
  //       if (numPerfectScores >= 8) {
  //         setFinalQuiz(true); 
  //       }

  //       setEligibility({
  //         completedDisasters,
  //         perfectScore: numPerfectScores === numCompleted && numCompleted > 0,
  //         AllPerfectScores: perfectScoreDisasters
  //       });

  //     } catch (error) {
  //       console.error('Error loading challenge progress:', error);
  //     }
  //   };

  //   loadChallengeProgress();
  // }, []);
    
  //load progress of challenges 
  useEffect(() => {
    const loadChallengeProgress = async () => {
      try {

        const docRef = doc(db, 'userProgress', userID);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.warn('No user progress found.');
          return;
        }

        const data = docSnap.data();
        const completions = data.disasterCompletion || {};
        const scores = data.quizScores || {};
        // name of the challenges
        const milestoneChallenges = ['Quarterly Challenge','Halfway Challenge','Tri-Quarter Challenge','Final Challenge'];
        // remove the challenged from the completed disaster categories
        const completedDisasters = Object.keys(completions).filter(
          key => completions[key] && !milestoneChallenges.includes(key)
        );
        // num of disaster categories completed
        const numCompleted = completedDisasters.length;
        // console.log(numCompleted)
        // num of categories with perfect score
        const perfectScoreDisasters = completedDisasters.filter(
          disaster => parseFloat(scores[disaster]) === 100
        );
        const numPerfectScores = perfectScoreDisasters.length;
        // console.log('numCompleted:', numCompleted)
        // console.log('numPerfectScores:', numPerfectScores)
        setCompletedDisasters(completedDisasters);

        // checking eligibility for the milestone challenges
        setQuarterlyBadgeAwarded(numCompleted >= 2);
        setHalfWayBadgeAwarded(numCompleted >= 4);
        setThreeQuarterBadgeAwarded(numCompleted >= 6);
        setFinalBadgeAwarded(numCompleted >= 8);

        setQuarterlyQuiz(numPerfectScores >= 2);
        setHalfWayQuiz(numPerfectScores >= 4);
        setThreeQuarterQuiz(numPerfectScores >= 6);
        setFinalQuiz(numPerfectScores >= 8);

        setEligibility({
          completedDisasters,
          perfectScore: numPerfectScores === numCompleted && numCompleted > 0,
          AllPerfectScores: perfectScoreDisasters
        });

      } catch (error) {
        console.error('Error loading challenge progress from Firestore:', error);
      }
    };

    loadChallengeProgress();
  }, [userID]);

  // extract the completed disasters
  const getCompletedDisasters = (completionDisaster) =>{
    return Object.entries(completedDisasters).filter(([_, completed]) => completed).map(([disaster]) => disaster);
  }
  const disasterQuizMap = {
    All:quizzes,
    Earthquake: earthquakeQuizzes,
    Flood: floodQuizzes,
    Hurricane: hurricaneQuizzes,
    Tsunami: tsunamiQuizzes,
    Tornado: tornadoQuizzes,
    Pandemic: pandemicQuizzes,
    Wildfire: wildfireQuizzes,
  };

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const generateProgressQuiz = (perfectScoreDisasters) => {
    let combinedQuestions = [];

    perfectScoreDisasters.forEach(disaster => {
      const quiz = disasterQuizMap[disaster];
      if (quiz) {
        combinedQuestions = [...combinedQuestions, ...quiz];
      }
    });

    return shuffleArray(combinedQuestions)

    
  };

  useFocusEffect(
    useCallback(() => {
      const loadBadges = async () => {
        try {
          const docRef = doc(db, 'userChallengeCompletion', userID);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) 
          {
            const data = docSnap.data();
            console.log(data)
            if (data.quarterlyChallengeCompleted === true) {
              setQuarterlyChallengeCompleted(true);
              // setQuarterlyBadgeAwarded(true)
            }

            if (data.halfwayChallengeCompleted === true) {
              setHalfWayChallengeCompleted(true);
            }

            if (data.threeQuarterChallengeCompleted === true) {
              setThreeQuarterChallengeCompleted(true);
            }

            if (data.finalChallengeCompleted === true) {
              setFinalChallengeCompleted(true);
            }
          } 
          else {
            // console.warn('No badge document found for user');
          }
        } 
        catch (error) {
          console.error('❌ Failed to load challenge badges:', error);
        }
      };

      if (userID) {
        loadBadges();
      }
    }, [userID])
  );
  // quarterly badge awarded to user
  // useFocusEffect(
  //   useCallback(() => {
  //     const loadQuarterlyBadge = async () => {
  //       // get the quarterly challenge badge from the storage
  //       try {
  //         const completedAndAwardedQuarterlyBadge = await AsyncStorage.getItem(`${userID}_quarterlyChallengeCompleted`);
  //         setQuarterlyChallengeCompleted(JSON.parse(completedAndAwardedQuarterlyBadge) === true);
  //         // console.log("Loaded 25% milestone Badge :", completedAndAwardedQuarterlyBadge);
  //       } 
  //       // else show that it did not load the badge
  //       catch (err) {
  //         console.error("Failed to load quarterly badge:", err);
  //       }
  //     };
  //     loadQuarterlyBadge();
  //   }, [])
  // );
  
  // half way progress badge for the user
  // useFocusEffect(
  //   useCallback(() => {
  //     const loadMidBadge = async () => {
  //       try {
  //         const completedAndAwardedHalfWayBadge = await AsyncStorage.getItem(`${userID}_halfWayChallengeCompleted`);
  //         setHalfWayChallengeCompleted(JSON.parse(completedAndAwardedHalfWayBadge) === true);
  //         // console.log("Loaded 50% milestone Badge :", completedAndAwardedHalfWayBadge);
  //       } 
  //       catch (err) {
  //         console.error("Failed to load mid badge:", err);
  //       }
  //     };
  //     loadMidBadge();
  //   }, [])
  // );

  // load 3/4 progress badge
  // useFocusEffect(
  //   useCallback(() => {
  //     const loadThreeQuarterBadge = async () => {
  //       try {
  //         const completedAndAwardedThreeQuarterBadge = await AsyncStorage.getItem(`${userID}_threeQuarterChallengeCompleted`);
  //         setThreeQuarterChallengeCompleted(JSON.parse(completedAndAwardedThreeQuarterBadge) === true);
  //         // console.log("Loaded 75%% milestone Badge :", completedAndAwardedThreeQuarterBadge);
  //       } 
  //       catch (err) {
  //         console.error("Failed to load 3/4 badge:", err);
  //       }
  //     };
  //     loadThreeQuarterBadge();
  //   }, [])
  // );

  //load final progress badge
  // useFocusEffect(
  //   useCallback(() => {
  //     const loadFinalBadge = async () => {
  //       try {
  //         const completedAndAwardedFinalBadge = await AsyncStorage.getItem(`${userID}_finalChallengeCompleted`);
  //         setFinalChallengeCompleted(JSON.parse(completedAndAwardedFinalBadge) === true);
  //         // console.log("Loaded 100% milestone Badge :", completedAndAwardedFinalBadge);
  //       } 
  //       catch (err) {
  //         console.error("Failed to load final badge:", err);
  //       }
  //     };
  //     loadFinalBadge();
  //   }, [])
  // );

  
  // set the color of the alert
  const getAlertColor = (severity) => 
  {
    switch (severity?.toLowerCase()) {
      case 'moderate':
        return '#f1e166ff'; 
      case 'severe':
        return '#FB9E3A'; 
      case 'extreme':
        return '#d75050ff'; 
      default:
        return '#B0BEC5'; 
    }
  };
  const renderAlert = ({ item: alert }) => {
    const severityColor = getAlertColor(alert.severity);
    return (
      <TouchableOpacity style={styles.alertTouchable} onPress={()=>navigation.navigate('weatherAlerts')}>
        <View style={[styles.alertBox, { backgroundColor: severityColor }]}>
          <Text style={{ fontFamily: 'times new roman', color: "black", marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Headline: </Text>
            {alert.headline || alert.event || 'Weather Alert'}
          </Text>
          <Text style={{ fontFamily: 'times new roman', color: "black" }}>
            <Text style={{ fontWeight: 'bold' }}>Severity: </Text>
            {alert.severity || 'N/A'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // show delete button when swiped
  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteEachNotif(item)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
  // remove each notification when swiped to the left
  const deleteEachNotif = (itemToRemove) => {
    console.log(`deleted alert - ${alert.headline}`)
    const updatedAlerts = storedAlerts.filter(alert =>
      alert.headline !== itemToRemove.headline || alert.effective !== itemToRemove.effective
    );
    
    setStoredAlerts(updatedAlerts);
  };
  // remove all notifications
  const clearAllNotifs =async()=>{
    setStoredAlerts([]);
    console.log('Clear all button clicked - removed all alerts from home page')
    await AsyncStorage.removeItem('alerts');

  }

  return (
    <View style={styles.container}>
      <SwipeListView
        data={storedAlerts}
        keyExtractor={(item, index) =>`${item.headline}-${item.event}-${item.effective}-${item.expires || index}`}
        renderItem={renderAlert}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        disableRightSwipe
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <Text style={styles.noAlertsText}>
            No recent alerts!
          </Text>
        }
        ListHeaderComponent={
          <>
            <Text style={styles.welcomeTitle}>Hello {auth.currentUser.displayName}!</Text>
            {/**progress bar */}
            <Text style={styles.subTitle}>Your preparedness</Text>
            <View style={styles.progressContainer}>
              <Text style={{fontSize:13, fontFamily:'times new roman', marginBottom:10, fontStyle:'italic', color:'#54626F',}}>Progress towards being disaster ready</Text>
              <ProgressBar progress={progressValue || 0} width={screenWidth * 0.9} height={25} color="#008080" borderColor="#D1D0CE" borderWidth={2} style={{alignSelf:'center', marginTop:10}}/>
              {/** continue learning button to nav to prep tasks */}
              <TouchableOpacity style={styles.continueBtn} onPress={() => {navigation.navigate('disasterPrepTasks'), console.log('continue learning button clicked!')}}>
                <Text style={{padding:5, fontFamily:'times new roman', fontSize:12,color:'#3B444B',}}>Continue learning!</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subTitle}> Your achievements</Text>
            <View style={styles.badgeContainer}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 15 }}>
                {badges &&
                  Object.entries(badges).filter(([disaster, _]) =>
                    !['Halfway Challenge', 'Quarterly Challenge', 'Tri-Quarter Challenge', 'Final Challenge'].includes(disaster)
                  ).length === 0 && (
                    <Text style={{ fontFamily: 'times new roman', fontSize: 13, color: 'gray' }}>
                      Complete disaster tasks and quizzes to earn badges!
                    </Text>
                )}
                {badges && Object.keys(badges).length > 0 &&
                  Object.entries(badges)
                    .filter(([disaster, _]) => disaster !== 'Halfway Challenge' && disaster !== 'Quarterly Challenge' && disaster !== 'Tri-Quarter Challenge' && disaster !== 'Final Challenge' )
                    .map(([disaster, badge]) => (
                      <View key={disaster} style={styles.eachBadgeContainer}>
                        <Image
                          source={
                            badge === 'gold'
                              ? require('./assets/goldBadge.png')
                              : require('./assets/silverBadge.png')
                          }
                          style={styles.badgeImage}
                        />
                        <Text style={{ fontFamily: 'times new roman', marginTop: 5, color: '#3d6dc7', fontSize: 13 }}>
                          {disaster} ready!
                        </Text>
                      </View>
                    ))
                }

                {/* only quarterly challenge if condition is met */}
                {quarterlyBadgeAwarded && (
                  <TouchableOpacity
                    onPress={() => {
                      if(quarterlyQuiz){
                        console.log('attempting 25% milestone quiz!')
                        const mergedQuiz = generateProgressQuiz(eligibility.AllPerfectScores);
                        navigation.navigate('quiz', {
                          quizzes: mergedQuiz,
                          selectedDisaster: 'Quarterly Challenge',
                          highestGrade: 0,
                        });
                      }
                      else {
                        console.log('Perfect scores in the completed disaster categories were not obtained!')
                        setShowModal(true);
                      }
                    }}
                    style={[
                      styles.eachBadgeContainer,
                      { marginTop: 10, opacity: quarterlyQuiz ? 1 : 0.4 },
                    ]}
                  >
                    <Image
                      source={require('./assets/quarter.png')}
                      style={{ width: 30, height: 30, elevation: 4, shadowColor: '#4300FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.9, shadowRadius: 5 }}
                    />
                    <Text style={{ fontFamily: 'times new roman', marginTop: 5, color: quarterlyChallengeCompleted ? 'green' : 'gray', fontSize: 13, textAlign: 'center' }}>
                      {quarterlyChallengeCompleted ? '✔ 1/4 Challenge completed!' : '1/4 progress challenge'}
                    </Text>
                    <Text style={{ fontSize: 10, color: 'blue', fontStyle: 'italic', textAlign: 'center' }}>
                      {quarterlyChallengeCompleted ? '' : '*Attempt quiz to unlock*'}
                    </Text>
                  </TouchableOpacity>
                )}
                {/** conditions for 50% progress */}
                {halfWayBadgeAwarded && (
                  <TouchableOpacity
                    onPress={() => {
                      if (halfWayQuiz) {
                        const mergedQuiz = generateProgressQuiz(eligibility.AllPerfectScores);
                        navigation.navigate('quiz', {
                          quizzes: mergedQuiz,
                          selectedDisaster: 'Halfway Challenge',
                          highestGrade: 0,
                        });
                      } else {
                        setShowModal(true);
                      }
                    }}
                    style={[
                      styles.eachBadgeContainer,
                      { marginTop: 10, opacity: halfWayQuiz ? 1 : 0.4 },
                    ]}
                  >
                    <Image
                      source={require('./assets/silver.png')}
                      style={{ width: 30, height: 30, elevation: 4, shadowColor: '#4300FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.9, shadowRadius: 5 }}
                    />
                    <Text style={{ fontFamily: 'times new roman', marginTop: 5, color: halfWayChallengeCompleted ? 'green' : 'gray', fontSize: 13, textAlign: 'center' }}>
                      {halfWayChallengeCompleted ? '✔ 1/2 Challenge completed!' : '1/2 progress challenge'}
                    </Text>
                    <Text style={{ fontSize: 10, color: 'blue', fontStyle: 'italic', textAlign: 'center' }}>
                      {halfWayChallengeCompleted ? '' : '*Attempt quiz to unlock*'}
                    </Text>
                  </TouchableOpacity>
                )}
                {/** connditions and challenge for 75% progress */}
                {threeQuarterBadgeAwarded && (
                  <TouchableOpacity
                    onPress={() => {
                      if (threeQuarterQuiz) {
                        const mergedQuiz = generateProgressQuiz(eligibility.AllPerfectScores);
                        navigation.navigate('quiz', {
                          quizzes: mergedQuiz,
                          selectedDisaster: 'Tri-Quarter Challenge',
                          highestGrade: 0,
                        });
                      } else {
                        setShowModal(true);
                      }
                    }}
                    style={[
                      styles.eachBadgeContainer,
                      { marginTop: 10, opacity: threeQuarterQuiz ? 1 : 0.4 },
                    ]}
                  >
                    <Image
                      source={require('./assets/final.png')}
                      style={{ width: 30, height: 30, elevation: 4, shadowColor: '#4300FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.9, shadowRadius: 5 }}
                    />
                    <Text style={{ fontFamily: 'times new roman', marginTop: 5, color: threeQuarterChallengeCompleted ? 'green' : 'gray', fontSize: 13, textAlign: 'center' }}>
                      {threeQuarterChallengeCompleted ? '✔ 3/4 Challenge completed!' : '3/4 progress challenge'}
                    </Text>
                    <Text style={{ fontSize: 10, color: 'blue', fontStyle: 'italic', textAlign: 'center' }}>
                      {threeQuarterChallengeCompleted ? '' : '*Attempt quiz to unlock*'}
                    </Text>
                  </TouchableOpacity>
                )}

                {finalBadgeAwarded && (
                  <TouchableOpacity
                    onPress={() => {
                      if (finalQuiz) {
                        const mergedQuiz = generateProgressQuiz(eligibility.AllPerfectScores);
                        navigation.navigate('quiz', {
                          quizzes: mergedQuiz,
                          selectedDisaster: 'Final Challenge',
                          highestGrade: 0,
                        });
                      } else {
                        setShowModal(true);
                      }
                    }}
                    style={[
                      styles.eachBadgeContainer,
                      { marginTop: 10, opacity: finalQuiz ? 1 : 0.4 },
                    ]}
                  >
                    <Image
                      source={require('./assets/threeQuarter.png')}
                      style={{ width: 30, height: 30, elevation: 4, shadowColor: '#4300FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.9, shadowRadius: 5 }}
                    />
                    <Text style={{ fontFamily: 'times new roman', marginTop: 5, color: finalChallengeCompleted ? 'green' : 'gray', fontSize: 13, textAlign: 'center' }}>
                      {finalChallengeCompleted ? '✔ Final Challenge completed!' : 'Final progress challenge'}
                    </Text>
                    <Text style={{ fontSize: 10, color: 'blue', fontStyle: 'italic', textAlign: 'center' }}>
                      {finalChallengeCompleted ? '' : '*Attempt quiz to unlock*'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showModal && (
              <View style={styles.modelContainer}>
                
                <View style={styles.innerModelContainer}>      
                  <View style ={styles.challengeHeader}>
                    <Text style={{color:'white', fontFamily:'times new roman', fontSize:16}}> ~ Progress Challenge ~</Text>
                  </View>           
                  <View style={{flexDirection:'row', padding:15, justifyContent:'space-between'}}>
                    <AntDesign
                      style={styles.icon}
                      color="orange"
                      name="star"
                      size={30}
                    />
                    <Text style={{ fontFamily: 'times new roman', fontSize: 15, marginBottom: 15, textAlign: 'center', color:'black',}}>                   
                    To unlock this challenge, you must score 100 in each disaster quiz!
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={{
                      backgroundColor:'#3488e2ff',
                      // backgroundColor: '#3d6dc7',
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 5
                    }}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={{ color: 'white', fontFamily: 'times new roman' }}>Got it!</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}


            {/** show recent alerts and allow deletion when user swipes to the left */}
            <View style={{flexDirection:'row', padding:10, justifyContent:'space-between'}}>
              <Text style={styles.subTitle}>Recent alerts</Text>
              <TouchableOpacity onPress={clearAllNotifs}>
                <Text style={styles.clearBtn}>Clear all</Text>
              </TouchableOpacity> 
            </View>
          </>
        }
      />
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    // marginBottom:10
  },
  progressContainer:{
    alignSelf:'center',
    padding:20,
    width:'95%',
    borderWidth:1,
    borderRadius:10,
    borderColor:'#9DC183',
  },
  continueBtn:{
    width:'40%',
    backgroundColor:'#F5ECCF',
    alignItems:'center',
    marginTop:20,
    borderRadius:10,
    alignSelf:'flex-end',
    borderWidth:1,
    borderColor:'black',
    elevation:5
  },
  alertContainer:{
    marginBottom:20
  },
  welcomeTitle:{
    fontSize:27,
    color:'#54626F',
    fontFamily:'times new roman',
    fontWeight:'bold',
    padding:20,
    marginTop:20,
    marginBottom:20,
    elevation:5,
    textAlign:'center',
    backgroundColor:'#faf1e67b',
    // height:100
  },
  subTitle:{
    fontSize:16, 
    fontFamily:'times new roman',
    padding:10,
    fontWeight:'bold',
    color:'#54626F',
  },
  alertBox:{
    backgroundColor:'#F5ECCF',
    padding:10,
    marginTop:10,
    borderRadius:10,
    width:'95%',
    alignSelf:'center'
  },
  alertTouchable: {
    marginVertical: 5,
  },
  noAlertsText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
    color: 'gray',
    fontFamily: 'times new roman'
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#F2F0EF',
    flex: 1,
    flexDirection: 'row',
    justifyContent:'flex-end',
    alignSelf:'center',
    paddingRight: 15,
    marginBottom: 10,
    borderRadius: 12,
    width:'97%'

  },
  deleteButton: {
    width: 75,
    height: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#3B444B',
    fontFamily:'times new roman'
  },
  clearBtn:{
    color:'#54626F',
    fontFamily:'times new roman',
    padding:10,
  },
  badgeImage:{
    width: 40, 
    height: 40, 
  },
  badgeContainer: {
    borderWidth: 1,
    borderColor: '#689c98',
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 20,
    backgroundColor: '#F5ECCF',
    elevation:5
  },
  eachBadgeContainer:{
    padding:10,
    alignItems:'center'
  },
  modelContainer:{
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  innerModelContainer:{
    width: '80%',
    padding: 20,
    backgroundColor: '#e9e5f3ff',
    borderRadius: 10,
    elevation: 10,
    alignItems: 'center',
    borderWidth:1,
    borderColor:'gold'
    // height:'50%'
  },
  challengeHeader:{
    backgroundColor:'#2C3863',
    height:'40%',
    width:'85%',
    alignItems:'center',
    justifyContent:'center',
    top:-25,
    position: 'absolute',
    borderRadius:10,
    borderWidth:1,
    // borderRightWidth:1,
    // borderLeftWidth:1,
    // borderBottomWidth:1,
    elevation:5,
    borderColor:'gold'

  }
 
});

export default Home;

