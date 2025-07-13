import React, {useState, useEffect} from 'react';
import { View, Text, TouchableOpacity, StyleSheet , ScrollView} from 'react-native';
import taskInfo from './data/TaskInfo.json'
import quizzes from './data/allQuizzes.json';
import earthquakeQuizzes from './data/earthquakeQuizzes.json'
import floodQuizzes from './data/floodQuizzes.json'
import hurricaneQuizzes from './data/hurricaneQuizzes.json'
import tsunamiQuizzes from './data/tsunamiQuizzes.json'
import tornadoQuizzes from './data/tornadoQuizzes.json'
import pandemicQuizzes from './data/pandemicQuizzes.json'
import wildfireQuizzes from './data/wildfireQuizzes.json'
import CheckBox from '@react-native-community/checkbox';
import DisasterPrepTasks from "./disastersPrep"
import { useRoute ,useNavigation} from '@react-navigation/native';


const ShowQuiz = () =>{
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOptions, setSelectedOptions] = useState({})
    const route = useRoute();
    //check if need to reset due to retry button
    const shouldReset = route.params?.reset;
    const { quizzes=[], selectedDisaster, highestGrade} = route.params || {};
    const navigation = useNavigation()

    const quizData = quizzes

    useEffect(() => {
        if (shouldReset) {
            setCurrentIndex(0); 
            setSelectedOptions([]); 
        }}, [shouldReset]);
    const currentQuestion = quizData[currentIndex];

    // users chosen options for each question
    const chooseOption = (optionIndex) => {
        setSelectedOptions((prev) => {
            const currentSelections = prev[currentIndex] || [];
            // if the chosen option is clicked again, unselect
            if (currentSelections.includes(optionIndex)) {
            return {
                ...prev,[currentIndex]: currentSelections.filter(i => i !== optionIndex),
            };
            } 
            // else mark as selected and keep the previous selections
            else {
                return {...prev,[currentIndex]: [...currentSelections, optionIndex],};
            }
        });
    };
    // function to go to next question and check if its the right qnaser
    const showNextQuestion =() =>{
        if(currentIndex < quizzes.length -1){
            setCurrentIndex(currentIndex + 1);
        }
        else{
            let score = 0;
            quizData.forEach((q, index) => {
                const userAnswerIndices = selectedOptions[index] || [];
                // convert indices to actual option strings
                const userAnswerStrings = userAnswerIndices.map(i => q.options[i]);

                const correct = q.correctAnswer.slice().sort().join(',');
                const selected = userAnswerStrings.slice().sort().join(',');

                if (correct === selected) {
                    score += 1;
                }
            });

            // nav to score screen after quiz is submitted
            navigation.navigate('quizScore', {
                total: quizData.length,
                score: score,
                quizzes:quizzes,
                selectedDisaster:selectedDisaster,
                highestGrade:highestGrade
            });
        }
    }
    // function to go to prev question 
    const showPreviousQuestion =() =>{
        if(currentIndex >= 1){
            setCurrentIndex(currentIndex - 1);
            
        }
    }
    return (
        <View style={styles.container}>
            <View style={styles.questionContainer} >
                <Text style={styles.question}>{currentQuestion.question}</Text>
                <ScrollView style={styles.choicesContainer} >
                    {currentQuestion.options.map((choice, i) => (
                        <View key={i} style={styles.choiceRow}>
                            <CheckBox
                                value={selectedOptions[currentIndex]?.includes(i) || false}
                                onValueChange={() => chooseOption(i)}
                                tintColors={{ true: '#007bff', false: '#aaa' }}
                            />
                            <Text style={styles.choiceText}>{choice}</Text>
                        </View>
                    ))}
                </ScrollView>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        onPress={showPreviousQuestion} 
                        disabled={currentIndex === 0} 
                        style={[
                        styles.backButton,
                        currentIndex === 0 && styles.disabledButton
                        ]}
                    >
                        <Text style={styles.backButtonText}>
                        {currentIndex === 0 ? '' : 'Back'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={showNextQuestion} 
                        style={[
                        styles.nextButton,
                        currentIndex === quizzes.length - 1
                        ]}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentIndex === quizzes.length - 1 ? 'Submit' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}



const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        backgroundColor:'white',
        alignItems: 'center', 
    },
    questionContainer:{
        height: '80%',
        width: '95%',
        justifyContent: 'space-between',
    },
    question:{
        height:'45%',
        width:'95%',
        fontSize:18,
        fontFamily:'times new roman',
        fontWeight:'bold',
        borderRadius:10,
        marginTop:10,
        padding:10,
        backgroundColor:'#F5ECCF',
        textAlign:'center',
        alignSelf:'center',
        textAlignVertical: 'center', 
        elevation:5,
        color:'#54626F'
    },
    choice:{
        paddingVertical:40,
        
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop:10
    },

    backButton: {
        backgroundColor: '#6c757d',
        padding: 15,
        borderRadius: 8,
        width: '20%',
        alignItems: 'center',
        
    },

    nextButton: {
        backgroundColor: '#9DC183',
        padding: 15,
        borderRadius: 8,
        width: '22%',
        alignItems: 'center',
    },

    disabledButton: {
        backgroundColor: '#ccc',
    },

    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily:'times new roman'
    },

    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily:'times new roman'
    },
    choicesContainer: {
        flexGrow: 1,
        marginVertical: 10,
    },
    choiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        paddingHorizontal:10,
        paddingVertical:20,
        
    },
    choiceText: {
        fontSize: 16,
        marginLeft: 8,
        flexShrink: 1,
        fontFamily:'times new roman',
        color:'#54626F'
    },

})
export default ShowQuiz;


