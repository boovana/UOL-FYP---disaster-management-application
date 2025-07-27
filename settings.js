import React, {useState, useEffect} from "react";
import { auth} from './firebaseConfig';
import {forgotPassword, signOut} from './auth'
import {Text, View, TouchableOpacity, StyleSheet, FlatList, TextInput} from 'react-native'
import Footer from './footer'

const Settings =({navigation})=>{
    const [selected, setSelected] = useState();
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');


    const settingsData =[
        {   
            id: 'password',
            title: 'Update password',
        },
        {
            id:'notifications',
            title: 'Notifications',
        },
        {
            id:'signout',
            title:'Sign out'
        }
    ]
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
            : () => setSelected(item.id);
        return (
            <SelectedSetting item={item} backgroundColor={backgroundColor} onPress={onPress}/>
        );
    };

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

    return(
        <View style={styles.mainContainer}>
            <Text style={styles.header}>Settings</Text>
            
            {/** only show the items when nothing is selected */}
            {!selected && (
                <FlatList data={settingsData} renderItem={renderItem}  keyExtractor={item => item.id} extraData={selected}/>

            )}
            {selected =='password' && (
                <View style={styles.updateContainer}>
                    <Text style={styles.updateLabel}>Enter email:</Text>
                    <TextInput style={styles.input} placeholder="johndoe@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
                    
                    <View style={{ flexDirection:'row',justifyContent:'space-between'}}>
                        {/** update the current email address and display update message */}
                        <TouchableOpacity style={styles.button} onPress={handlePasswordChange}>
                            <Text style={styles.buttonText}>Send link to reset password</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelected(null)}>
                            <Text>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                    {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}
                </View>
            )}
            
            <Footer navigation={navigation} />
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer:{
        flex:1,
        backgroundColor:'white'
    },
    header:{
        fontFamily:'times new roman',
        fontSize:25,
        color:'#54626F',
        fontWeight:'bold',
        textAlign:'center',
        margin:20
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
    input:{
        backgroundColor:'skyblue'
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
        fontSize: 16,
        marginBottom: 10,
    },
})

export default Settings