import React, { useState, useEffect } from 'react';
import { FlatList, View, Text,TouchableOpacity, StyleSheet, Button, ScrollView} from 'react-native';
const TaskInfo = require('./data/TaskInfo.json');
// import TaskInfo from './data/TaskInfo.json';

import { useRoute, useNavigation } from '@react-navigation/native';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import DisasterPrepTasks from "./disastersPrep"
import AsyncStorage from '@react-native-async-storage/async-storage';



const PrepTasks =() =>{
    const route = useRoute();
    const { selectedTitle, selectedDisaster } = route.params;
    const navigation = useNavigation()
    // filter the tasks based on the title chosen by user
    const filteredTask = TaskInfo.find(task => task.title === selectedTitle);
    const [crossedSteps, setCrossedSteps] =  useState(Array(filteredTask.steps.length).fill(false));
    const [completedTask, setCompletedTask] = useState({tasks: [],quizzes: []});

    const storageKey = `checkboxState-${selectedTitle}`;

    useEffect(() => {
        const loadCheckedSteps = async () => {
        try {
            const saved = await AsyncStorage.getItem(storageKey);
            if (saved) {
            setCrossedSteps(JSON.parse(saved));
            } else {
            setCrossedSteps(Array(filteredTask.steps.length).fill(false));
            }
        } catch (error) {
            console.error("Error loading checkbox state", error);
        }
        };
        loadCheckedSteps();
    }, []);


    // function to mark a task completed, with a tick sign next to it
    const markTaskCompleted = async (taskTitle) => {
        setCompletedTasks(prev => {
            if (!prev.includes(taskTitle)) {
            const updated = [...prev, taskTitle];
            AsyncStorage.setItem('completedTasks', JSON.stringify(updated))
                .catch(err => console.error('Error saving completed tasks:', err));
            return updated;
            }
            return prev;
        });
    };

    // ensure the crossed steps persist
    useEffect(() => {
        AsyncStorage.setItem(storageKey, JSON.stringify(crossedSteps));
    }, [crossedSteps]);
    
    const toggleCheck = (index) => {
        const updated = [...crossedSteps];
        updated[index] = !updated[index];
        setCrossedSteps(updated);
    };
    // if all true, to show done button
    const allCrossed = crossedSteps.every(Boolean);

    // folllowing the completion navigate to the disaster
    const handleCompletion = async()=>{
        // task id for the filtered tasks
        const taskId = filteredTask.title;

        try {
            const existing = await AsyncStorage.getItem('completedTasks');
            const parsed = existing ? JSON.parse(existing) : [];

            // prevent duplicates
            const updated = Array.from(new Set([...parsed, taskId]));

            await AsyncStorage.setItem('completedTasks', JSON.stringify(updated));

            navigation.navigate('allTasks', {selectedDisaster,});
        } 
        catch (error) {
            console.error('Error saving completed task:', error);
        }
    }

    return(
        <ScrollView>
            <View style ={styles.container}>
            <Text style={styles.taskTitle}>{filteredTask.title}</Text>
            {filteredTask.steps.map((step, index) => (
                <BouncyCheckbox
                    key={index}
                    size={15}
                    fillColor="#00674b"
                    unFillColor="#FFFFFF"
                    text={step}
                    iconStyle={{ borderColor: "#49796B" }}
                    innerIconStyle={{ borderWidth: 1 }}
                    textStyle={{ fontFamily: "times new roman", color:'black' , padding:15}}
                    onPress={(isChecked: boolean)=>
                        toggleCheck(index)}
                        isChecked={crossedSteps[index]}
                />
            ))}
            {allCrossed && 
            (
               <Button title="Done" color='#9DC183' onPress={(handleCompletion)} />
            )}
        </View>
        </ScrollView>
       
    )
}


const styles = StyleSheet.create({
    container:{
        alignItems:'center', 
        padding:15,
        backgroundColor:'white'
    },
    taskTitle:{
        fontSize:20, 
        marginBottom:10 , 
        fontFamily:'times new roman',
        fontWeight:'bold',
        color:'#2A3439',
        borderBottomWidth:1,
        borderColor:'#54626F'
    }
})


export default PrepTasks
