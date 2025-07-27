import React, {useEffect} from 'react'
import {Text, View, StyleSheet,Image, TouchableOpacity, BackHandler} from 'react-native'
import { auth, db} from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const QuizScore =() =>{
    // const [userID, setUserID] = useState(null);
    const route = useRoute();
    const { score, total, quizzes, selectedDisaster, highestGrade } = route.params;

    const navigation = useNavigation()

    // remove back navigation
    useEffect(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backHandler.remove();
    }, []);
    // get the user id
    const userID = auth.currentUser?.uid;

    //save the badges obtained so it can be displayed on the home page dashboard 
    // useEffect(() => {
    //   const saveBadge = async () => {
    //     try {
    //       // if not authenticated
    //       if (!userID) {
    //         console.warn("User not authenticated. Cannot save badge.");
    //         return;
    //       }
    //       // get the bagdes
    //       const previous = await AsyncStorage.getItem(`${userID}_userBadge`);
    //       let existingBadges = {};
    //       let newBadge = null;       
    //       const currentBadge = existingBadges[selectedDisaster];

    //       if (previous) {
    //         existingBadges = JSON.parse(previous);
    //       }
    //       // upgrade the badge from silver to gold 
    //       const isUpgrade = (newBadge === 'gold' && currentBadge !== 'gold') || (newBadge === 'silver' && !currentBadge);       

    //       // ensure that they only get the badge when perfect score is obtained
    //       if(selectedDisaster === 'Quarterly Challenge' && parseFloat(percent) >= 100){
    //         existingBadges[selectedDisaster] = 'quarterly';
    //         console.log('Scored 100% on the: ', selectedDisaster)
    //         // await AsyncStorage.setItem('userBadge', JSON.stringify(existingBadges));
    //         await AsyncStorage.setItem(`${userID}_quarterlyChallengeComplated`, JSON.stringify(true));
    //         return
            
    //       }
    //       if(selectedDisaster === 'Halfway Challenge' && parseFloat(percent) >= 100){
    //         existingBadges[selectedDisaster] = 'halfway';
    //         // await AsyncStorage.setItem('userBadge', JSON.stringify(existingBadges));
    //         await AsyncStorage.setItem(`${userID}_halfwayChallengeCompleted`, JSON.stringify(true));
    //         return;
    //       }
    //       if(selectedDisaster === 'Tri-Quarter Challenge' && parseFloat(percent) >= 100){
    //         existingBadges[selectedDisaster] = 'tri-quarter';
    //         // await AsyncStorage.setItem('userBadge', JSON.stringify(existingBadges));
    //         await AsyncStorage.setItem(`${userID}_threeQuarterChallengeCompleted`, JSON.stringify(true));
    //         return;
    //       }
    //       if(selectedDisaster === 'Final Challenge' && parseFloat(percent) >= 100){
    //         existingBadges[selectedDisaster] = 'final';
    //         // await AsyncStorage.setItem('userBadge', JSON.stringify(existingBadges));
    //         await AsyncStorage.setItem(`${userID}_finalChallengeCompleted`, JSON.stringify(true));
    //         return;
    //       }
          
    //       if (newBadge && isUpgrade) {
    //         existingBadges[selectedDisaster] = newBadge;
    //         await AsyncStorage.setItem(`${userID}_userBadge`, JSON.stringify(existingBadges));
    //       }
    //       else{
    //         if (qualifyForGoldBadge) {
    //           console.log(`user obtained gold badge for ${selectedDisaster} quiz` )
    //           newBadge = 'gold';
    //         } 
    //         else if (qualifyForSilverBadge && existingBadges[selectedDisaster] !== 'gold') {
    //           newBadge = 'silver';
    //         }
    //         if (newBadge && existingBadges[selectedDisaster] !== newBadge) {
    //           existingBadges[selectedDisaster] = newBadge;
    //           await AsyncStorage.setItem(`${userID}_userBadge`, JSON.stringify(existingBadges));
    //         }
    //       }
    //     } 
    //     catch (error) {
    //         console.error("Failed to save badge:", error);
    //     }
    //   };
    //   if (selectedDisaster && percent) {
    //     saveBadge();
    //   }
    //   // saveBadge();
    // }, [qualifyForGoldBadge, qualifyForSilverBadge, selectedDisaster, percent]);

    useEffect(() => {
      const saveBadges = async () => {
        try {
          // if user is not found
          if (!userID) {
            return;
          }

          const docRef = doc(db, 'userBadges', userID);
          const docSnap = await getDoc(docRef);

          let existingBadges = {};
          if (docSnap.exists()) {
            existingBadges = docSnap.data();
          }

          let newBadge = null;
          const currentBadge = existingBadges[selectedDisaster];

          // ensure that they only get the milestone badges when perfect score is obtained
          // 1/4-way challenge
          if (selectedDisaster === 'Quarterly Challenge' && parseFloat(percent) >= 100) {
            existingBadges[selectedDisaster] = 'quarterly';
            await setDoc(docRef, existingBadges);
            await setDoc(doc(db, 'userChallengeCompletion', userID), { quarterlyChallengeCompleted: true }, { merge: true });
            return;
          }
          // 1/2 way challenge
          if (selectedDisaster === 'Halfway Challenge' && parseFloat(percent) >= 100) {
            existingBadges[selectedDisaster] = 'halfway';
            await setDoc(docRef, existingBadges);
            await setDoc(doc(db, 'userChallengeCompletion', userID), { halfwayChallengeCompleted: true }, { merge: true });
            return;
          }
          // 3/4 way challenge
          if (selectedDisaster === 'Tri-Quarter Challenge' && parseFloat(percent) >= 100) {
            existingBadges[selectedDisaster] = 'tri-quarter';
            await setDoc(docRef, existingBadges);
            await setDoc(doc(db, 'userChallengeCompletion', userID), { threeQuarterChallengeCompleted: true }, { merge: true });
            return;
          }
          // last challenge
          if (selectedDisaster === 'Final Challenge' && parseFloat(percent) >= 100) {
            existingBadges[selectedDisaster] = 'final';
            await setDoc(docRef, existingBadges);
            await setDoc(doc(db, 'userChallengeCompletion', userID), { finalChallengeCompleted: true }, { merge: true });
            return;
          }

          //  upgrade badge if prev badge was silver and new gold badge is obtained after retry 
          const isUpgrade = (newBadge === 'gold' && currentBadge !== 'gold') || (newBadge === 'silver' && !currentBadge);
          // if gold badge 
          if (qualifyForGoldBadge) {
            newBadge = 'gold';
          }
          // if silver badge 
          else if (qualifyForSilverBadge && currentBadge !== 'gold') {
            newBadge = 'silver';
          }
          // if not gold and silver badge, special badge 
          if (newBadge && currentBadge !== newBadge) {
            existingBadges[selectedDisaster] = newBadge;
            await setDoc(docRef, existingBadges);
          }
        } 
        catch (error) {
          console.error("Failed to save badge to Firestore:", error);
        }
      };

      if (selectedDisaster && percent) {
        saveBadges();
      }
    }, [qualifyForGoldBadge, qualifyForSilverBadge, selectedDisaster, percent]);

    // calculate the score in percentage
    const calculatePercentage = (score)=>{
      return (score/total * 100).toFixed(1);
    }
    const percent = calculatePercentage(score);
    // get the highest grade of all the user's tries
    const calculateHighestGrade = Math.max(parseFloat(percent),parseFloat(highestGrade || 0));

    // const calculateHighestGrade = Math.max(parseFloat(percent), parseFloat(highestGrade || 0)).toFixed(1);

    // check if user hit 70% for silver badge
    const qualifyForSilverBadge = parseFloat(percent) >= 70;

    // check if user hit 95% for gold badge
    const qualifyForGoldBadge = parseFloat(percent) >= 95;
    // save the users score
    const saveUserScore = async(disaster,grade)=>{
      try {
        const docRef = doc(db, 'userProgress', userID);
        await setDoc(docRef, {quizScores: {[disaster]: grade}}, { merge: true });
      } 
      catch (error) {
        console.error("❌ Error saving quiz score:", error);
      }
        // try {
        //     const stored = await AsyncStorage.getItem(`${userID}_quizScores`);
        //     const scores = stored ? JSON.parse(stored) : {};
        //     const existingGrade = parseFloat(scores[disaster] || 0);
        //     const newGrade = Math.max(existingGrade, parseFloat(grade))
        //     scores[disaster] = newGrade;
        //     await AsyncStorage.setItem(`${userID}_quizScores`, JSON.stringify(scores));
        // } 
        // catch (error) {
        //     console.error("Error saving quiz score:", error);
        // }
    }

    useEffect(() => {
      if(selectedDisaster && calculateHighestGrade) {
        saveUserScore(selectedDisaster, calculateHighestGrade);
      }
    }, [selectedDisaster, calculateHighestGrade]);
   


    return (
        <View style={styles.container}>
          <View style={styles.scoreContainer}>
            <Text style={styles.resultText}>{selectedDisaster} Quiz Complete!</Text>
            <Text style={styles.scoreText}>You scored {score} out of {total}</Text>
            <Text style={styles.scoreText}>Grade: {percent}%</Text>

            {qualifyForGoldBadge ?
            (
              <View style={styles.badgeContainer}>
                <Text style={styles.scoreText}>Congratulations, you earned a gold badge!</Text>
                <Image
                  source={require('./assets/goldBadge.png')}
                  style={styles.badgeImage}
                />
              </View>
            ) : qualifyForSilverBadge ? (
              <View style={styles.badgeContainer}>
                <Text style={styles.scoreText}>Congratulations, you earned a silver badge!</Text>
                <Image
                  source={require('./assets/silverBadge.png')}
                  style={styles.badgeSilverImage}
                />
              </View>
            ) :(
              <Text style={styles.tryAgainText}>Score at least 70% to earn a badge. Keep going!</Text>
            )}
            <View style={styles.buttons}>
              {/**retry button */}
              <TouchableOpacity style={styles.button} onPress={() =>navigation.replace('quiz', { reset: true, quizzes, selectedDisaster:selectedDisaster })}>
                <Text style={{fontFamily:'times new roman', color:"#2A3439"}}>Retry</Text>
              </TouchableOpacity>

              {/**back to all disaster button */}
              <TouchableOpacity style={styles.button} 
                  onPress={() => {
                  if (selectedDisaster === 'Quarterly Challenge' || selectedDisaster === 'Halfway Challenge' || selectedDisaster === 'Tri-Quarter Challenge' || selectedDisaster === 'Final Challenge') {
                    // go back to home after completing the challenges
                    navigation.navigate('home', {refresh:true});
                  } 
                  else {
                    // nav to allTasks after normal disaster quizzes
                    navigation.navigate('allTasks', {
                      selectedDisaster: selectedDisaster, 
                      highestGrade: calculateHighestGrade
                    });
                  }
                }}
              >
                <Text style={{fontFamily:'times new roman', color:"#2A3439"}}>Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor:'white'
  },
  scoreContainer:{
    backgroundColor:'#F5ECCF',
    height:'97%',
    alignItems:'center',
    justifyContent: 'center',
    width:'95%',
    alignSelf:'center',
    elevation:5,
    borderRadius:10

  },
  resultText: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign:'center',
    fontFamily:'times new roman',
    color:'#2A3439'
  },

  scoreText: { 
    fontSize: 20,
    textAlign:'center',
    fontFamily:'times new roman',
    color:'#54626F'
  },
  badgeContainer: {
    marginTop: 15,
    alignItems: 'center',
    
  },
  badgeImage:{
    width: 120,
    height: 120,
    marginTop:10,
    borderColor: 'red',
  },
  badgeSilverImage:{
    width:120,
    height:150,
    marginTop:10,
    borderColor: 'red',

  },
  tryAgainText:{
    padding:10,
    fontFamily:'times new roman',
    fontStyle:'italic', 
    color:'grey'   
  }, 
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%', 
    marginTop: 20,
  },
  button: {
    backgroundColor: '#9DC183',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});

export default QuizScore;