import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,Platform } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';
import { MultiSelect } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Notifications from 'expo-notifications';
import { navigate } from './navigationRef';
import * as Device from 'expo-device';
import Footer from './footer'

// handle the properties of the notifications being sent
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


const WeatherForecast = ({navigation}) => {
  // user's current location weather details
  const [currentLocation, setCurrentLocation] = useState(null); 
  const [currentWeather, setCurrentWeather] = useState(null);
  const [currentForecast, setCurrentForecast] = useState([]);
  const [currentAlerts, setCurrentAlerts] = useState([]);

  const [additionalWeatherData, setAdditionalWeatherData] = useState({});

  const [locationName, setLocationName] = useState('');
  const [weather, setWeather] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAlertModal, setshowAlertModal] = useState(false);

  const [selectedAlert, setSelectedAlert] = useState(null);

  const [removedAlertData, setRemovedAlertData] = useState([]);
  const [removedAlertIndex, setRemovedAlertIndex] = useState({}); 
  const [showUndoBanner, setShowUndoBanner] = useState(false);

  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [removeLocation, setRemoveLocation] = useState(null);

  const [zipcodeInput, setZipcodeInput] = useState('');

  const [filteredLocations, setFilteredLocations] = useState([]);

  const [autoComplete, setAutoComplete] = useState([])
  const [stopSuggestions, setStopSuggestions] = useState(false)
  const [searchLoc, setSearchLoc] = useState('')

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null)

  // push notifications
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) setExpoPushToken(token);
      } catch (err) {
        console.error("Notification setup error:", err);
      }
    };
    
    setupNotifications()

    try {
      // receive notification
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });
      // navigate to the login page once user clicks on the notification
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        navigate('login');
      });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    } 
    catch (error) {
      console.error('Notification listener error:', error);
    }
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      let token;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        //ask for permission to send notification
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Permission not granted for push notifications');
          return null;
        }

        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Expo Push Token:", token);
        return token;
      } 
      // ensure its not an emulator
      else {
        alert('Must use physical device for Push Notifications');
        return null;
      }
    } 
    catch (err) {
      console.error("Error getting push token:", err);
      return null;
    }
  };



  // api key from weatherapi.com
  const weatherAPI = 'a733a9584b20404fbc1105651252505'; 

  const STORAGE_KEY = 'saved_weather_locations';

  // save locations to storage
  const saveLocationsToStorage = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save locations:", error);
    }
  };

  //get all alerts 
  const allAlerts = [
    ...(currentAlerts || []),
    ...Object.values(additionalWeatherData).flatMap(loc => loc.alerts || [])
  ];

  //save alerts to storage 
  const saveAlerts = async(allAlerts)=>{
     try {
      await AsyncStorage.setItem('alerts', JSON.stringify(allAlerts));
      console.log('Saved alerts to storage');
    } 
    catch (error) {
      console.error("Failed to save alerts:", error);
    }
  }

  // Load locations from storage
  const loadLocationsFromStorage = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAdditionalWeatherData(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load saved locations:", error);
    }
  };

  // convert the added locations into an array
  const dropdownData = Object.keys(additionalWeatherData).map((location) => ({
    label: location,
    value: location,
  }));

  // show only data thats chosen 
  const visibleLocations = filteredLocations.length > 0
  ? Object.fromEntries(
      Object.entries(additionalWeatherData).filter(([key]) =>
        filteredLocations.includes(key)
      )
    )
  : additionalWeatherData;


  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        // get location and set longitude and latidue based on it 
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords; 
        // requires alot of power
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        const city = geocode[0]?.city|| geocode[0]?.subregion || geocode[0]?.region
       
        // get response from weatherapi.com
        const response = await axios.get(
          `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPI}&q=${latitude},${longitude}&alerts=yes&days=3`
        );
        

        //testing with a city that currently has been issused alerts 
        // const crossCheckCity = "Las Vegas NV"
        // const response = await axios.get(
        //   `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPI}&q=${crossCheckCity}&alerts=yes&days=3`
        // );
       
        setCurrentLocation(city);
        setCurrentWeather(response.data.current);
        setCurrentForecast(response.data.forecast.forecastday);
        setCurrentAlerts(response.data.alerts?.alert || []);
        setLoading(false);

      } 
      // show error
      catch (error) {
        console.error("Weather API error:", error.response?.data || error.message);
        setErrorMsg('Failed to fetch weather data');
        setLoading(false);
      }
    };

    fetchWeather();
    loadLocationsFromStorage();

  }, []);

  // check if there are new alerts and save them
  useEffect(() => {
    if (!loading && allAlerts.length > 0) {
      checkAndNotifyNewAlerts(allAlerts);
      saveAlerts(allAlerts);
    }
  }, [allAlerts, loading]);

  // check for new alerts and push notifs to user
  const checkAndNotifyNewAlerts = async (newAlerts) => {
    try {
      // get the proviously stored alerts
      const stored = await AsyncStorage.getItem('alerts');
      const previousAlerts = stored ? JSON.parse(stored) : [];

      const previousKeys = new Set(
        previousAlerts.map(a => `${a.headline}-${a.effective}`)
      );

      // filter the new alerts
      const newOnes = newAlerts.filter(
        a => !previousKeys.has(`${a.headline}-${a.effective}`)
      );

      // push notifs for each new alert
      newOnes.forEach(alert => {
        Notifications.scheduleNotificationAsync({
          content: {
            title: "⚠️ New Alert",
            body: `${alert.event} in ${alert.areas || 'your area'}`,
            data: { alert },
          },
          trigger: null,
        });
      });

    } catch (err) {
      console.error('Error checking for new alerts:', err);
    }
  };


  // add multiple locations
  const addLocation = async () => {
    if (!zipcodeInput.trim()) return;
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPI}&q=${zipcodeInput}&alerts=yes&days=3&lang=en`
      );

      const locationData = response.data.location;
      const cityDisplayName = `${locationData.name}, ${locationData.region || locationData.country}`;

      setAdditionalWeatherData(prev => {
        const updated = {
          ...prev,
          [cityDisplayName]: {
            current: response.data.current,
            forecast: response.data.forecast.forecastday,
            alerts: response.data.alerts?.alert || [],
          }
        };
        saveLocationsToStorage(updated);
        return updated;
      });

      setZipcodeInput('');
      setShowModal(false);
    } catch (error) {
      alert("Couldn't find that location. Please try a valid city name (e.g. 'Singapore', 'New York').");
      setShowModal(false);
    }
  };
  // show suggestions to autocomplete the users search location
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
        if (stopSuggestions) {
            setStopSuggestions(false); 
            return;
        }
        if (searchLoc.trim().length > 1) {
            fetchSuggestions(searchLoc);
        } else {
            setAutoComplete([]);
        }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchLoc]);

  //fetch suggestions based on users input in the search box
  const fetchSuggestions = async (input) => {
      const GEOAPIFY_API_KEY = '69b184b42bd641398d543f2022d56bb6'; 
      try {
          const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&limit=5&apiKey=${GEOAPIFY_API_KEY}`);
          const data = await response.json();
          if (data.features) {
              setAutoComplete(data.features);
          }
      } catch (err) {
          console.error("Autocomplete error:", err);
      }
  };

  //show loader 
  if (loading) {
    return (
      <View style={styles.loadingIcon}>
        <ActivityIndicator  size="large" color="#0000ff" />
        <Text>Hang on for just a bit!</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }
  // set the severity color of the alert box
  const getAlertColor = (severity) => 
  {
    switch (severity?.toLowerCase()) {
      case 'moderate':
        return '#FCEF91'; 
      case 'severe':
        return '#FB9E3A'; 
      case 'extreme':
        return '#D84040'; 
      default:
        return '#EDEADE'; 
    }
  };

  //function to remove location
  const removeLocationFromWatch = async(locationName)=>
    {
      setAdditionalWeatherData((prevData) => {
      const updated = { ...prevData };
      delete updated[locationName];
      saveLocationsToStorage(updated);
      return updated;
    });

    // clear removed alerts data and index for this particular location
    setRemovedAlertData((prev) => prev.filter((item) => item.location !== locationName));
    setRemovedAlertIndex((prev) => {
      const updated = { ...prev };
      delete updated[locationName];
      return updated;
    });

    try {
      const alertData = await AsyncStorage.getItem('alerts');
      
      if (alertData) {
        const parsedAlerts = JSON.parse(alertData);

        // split the location name as it currrently in the format of city - country
        const locationParts = locationName.toLowerCase().split(',').map(s => s.trim());
        
         // filter out alerts for the removed location
        const updatedAlerts = parsedAlerts.filter(alert => {
          const area = alert.areas?.toLowerCase() || '';
          const headline = alert.headline?.toLowerCase() || '';

          return !locationParts.some(part =>
            area.includes(part) || headline.includes(part)
          );
        });

        await AsyncStorage.setItem('alerts', JSON.stringify(updatedAlerts));
      }
    } catch (error) {
      console.error('Failed to update alerts after location removal:', error);
    }
  }

  // function to remove an alert if user wants 
  const removeAlert = (locationName, alert) => {
    const alertKey = `${alert.headline}-${alert.effective}`;
    const uniqueId = `${locationName}_${alertKey}_${Date.now()}`;

    setRemovedAlertIndex((prev) => {
      const updated = { ...prev };
      updated[locationName] = new Set([...(updated[locationName] || []), alertKey]);
      return updated;
    });

    const alertData = {
      id: uniqueId,
      location: locationName,
      alertKey,
      alert,
    };

    setRemovedAlertData((prev) => [...prev, alertData]);
    setShowUndoBanner(true);

    setTimeout(() => {
      setRemovedAlertData((prev) => {
        const updated = prev.filter((item) => item.id !== uniqueId);
        if (updated.length === 0) setShowUndoBanner(false);
        return updated;
      });
    }, 2000);
  };

  // function to undo removal of alerts
  const undoAlertRemoval = () => {
    if (removedAlertData.length === 0) return;

    const last = removedAlertData[removedAlertData.length - 1];

    setRemovedAlertIndex((prev) => {
      const updated = { ...prev };
      if (updated[last.location]) {
        updated[last.location].delete(last.alertKey);
        if (updated[last.location].size === 0) {
          delete updated[last.location];
        }
      }
      return updated;
    });

    setRemovedAlertData((prev) => {
      const updated = prev.slice(0, -1);
      if (updated.length === 0) setShowUndoBanner(false);
      return updated;
    });
  };
  return (
  <View style={{flex:1}}>
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.locationsBar}>
        {/** add location button */}
        <TouchableOpacity onPress={() =>setShowModal(true)} style ={styles.addLocationBtn}>
          <Text style={{color:'#54626F', fontFamily:'times new roman'}}>Add location</Text>
        </TouchableOpacity>
        {/** filter location dropdown */}
        <View style={{flex:1, maxWidth:'65%',}}>
          <MultiSelect
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          search
          data={dropdownData}
          labelField="label"
          valueField="value"
          placeholder="Filter location"
          searchPlaceholder="Search..."
          value={filteredLocations}
          onChange={item => setFilteredLocations(item)}
          renderLeftIcon={() => (
            <AntDesign
              style={styles.icon}
              color="black"
              name="Safety"
              size={15}
            />
          )}
          renderSelectedItem={() => <View />}
        />
        </View>
      </View>
      {filteredLocations.length > 0 && (
        <View style={styles.selectedContainer}>
          {filteredLocations.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.selectedLocation}
              onPress={() => {
                const updated = filteredLocations.filter(loc => loc !== item);
                setFilteredLocations(updated);
              }}
            >
              <Text style={styles.selectedLocationText}>{item} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
        
      {/** weather details in the user's current location */}
      <Text style={[styles.header,{fontStyle:'italic'}]}>Current Weather in {currentLocation}</Text>
      <Text style={styles.subtext} >Temperature: {currentWeather.temp_c}°C</Text>
      <Text style={styles.subtext}>Condition: {currentWeather.condition.text}</Text>
      <Text style={[styles.header, {fontSize:18, padding:5}]}>3-Day Forecast</Text>
      {currentForecast.map((day, index) => 
      (
        <View key={index} style={styles.forecastBox}>
            <Text style={styles.subtext}>{day.date}</Text>
            <Text style={styles.subtext}>Condition: {day.day.condition.text}</Text>
            <Text style={styles.subtext}>Max: {day.day.maxtemp_c}°C | Min: {day.day.mintemp_c}°C</Text>
        </View>
      ))}

      {/** show the serverity, warning type and headline and when clicked it should show the details of the alert */}
      {currentAlerts.map((alert) => {
        // get the severity of the alert to render the box color accordingly
        const severityColor = getAlertColor(alert.severity);
        return (
         <TouchableOpacity key={alert.headline} onPress={() => { setshowAlertModal(true); setSelectedAlert(alert); }}>
          <View style={[styles.alertBox, { backgroundColor: severityColor }]}>
            <Text style={styles.alertTitle}>
              <Text style={{ fontWeight: 'bold' }}>Headline: </Text>
              {alert.headline}
            </Text>
            <Text style={styles.alertTitle}>
              <Text style={{ fontWeight: 'bold' }}>Warning type: </Text>
              {alert.event}
            </Text>
            <Text style={styles.alertTitle}>
              <Text style={{ fontWeight: 'bold' }}>Severity: </Text>
              {alert.severity}
            </Text>
            <Text style={styles.alertTitle}>
              <Text style={{ fontWeight: 'bold' }}>Warning effective from: </Text>
              {alert.effective}
            </Text>
            <Text style={styles.alertTitle}>
              <Text style={{ fontWeight: 'bold' }}>Warning expires on: </Text>
              {alert.expires || 'Unknown'}
            </Text>
          </View>
        </TouchableOpacity>

        );
      })}


      {/* show Added Locations */}
      {additionalWeatherData && Object.entries(visibleLocations).map(([locationName, data]) => {
        // const removedIndexes = (removeAlerts && removeAlerts[locationName]) || [];
        const removedKeys = removedAlertIndex[locationName] || new Set();

        return(
          <View key={locationName}>
            <View style={styles.locationHeader}>
              <Text style={[styles.header,{fontStyle:'italic'}]}>Weather for {locationName}</Text>
            </View>
            <Text style={styles.subtext}>Temperature: {data.current.temp_c}°C</Text>
            <Text style={styles.subtext}>Condition: {data.current.condition.text}</Text>

            <Text style={[styles.header, {fontSize:18, padding:5}]}>3-Day Forecast</Text>
            {data.forecast.map((day) => (
              <View key={day.date} style={styles.forecastBox}>
                <Text style={styles.subtext}>{day.date}</Text>
                <Text style={styles.subtext}>Condition: {day.day.condition.text}</Text>
                <Text style={styles.subtext}>Max: {day.day.maxtemp_c}°C | Min: {day.day.mintemp_c}°C</Text>
              </View>
            ))}
            {/** alerts header and */}
            {data.alerts.filter((alert) => !removedKeys.has(`${alert.headline}-${alert.effective}`)).length > 0 ? (
              <View style={styles.alertHeaderBox}>
                <AntDesign style={[styles.icon, {marginRight:50}]} color="red" name="warning" size={20} />
                <Text style={{fontFamily:'times new roman', fontSize:15, color:'black', fontWeight:'bold', textAlign:'center' }}>
                  Alerts in {locationName}
                </Text>
              </View>
            ) : (
              <Text style={{fontFamily:'times new roman', fontSize:14, fontStyle:'italic', color:'gray', marginBottom: 5, textAlign:'center'}}>
                No alerts in {locationName}
              </Text>
            )}
       
            {data.alerts.filter(alert => !removedKeys.has(`${alert.headline}-${alert.effective}`)).map((alert, index) => {
              const severityColor = getAlertColor(alert.severity);
              const alertKey = `${alert.headline}-${alert.effective}-${index}`;
              return (
                <TouchableOpacity   key={alertKey} onPress={() => {setshowAlertModal(true); setSelectedAlert(alert);}}>
                  <View style={[styles.alertBox, { backgroundColor: severityColor}]}>
                   {/**remove alert */}
                    <TouchableOpacity onPress={() => removeAlert(locationName, alert)}  style={styles.closeButton}>
                      <Text style={{ color: 'white', fontWeight: 'bold', }}>X</Text>
                    </TouchableOpacity>
                    {/** alert main details */}
                    <Text style={styles.alertTitle}>
                      <Text style={{ fontWeight: 'bold' }}>Headline: </Text>
                      {alert.headline}
                    </Text>
                    <Text style={styles.alertTitle}>
                      <Text style={{ fontWeight: 'bold' }}>Warning type: </Text>
                      {alert.event}
                    </Text>
                    <Text style={styles.alertTitle}>
                      <Text style={{ fontWeight: 'bold' }}>Severity: </Text>
                      {alert.severity}
                    </Text>
                    <Text style={styles.alertTitle}>
                      <Text style={{ fontWeight: 'bold' }}>Warning effective from: </Text>
                      {alert.effective}
                    </Text>
                    <Text style={styles.alertTitle}>
                      <Text style={{ fontWeight: 'bold' }}>Warning expires on: </Text>
                      {alert.expires || 'Unknown'}
                    </Text>
                    
                  </View>
                </TouchableOpacity>
              );
            })}
            {/**remove location */}
            <TouchableOpacity onPress={() => {setRemoveLocation(locationName); setShowRemovalModal(true)}} style={styles.removeLocationBtn}>
              <Text style={{ color: 'black', fontWeight: 'bold' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )
      })} 
      {/** TESTING NOTIFICATION USING A MOCK */}
      {/* <TouchableOpacity
        onPress={() => {
          Notifications.scheduleNotificationAsync({
            content: {
              title: "Test Alert",
              body: "This is a simulated disaster warning.",
              data: { test: true },
            },
            trigger: null, 
          });
        }}
        style={{
          padding: 10,
          backgroundColor: '#9DC183',
          marginTop: 10,
          alignSelf: 'center',
          borderRadius: 8,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Trigger Test Notification</Text>
      </TouchableOpacity> */}

      
      {/** modal to show description of the alerts when user clicks on them*/}
      <Modal animationType="fade" transparent={true} visible={showAlertModal} onRequestClose={() => setshowAlertModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Alert Details</Text>
            <Text>{selectedAlert?.desc || 'No description available.'}</Text>
            <TouchableOpacity onPress={() =>setshowAlertModal(false)} style={styles.modalButton}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/** modal to confirm removal of location*/}
      <Modal animationType="fade" transparent={true} visible={showRemovalModal} onRequestClose={() => setShowRemovalModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, textAlign:'center' }}>Are you sure you want to remove this location from your weather watch??</Text>
            <View style={styles.yesNoButtons}>
              <TouchableOpacity onPress={()=> {removeLocationFromWatch(removeLocation); setShowRemovalModal(false)}} style={styles.modalButton}>
              <Text style={{ color: 'black' }}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {setShowRemovalModal(false)}} style={styles.modalButton}>
                <Text style={{ color: 'black' }}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/** modal to add multiple locations */}
      <Modal animationType="slide" transparent={true} visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', color:'#54626F', fontFamily:'times new roman'}}>Enter ZIP/Postal Code/City name</Text>
            <TextInput
              style={styles.input}
              value={zipcodeInput}
              onChangeText={(text) => {
                setZipcodeInput(text);
                setSearchLoc(text); // drive autocomplete
              }}
              placeholder="e.g. 10001"
              placeholderTextColor='#54626F'
            />
            {autoComplete.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {autoComplete.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setZipcodeInput(item.properties.formatted);
                      setSearchLoc(item.properties.formatted);
                      setAutoComplete([]);
                      setStopSuggestions(true);
                    }}
                    style={styles.suggestionItem}
                  >
                    <Text style={{color:'#54626F', fontFamily:'times new roman', fontSize:12 }}>{item.properties.formatted}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity onPress={addLocation} style={styles.modalButton}>
              <Text style={{ color: '#fff' }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
    </ScrollView>
   
      {/** undo banner to undo removed alerts */}
      {showUndoBanner && (
        <View style={styles.undoBanner}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>You have removed this alert</Text>
          <TouchableOpacity onPress={undoAlertRemoval} >
            <Text style={{ color: 'white', marginLeft: 10,fontWeight: 'bold'  }}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    <Footer navigation={navigation} />
     
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom:50,
    paddingBottom: 150,
    backgroundColor:'white'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    fontFamily:'times new roman',
    color:'#3B444B'
  },
  locationHeader:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: '#ffe0e0',
    padding: 5,
    marginVertical: 5,
    borderRadius: 8,
  },
  alertTitle: {
    marginTop:10,
    padding:10,
    fontFamily:'times new roman', 
    color:'black'
  },
  forecastBox: {
    backgroundColor: '#F5ECCF',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#F5ECCF',
    padding: 20,
    borderRadius:10,
    width: '80%',
    alignItems: 'center',
  },
  input: {
    borderBottomWidth: 1,
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    padding: 5,
    color:'#54626F',
    fontFamily:'times new roman'
  },
  modalButton: {
    backgroundColor: '#9DC183',
    padding: 10,
    borderRadius: 8,
    marginTop: 10
  },
  closeButton:{
    position: 'absolute',
    top: 5,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(237, 230, 230, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  yesNoButtons:{
    flexDirection:'row',
    justifyContent:'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10
  },
  removeLocationBtn:{
    backgroundColor:'#9DC183',
    width:'30%',
    padding:5,
    alignItems:'center',
    borderRadius:8,
    alignSelf:'flex-end'
  },
  undoBanner: {
    position: 'absolute',
    alignSelf:'center',
    bottom: 70,
    backgroundColor: '#708090',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    width:'90%'
  },
  locationsBar:{
    flexDirection: 'row',
    flexWrap: 'wrap',          
    alignItems: 'center',  
    marginBottom: 10,
    justifyContent: 'space-between',  
  },
  dropdown: {
    height: 30,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    backgroundColor:'#9DC183',
  },
  addLocationBtn:{
    backgroundColor:'#9DC183',
    width:'30%',
    padding:5,
    alignItems:'center',
    borderRadius:14,

  },
  placeholderStyle: {
    fontSize: 14,
    textAlign:'center',
    color:'#54626F', 
    fontFamily:'times new roman'
  },
  selectedTextStyle: {
    fontSize: 14,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    
  },
  icon: {
    marginRight: 5,
  },
  item: {
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },

  selectedLocation: {
    backgroundColor: '#ffffff',
    borderColor: '#9DC183',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },

  selectedLocationText: {
    fontSize: 14,
    color: '#333',
  },
  loadingIcon:{
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  suggestionItem:{
    backgroundColor: '#faf5ef', 
    borderRadius: 5, 
    borderBottomWidth:1,
    borderColor:'white',
    marginTop:3,
    elevation: 3,
    padding:10,
    
  },
  subtext:{
    fontFamily:'times new roman',
    padding:5,
    color:'#2A3439'
  },
  alertHeaderBox:{
    flexDirection: 'row',
    backgroundColor: '#FFF3F3',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginVertical: 8,
    shadowColor: 'red',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  }
});

export default WeatherForecast;
