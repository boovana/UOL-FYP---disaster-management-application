

import React, { useState, useEffect } from 'react';
import { FlatList, View, Text,TouchableOpacity, StyleSheet, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskInfo from './data/TaskInfo.json';
import { auth, db} from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AntDesign from '@expo/vector-icons/AntDesign';

import Footer from './footer'


const DisasterPrepTasks = ({navigation}) => {
    const [selectedDisaster, setSelectedDisaster] = useState(null);
    const disasterList = ["Common preparation and tips","Flood", "Earthquake", "Hurricane", "Tornado", "Wildfire", "Tsunami", "Pandemic"]
    const allDisasters = ["Flood", "Earthquake", "Hurricane", "Tornado", "Wildfire", "Tsunami", "Pandemic"]
    const [disasterCompleted, setDisasterCompleted] = useState({})
    const userID = auth.currentUser?.uid;

    console.log('successfully navigated to the prepare page')
    // filter the tasks if its commmon between all
    let filteredTasks;
    if(selectedDisaster == "Common preparation and tips"){
        filteredTasks =TaskInfo.filter(task =>allDisasters.every(disaster => task.disasterTypes.includes(disaster)))
    }
    else {
        filteredTasks = TaskInfo.filter(task =>task.disasterTypes.length === 1 && task.disasterTypes[0] === selectedDisaster);
    }
    useEffect(() => {
        console.log('Disaster completed map:', disasterCompleted);
    }, [disasterCompleted]);


    // find out if the disaster tasks have been completed
    useEffect(() => {
        const loadCompletion = async () => {
            try {
            const docRef = doc(db, 'userProgress', userID); 
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.disasterCompletion) {
                setDisasterCompleted(data.disasterCompletion);
                }
            }
            } catch (error) {
            console.error('Error loading disaster completion from Firestore:', error);
            }
        };

        loadCompletion();
    }, []);
    // extract the completed disasters
    const getCompletedDisasters = (completionDisaster) =>{
        Object.entries(completionDisaster).filter(([_, completed]) => completed).map(([disaster]) => disaster);
    }
        

    return (
        <View style={{ paddingBottom: 70, flex:1, backgroundColor:'white', padding:15}}>
            <Text style={styles.header}>Prepare</Text>

            <Text style={styles.subheader}>Complete tasks from each category below, earn points and badges and be disaster-ready!</Text>
            <FlatList
                data = {disasterList} 
                keyExtractor={(item, i) => i.toString()}
                renderItem={({ item }) => {
                    const isCompleted = disasterCompleted[item]; 
                    return(
                        <TouchableOpacity style={styles.disasterBox} onPress={() => {setSelectedDisaster(item), navigation.navigate('allTasks', {selectedDisaster:item}, console.log("selected disaster type:", item))}}>
                            <View style={{ flexDirection: 'row', justifyContent:'space-evenly'}}>
                                {item == "Common preparation and tips" && (
                                    <Image style={styles.icon} source={require('./assets/images/preparation.png')}/>
                                )}
                                {item == "Flood" && (
                                    <Image style={styles.icon} source={require('./assets/images/flood.png')}/>
                                )}
                                {item == "Earthquake" && (
                                    <Image style={styles.icon} source={require('./assets/images/earthquake.png')}/>
                                )}
                                {item == "Hurricane" && (
                                    <Image style={styles.icon} source={require('./assets/images/hurricane.png')}/>
                                )}
                                {item == "Tornado" && (
                                    <Image style={styles.icon} source={require('./assets/images/tornado.png')}/>
                                )}
                                {item == "Wildfire" && (
                                    <Image style={styles.icon} source={require('./assets/images/wildfire.png')}/>
                                )}
                                {item == "Tsunami" && (
                                    <Image style={styles.icon} source={require('./assets/images/tsunami.png')}/>
                                )}
                                {item == "Pandemic" && (
                                    <Image style={styles.icon} source={require('./assets/images/virus.png')}/>
                                )}
                                <View style={{width:'50%', alignItems:'center', justifyContent:'center'}}>
                                    <Text style={{ fontFamily: 'times new roman', color: '#2A3439', fontSize:15}}>{item}</Text>
                                </View>
                                
                                {isCompleted && ( 
                                    <AntDesign
                                        style={{ alignSelf:'center'}}
                                        color="#008080"
                                        name="Safety"
                                        size={25}
                                    />                                   
                                )}
                            </View>
                        </TouchableOpacity>
                    )
                }}
            />
            <Footer navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    subheader:{
        fontFamily:'times new roman',
        fontSize:17,
        padding:10,
        marginBottom:20,
        fontWeight:'bold',
        color:'#54626F'
    },  
    header:{
        fontFamily:'times new roman',
        fontSize:25,
        color:'#54626F',
        fontWeight:'bold',
        textAlign:'center',
        margin:20
    },
    disasterBox:{
        backgroundColor:"#F5ECCF",
        marginBottom:10,
        padding:25,
        borderRadius:10,
        borderWidth:1,
        borderColor:'#4d5d53',
        elevation:3,
    },
    icon:{
        width:40,
        height:40
    }
})


export default DisasterPrepTasks;