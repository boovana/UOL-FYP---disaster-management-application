

import React, { useState, useEffect } from "react";
import { Text, View, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

import {auth, GoogleAuthProvider} from './firebaseConfig';
import {signIn} from './auth'
import { signInWithCredential } from 'firebase/auth';

 
const Login = ({navigation}) => {

    GoogleSignin.configure({
      webClientId:'839917662899-0hfjsues32hkhj6tvnj15mpsqbpe7mai.apps.googleusercontent.com',
      scopes: ['profile', 'email'], 
      forceCodeForRefreshToken: false,
      androidClientID: '839917662899-aa1k2dr6kuk8agid5fa8urn2uhuh3v9t.apps.googleusercontent.com',
    });

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    // function to sign in using google 
    const googleSignIn = async () => {
      try {
        await GoogleSignin.hasPlayServices();

        await GoogleSignin.signOut();


         // sign in with Google
        const userInfo = await GoogleSignin.signIn();
       
        // get idToken from userInfo.data
        const { idToken } = userInfo.data;

        const googleCredential = GoogleAuthProvider.credential(idToken);

        // sign in with google using the credentials and go to 
        await signInWithCredential(auth, googleCredential);

        navigation.navigate('home');
      }
       catch (error) {
        console.error("Google Sign-In Error:", error);
        setError(error.message);
      }
    };
    // successful login using email and password
    const successfulLogin = async () => {
        try {
          await signIn(email, password);
          console.log("login")
          navigation.navigate('home')
        } 
        catch (error) {
          console.error("Login Error:", error);
          if (error.code === "auth/invalid-email" ||error.code === "auth/invalid-credential") 
          {
              setError("Invalid email or password");
          } 
          else {
              setError(error.message);
          }
        }
    }

   return (
    <SafeAreaView style={styles.container}>
      <View>
        <TextInput style={styles.logintextInput} placeholderTextColor="#ACACAC" placeholder="Email" value={email} onChangeText={setEmail} />
      </View>
      <View>
        <TextInput style={styles.logintextInput} placeholderTextColor="#ACACAC" placeholder="Password" secureTextEntry={true}
          value={password} onChangeText={setPassword} />
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('forgotPassword')}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <View>
        <TouchableOpacity onPress={successfulLogin} style={styles.loginButton}>
          <Text style={styles.loginButtontext}>Login</Text>
        </TouchableOpacity>
        <Text style={{color:'black', textAlign:'center', marginBottom:10, fontFamily:'times new roman'}}>Or</Text>
      </View>
     

      <View>
        <TouchableOpacity onPress={googleSignIn} style={styles.googleContainer}>
           <Image
            source={require("./assets/google.png")}
            style={styles.googleImage}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
         
        </TouchableOpacity>
      </View>

      <View>
        <TouchableOpacity onPress={() => navigation.navigate('signup')} style={styles.signUp}>
          <Text style={styles.signUPtext}>New user? Create an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  logintextInput: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    fontFamily:'times new roman',
    color:'#54626F'
  },
  loginButton: {
    backgroundColor: '#9DC183',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtontext: {
    color: '#2A3439',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily:'times new roman'
  },
  forgotPasswordText: {
    color: '#2689e6ff',
    textAlign: 'right',
    marginBottom: 15,
    fontSize: 14,
    fontFamily:'times new roman'
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  signUp: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUPtext: {
    color: '#2689e6ff',
    fontSize: 15,
    fontFamily:'times new roman'
  },
  googleContainer:{
    flexDirection: "row",
    borderWidth: 2,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    marginTop: 10,
    gap: 10,
  },
  googleText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '600',
    fontFamily:'times new roman'
  },
  googleImage: {
    height: 20,
    width: 20,
  },

});


export default Login


