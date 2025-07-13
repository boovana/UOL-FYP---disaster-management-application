

import React, { useState, useEffect } from 'react';
import { FlatList, View, Text,TouchableOpacity, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskInfo from './data/TaskInfo.json';
import AntDesign from '@expo/vector-icons/AntDesign';

import Footer from './footer'


const DisasterPrepTasks = ({navigation}) => {
    const [selectedDisaster, setSelectedDisaster] = useState(null);
    const disasterList = ["Common preparation and tips","Flood", "Earthquake", "Hurricane", "Tornado", "Wildfire", "Tsunami", "Pandemic"]
    const allDisasters = ["Flood", "Earthquake", "Hurricane", "Tornado", "Wildfire", "Tsunami", "Pandemic"]
    const [disasterCompleted, setDisasterCompleted] = useState({})
    // filter the tasks if its commmon between all
    let filteredTasks;
    if(selectedDisaster == "Common preparation and tips"){
        filteredTasks =TaskInfo.filter(task =>allDisasters.every(disaster => task.disasterTypes.includes(disaster)))
    }
    else {
        filteredTasks = TaskInfo.filter(task =>task.disasterTypes.length === 1 && task.disasterTypes[0] === selectedDisaster);
    }

    // find out if the disaster tasks have been completed
    useEffect(() => {
        const loadCompletion = async () => {
        try {
            const stored = await AsyncStorage.getItem('disasterCompletion');
            if (stored) {
            setDisasterCompleted(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading disaster completion status:', error);
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
            <Text style={styles.header}>Complete tasks from each category below, earn points and badges and be disaster-ready!</Text>
            <FlatList
                data = {disasterList} 
                keyExtractor={(item, i) => i.toString()}
                renderItem={({ item }) => {
                    const isCompleted = disasterCompleted[item]; 
                    return(
                        <TouchableOpacity style={styles.disasterBox} onPress={() => {setSelectedDisaster(item), navigation.navigate('allTasks', {selectedDisaster:item})}}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent:'space-between' }}>
                                <Text style={{ fontFamily: 'times new roman', color: '#2A3439' }}>{item}</Text>
                                {isCompleted && (
                                    <AntDesign
                                        style={{ marginLeft: 8 }}
                                        color="#008080"
                                        name="Safety"
                                        size={20}
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
  header:{
    fontFamily:'times new roman',
    fontSize:15,
    marginBottom:10,
    fontWeight:'bold',
    color:'#54626F'
  },  
  disasterBox:{
    backgroundColor:"#F5ECCF",
    marginBottom:10,
    padding:25,
    borderRadius:10,
    borderWidth:1,
    borderColor:'#4d5d53',
    elevation:3,
  }
})


export default DisasterPrepTasks;