import React, {useState, useEffect, useRef} from "react";
import { auth,db} from './firebaseConfig';
import {forgotPassword, signOut, updateUserEmail} from './auth'
import {Text, View, TouchableOpacity, StyleSheet, FlatList, TextInput, Switch, Platform, Linking, Alert,Modal, Image} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection,getDocs, query,where} from 'firebase/firestore';
import { navigate } from './navigationRef';

// import * as Device from 'expo-device';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';


import Footer from './footer'



const Settings =({navigation})=>{
    const [selected, setSelected] = useState();
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [allowNotification,setAllowNotification] = useState(false)
    const [loadingSwitch, setLoadingSwitch] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isTakingPhoto, setIsTakingPhoto] = useState(false);
    const [photoUri, setPhotoUri] = useState(null);
    const [showChoosePicModal, setShowChoosePicModal] = useState(false)
    const [isProjectsCollapsed, setIsProjectsCollasped] = useState(true)
    // const [notification, setNotification] = useState(null);
    // const [expoPushToken, setExpoPushToken] = useState('');
    // const [globalExpoPushToken, setGlobalExpoPushToken] = useState(null);
    // const globalExpoPushTokenRef = useRef(null);
    // const [permissionStatus, setPermissionStatus] = useState(null);

    const [newEmail, setNewEmail] = useState('')
    const [confirmNewEmail, setConfirmNewEmail] = useState('');


    const userID = auth.currentUser?.uid;



    const settingsData =[
        {
            id:'email',
            title:'Update email address'
        },
        {   
            id: 'password',
            title: 'Update password',
        },
        // {
        //     id:'notifications',
        //     title: 'Notifications',
        //     isSwitch:true
        // },
       
        {
            id:'signout',
            title:'Sign out'
        }
    ]
    useEffect(() => {
        const loadProfilePhoto = async () => {
            try {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
                const base64 = userDoc.data().photoBase64;
                if (base64) setPhotoUri(base64);
            }
            } catch (error) {
            console.error('Failed to load profile photo:', error);
            }
        };
        loadProfilePhoto();
    }, []);

    // choose image from gallery
    const pickProfileImage = async () => {
        // get permission to access media library
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        /// show alert is permission was denied
        if (status !== 'granted') {
            alert('Permission to access gallery is required!');
            return;
        }
        //  image picker, edit 
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1], 
            quality: 0.5,
        });
        // save image 
        if (!result.canceled) {
            const uri = result.assets[0].uri
            setPhotoUri(uri);
            setShowChoosePicModal(false);
            await uploadProfilePicToFirestore(uri); 
        }
    };

    //function to take profile picture in-app 
    const takeProfilePicInApp = async() => {
        console.log('calling camera')
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        // show alert is permission was denied
        if (status !== 'granted') {
            alert('Camera permission is required!');
            return;
        }
        // edit image 
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        // save image
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setPhotoUri(uri);
            setShowChoosePicModal(false);
            await uploadProfilePicToFirestore(uri); 
        }
    };

    const convertToBase64 = async (uri) => {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            return `data:image/jpeg;base64,${base64}`;
        } catch (error) {
            console.error('Error converting image to base64:', error);
            return null;
        }
    };

    const uploadProfilePicToFirestore = async (uri) => {
        const base64String = await convertToBase64(uri);
        if (!base64String) return;

        try {
            await setDoc(doc(db, 'users', auth.currentUser.uid), { photoBase64: base64String },{ merge: true });
            setPhotoUri(uri); 
        } catch (error) {
            console.error('Error saving profile picture in Firestore:', error);
        }
    };


    // toggle camera
    const toggleCameraFacing =() => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }
    
    //remove profile pic
    const removePic =async()=>{
        try {
            // clear local state
            setPhotoUri(null);

            // remove from Firestore
            await setDoc(doc(db, "users", auth.currentUser.uid),
            { photoBase64: null }, { merge: true });

        } 
        catch (error) {
            console.error("Error removing profile picture:", error);
        }
    }

    // useEffect(() => {
    //   const setupNotifications = async () => {
    //     try {
    //       const token = await registerForPushNotificationsAsync();
    //       if (token) {
    //         setExpoPushToken(token)
    //         setGlobalExpoPushToken(token);
    //         globalExpoPushTokenRef.current = token; 
    //       }
    //     } 
    //     catch (err) {
    //       console.error("Notification setup error:", err);
    //     }
    //   };

    //   setupNotifications();
    // }, []);

    // useEffect(() => {
    //   const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    //     setNotification(notification);
    //   });
    //   // go to login page
    //   const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    //     navigate('weatherAlerts'); 
    //   });

    //   return () => {
    //     notificationListener.remove();
    //     responseListener.remove();
    //   };
    // }, []);

    // // check the device settings for the notifications
    // useEffect (() =>{
    //     const checkNotificationPermissionInDevice = async() =>{
    //         try {
    //             const deviceStatus = await Notifications.getPermissionsAsync();
    //             setPermissionStatus(deviceStatus)
    //             if (deviceStatus.granted) {
    //                 // permission granted sofetch token state from firestore
    //                 const userDoc = await getDoc(doc(db, 'users', userID));
    //                 const token = userDoc.data()?.expoPushToken;
    //                 const isAllowed = !!token;
    //                 setAllowNotification(isAllowed);
    //             } 
    //             else{
    //                 await setDoc(doc(db, 'users', userID), { expoPushToken: null }, { merge: true });
    //                 setAllowNotification(false);
    //             }
    //         }
    //         catch (error) {
    //             setAllowNotification(false);
    //             console.error("Error checking notification permissions:", error);
    //         }
    //     }
    //     checkNotificationPermissionInDevice();
    // }, [])
   

    // const registerForPushNotificationsAsync = async () => {
    //   try {
    //     let token;

    //     if (Platform.OS === 'android') {
    //       await Notifications.setNotificationChannelAsync('default', {
    //         name: 'default',
    //         importance: Notifications.AndroidImportance.MAX,
    //         vibrationPattern: [0, 500, 500, 500],
    //         lightColor: '#FF231F7C',
    //       });
    //     }

    //     if (Device.isDevice) {
    //       const { status: existingStatus } = await Notifications.getPermissionsAsync();

    //       let finalStatus = existingStatus;
    //       if(existingStatus =='granted'){
    //         setAllowNotification(true)
    //         console.log('permission granted to send notifs!')
    //       }

    //       //ask for permission to send notification
    //       if (existingStatus !== 'granted') {
    //         console.log(' no permisssion to send notifs')
    //         setAllowNotification(false)
    //         const { status } = await Notifications.requestPermissionsAsync();
    //         finalStatus = status;
    //       }

    //       if (finalStatus !== 'granted') {
    //         setAllowNotification(false)
    //         return null;
    //       }

    //       token = (await Notifications.getExpoPushTokenAsync()).data;
          
    //       if (userID && token) {
    //         await setDoc(doc(db, 'users', userID), { expoPushToken: token }, { merge: true });
    //       }
    //       return token;
    //     } 
    //     // ensure its not an emulator
    //     else {
    //     //   alert('Must use physical device for Push Notifications');
    //       return null;
    //     }
    //   } 
    //   catch (err) {
    //     console.error("Error getting push token:", err);
    //     return null;
    //   }
    // };


    // // toggle the notification switch
    // const toggleNotificationSwitch = async (value) => {
    //     setLoadingSwitch(true);
    //     try {
    //         if (value) {
    //             const token = await registerForPushNotificationsAsync();
    //             if (token) {
    //                 setAllowNotification(true);
    //             } 
    //             else {
    //                 setAllowNotification(false);
    //             }
    //         } 
    //         else {
    //             if (userID) {
    //                 await setDoc(doc(db, 'users', userID), { expoPushToken: null }, { merge: true });
    //             }
    //             setAllowNotification(false);
    //             Alert.alert(
    //                 "Disable Notification?",
    //                 "You will need to turn off notifications from your device settings to stop receiving alert notifications!",
    //                 [{ text: "OK" }]
    //             );
    //         }
    //     } catch (err) {
    //         console.error('Error toggling notifications:', err);
    //     } finally {
    //         setLoadingSwitch(false);

    //         const deviceStatus = await Notifications.getPermissionsAsync();
    //         setPermissionStatus(deviceStatus);
    //     }
    // };


    // show the setting title and when selected should be different color
    const SelectedSetting = ({item, onPress, backgroundColor, textColor}) => (
        <TouchableOpacity onPress={onPress} style={[styles.item, {backgroundColor}]}>
            <Text style={[styles.title]}>{item.title}</Text>
        </TouchableOpacity>
    );
    
    const renderItem = ({item}) => {
        const backgroundColor = item.id === selected ? '#B2BEB5' : '#faf5ef';
        const onPress =
            item.id === 'signout'
            ? async () => {
                try {
                    await signOut(auth);
                    navigation.replace('login');
                } catch (error) {
                    console.error('Error signing out:', error);
                }
                }
            : item.isSwitch ? undefined : () => setSelected(item.id);

        if (item.isSwitch) {
            return (
            <View style={[styles.item, { backgroundColor, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <View style={{flexDirection:'row', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Switch
                      trackColor={{ false: '#767577', true: '#81b0ff' }}
                      thumbColor={allowNotification ? '#f5dd4b' : '#f4f3f4'}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={toggleNotificationSwitch}
                      value={allowNotification}
                      disabled={loadingSwitch}
                    />
                </View>
            </View>
            );
        }       
        return (           
            <SelectedSetting item={item} backgroundColor={backgroundColor} onPress={onPress}/>
        );
    };


    // handle password change 
    const handlePasswordChange = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        const result = await forgotPassword(email);
        console.log(result)
        if (!result.success) {
            setErrorMsg(result.message);
        } 
        else {
            setSuccessMsg("Password reset link sent! Check your email/spam");
        }
    };

    const handleUpdateEmail = async() =>{
        console.log('changin email address')
        setErrorMsg('');
        setSuccessMsg('');
        if(newEmail != confirmNewEmail){
            setErrorMsg('Email addresses do not match, please try again!')
            return 
        }
        const result = await updateUserEmail(auth.currentUser, newEmail);
        if (result.success) {
            setSuccessMsg('Email updated successfully! Please check your inbox to verify.');
            console.log('email address changed!')
            Alert.alert('Success', 'Email updated successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('settings'),
                }
            ]);
        } 
        else {
            setErrorMsg(result.errorMsg);
        } 
    }

    return(
        <View style={styles.mainContainer}>
            <Text style={styles.header}>Settings</Text>
            {/** only show the items when nothing is selected */}
            <TouchableOpacity
                style={styles.profilePic}
                onPress={() => setShowChoosePicModal(true)}
                >
                {photoUri ? (
                    <Image source={{ uri: photoUri }} style={{width:'100%', height:'100%', borderRadius:150, resizeMode:'cover'}}/>
                ) : (
                    <Text style={{ fontFamily: 'times new roman', fontSize: 40, color:'black'}}>{auth.currentUser.displayName?.charAt(0) || ''}</Text>
                )}
            </TouchableOpacity>



            <Text style={[styles.profileDetails,{marginTop:20, marginBottom:10}]}>{auth.currentUser.displayName}</Text>
            <Text style={[styles.profileDetails,{marginBottom:20}]}>{auth.currentUser.email}</Text>

            {!selected && (
                <FlatList data={settingsData} renderItem={renderItem} keyExtractor={(item) => item.id} extraData={[selected]}/>
            )}
            {selected =='password' && (
                <View style={styles.updateContainer}>
                    <Text style={styles.updateLabel}> Password Reset</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabelText}>ENTER EMAIL</Text>
                        <TextInput style={styles.input} placeholder="johndoe@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
                    </View>
                         
                    <View style={{ flexDirection:'row',justifyContent:'space-between'}}>
                        {/** update the current email address and display update message */}
                        <TouchableOpacity style={styles.updateButton} onPress={handlePasswordChange}>
                            <Text style={styles.buttonText}>Send link to reset password</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.updateButton} onPress={() => setSelected(null)}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                    {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}
                </View>
            )}
            {selected==  'email' &&(
                <View style={styles.updateContainer}>
                    <Text style={styles.updateLabel}>Update email address</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabelText}>NEW EMAIL</Text>
                        <TextInput style={styles.input} placeholder="johndoe@gmail.com" placeholderTextColor="#B2BEB5" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none"/>
                    </View>
                    
                    {/** CONFIRM EMAIL */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabelText}>CONFIRM NEW EMAIL</Text>
                        <TextInput style={styles.input} placeholder="johndoe@gmail.com" placeholderTextColor="#B2BEB5" value={confirmNewEmail} onChangeText={setConfirmNewEmail} keyboardType="email-address" autoCapitalize="none"/>
                    </View>
                
                    <View style={{ flexDirection:'row',justifyContent:'space-between'}}>
                        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateEmail}>
                            <Text style={styles.buttonText}>Update</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.updateButton} onPress={() => setSelected(null)}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                    {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}
                </View>
            )}

            <Modal animationType="slide" transparent={true} visible={showChoosePicModal}
            onRequestClose={() => {
                setShowChoosePicModal(!showChoosePicModal);
            }}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity style={styles.optionRow} onPress={takeProfilePicInApp}>
                            <Text style={{fontFamily:'times new roman', fontSize:15, textAlign:'center', color:'black'}}>Take photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity  style={styles.optionRow} onPress={pickProfileImage}>
                            <Text style={{fontFamily:'times new roman', fontSize:15, textAlign:'center', color:'black'}}>Choose from gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity  style={styles.optionRow} onPress={removePic}>
                            <Text style={{fontFamily:'times new roman', fontSize:15, textAlign:'center', color:'black'}}>Remove picture</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose]}
                            onPress={() => setShowChoosePicModal(!showChoosePicModal)}>
                            <Text style={styles.textStyle}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            
            <Footer navigation={navigation} />
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer:{
        flex:1,
        backgroundColor:'white',
    },
    header:{
        fontFamily:'times new roman',
        fontSize:25,
        color:'#54626F',
        fontWeight:'bold',
        textAlign:'center',
        margin:50
    },
    item:{
        padding:20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderWidth:1,
        borderRadius:14,
        borderColor:'#B2BEB5',
        elevation:5
    },
    title:{
        fontFamily:'times new roman',
        color:'black',
        fontSize:15
    },
    updateContainer:{
        padding:20
    },
    inputContainer:{
        backgroundColor:'#FAF5EF',
        marginBottom:20,
        padding:20,
        borderRadius:9,
        borderWidth:1,
        borderColor: '#54626F',
    },
    input:{
        backgroundColor: '#F5F5F5',
        fontFamily:'times new roman',
        color:'#54626F',
        borderRadius: 9,
        width:'100%',
        marginTop:10,
        height:50,
        borderWidth:1,
        borderColor: '#d5d3cdff',
    },
    inputLabelText:{
        fontFamily:'times new roman',
        color:"black",
        fontSize:13
    },

    errorText:{
        color:'red',
        fontFamily:'times new roman',
        fontStyle:'italic',
        fontSize:13,
        padding:15,
        textAlign:'center'
    },
    successText:{
        color:'green',
        fontFamily:'times new roman',
        fontStyle:'italic',
        fontSize:13,
        padding:15,
        textAlign:'center'
    },
    updateLabel: {
        fontFamily: "times new roman",
        fontSize: 17,
        marginBottom: 20,
        color:'#2A3439',
        fontStyle:'italic'
    },
    updateButton:{
        backgroundColor:'#9DC183',
        width:'40%',
        height:43,
        borderRadius:10,
        justifyContent:'center',
        alignSelf:'flex-end',
        marginTop:20
    },
    buttonText:{
        fontFamily:'times new roman', 
        fontSize:14, 
        textAlign:'center', 
        color:'black', 
        fontWeight:'bold'
    },
     profilePic:{
        width:'55%',
        height:'25%',
        backgroundColor:'#DBE2E9',
        borderRadius:150,
        alignSelf:'center',
        alignItems:'center',
        justifyContent:'center',
        marginTop:30,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(242, 242, 242, 0.42)',
    },
    modalView: {
        width:'75%',
        backgroundColor: '#e1e5edff',
        borderWidth:1,
        borderColor:'gray',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    optionRow:{
        // backgroundColor:"#d7dfeeff",
        width:'100%',
        height:40,
        justifyContent:'center',
        borderBottomWidth:0.5,
        borderRadius:5,
        marginBottom:10
    },
    profileDetails:{
        alignSelf:'center',
        fontFamily:'times new roman',
        // padding:15,
        color:'black',
        // marginTop:20
    },
    textStyle:{
        fontFamily:'times new roman',
        marginTop:10,
        fontSize:16,
        fontWeight:'bold',
        color:'black'
    },
})

export default Settings