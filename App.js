
import React from 'react';

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View ,Button} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from './navigationRef';
import { createStackNavigator } from "@react-navigation/stack";
import Login from './login';
import Home from './home'
import DisasterPrepTasks from "./disastersPrep"
import WeatherForecast from "./weatherAlerts"
import PrepTasks from "./prepTasks"
import AllTasks from "./allTasks"
import ShowQuiz from "./showQuizzes"
import ResetPassword from './forgotPassword'
import SignUp from './signup'
import VideoPlayerScreen from './playVideo'
import QuizScore from './quizScore'
import PDFViewer from './viewPDF'
import Resources  from './resources';
import Settings  from './settings';

import { enableScreens } from 'react-native-screens';

enableScreens();

const Stack = createStackNavigator();


export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator>
          <Stack.Screen name="login" component={Login} />
          <Stack.Screen name="home" component={Home} />
          <Stack.Screen name="signup" component={SignUp} />
          <Stack.Screen name="forgotPassword" component={ResetPassword} />
          <Stack.Screen name="disasterPrepTasks" component={DisasterPrepTasks} />
          <Stack.Screen name="prepTasks" component={PrepTasks} />
          <Stack.Screen name="allTasks" component={AllTasks} />
          <Stack.Screen name="weatherForecast" component={WeatherForecast} />
          <Stack.Screen name="quiz" component={ShowQuiz} />
          <Stack.Screen name="playVideo" component={VideoPlayerScreen} />
          <Stack.Screen name="quizScore" component={QuizScore} />
          <Stack.Screen name="viewPDF" component={PDFViewer} />
          <Stack.Screen name="resources" component={Resources} />
          <Stack.Screen name="settings" component={Settings} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
