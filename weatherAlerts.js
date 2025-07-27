import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,Platform, Button } from 'react-native';
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
import { auth,db} from './firebaseConfig';
import { doc, setDoc, getDoc, collection, updateDoc, arrayRemove, deleteField} from 'firebase/firestore';
import { XMLParser } from 'fast-xml-parser';
import {capFeeds} from './capfeeds'
import Footer from './footer'
import MapView, { Marker } from 'react-native-maps';


// handle the properties of the notifications being sent
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
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

  // const [displayName, setDisplayName] = useState('')
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [removedAlertData, setRemovedAlertData] = useState([]);
  const [removedAlertIndex, setRemovedAlertIndex] = useState({}); 
  const [showUndoBanner, setShowUndoBanner] = useState(false);

  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [removeLocation, setRemoveLocation] = useState(null);

  const [zipcodeInput, setZipcodeInput] = useState('');

  const [filteredLocations, setFilteredLocations] = useState([]);
  const [filteredStatesForCurrent, setFilteredStatesForCurrent] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);

  const [autoComplete, setAutoComplete] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [stopSuggestions, setStopSuggestions] = useState(false)
  const [searchLoc, setSearchLoc] = useState('')

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState(null)
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('');


  const userID = auth.currentUser.uid;
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) setExpoPushToken(token);
      } catch (err) {
        console.error("Notification setup error:", err);
      }
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      navigate('login'); 
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
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
        if(existingStatus =='granted'){
          console.log('permission granted to send notifs!')
        }

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

  const storageKey = `${userID}_saved_weather_locations`;


  // save locations to storage
  const saveLocation = async (data) => {
    try {
      // const userID = auth.currentUser?.uid;
      // if (!userID) throw new Error('No user is signed in.');

      const docRef = doc(db, 'locations', userID);
      await setDoc(docRef, { data }, { merge: true });

      // console.log('✅ Saved locations to Firestore');
    } catch (error) {
      console.error('❌ Failed to save locations to Firestore:', error);
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
      const userID = auth.currentUser?.uid;
      if (!userID) throw new Error('User not signed in');

      const alertsRef = doc(db, 'alerts', userID);
      await setDoc(alertsRef, { data: allAlerts }); // store alerts under "data" key
      // console.log('✅ Saved alerts to Firestore');
    } 
    catch (error) {
      console.error('❌ Failed to save alerts to Firestore:', error);
    }
  }

  // load locations from firestore
  const loadLocationsFromStorage = async () => {
    try {
      const docRef = doc(db, 'locations', userID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data().data; 
        // console.log('✅ Loaded locations:', data);
        setAdditionalWeatherData(data);
      } 
      else {
        // console.log('No locations found');
      }
    } catch (error) {
      console.error('❌ Failed to load locations from Firestore:', error);
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

  const fetchCAPAlertsByCountryName = async (country) => {
    const feeds = capFeeds[country] || [];
    const parser = new XMLParser({ ignoreAttributes: false ,attributeNamePrefix: '@_',  ignoreDeclaration: true,removeNSPrefix: true, });
    const alerts = [];

    for (const url of feeds) {
      try {
        const res = await axios.get(url);
        const parsed = parser.parse(res.data);
        const items = parsed.rss?.channel?.item || parsed.feed?.entry || [];
        const entries = Array.isArray(items) ? items : [items];

        for (const entry of entries) {

          let alertLink = null;
          if (entry.link) {
            if (Array.isArray(entry.link)) {
              const capLink = entry.link.find(l => l?.['@_type'] === 'application/cap+xml' && l?.['@_href']);
              if (capLink) {
                alertLink = capLink['@_href'];
              } else {
                // fallback to first href or text link
                const fallback = entry.link[0];
                alertLink = fallback?.['@_href'] || fallback?.['#text'] || fallback;
              }
            } 
            //if link is a single object
            else if (typeof entry.link === 'object') {
              alertLink = entry.link['@_href'] || entry.link['#text'] || entry.link;
            } 
            // if link is just a string
            else {
              alertLink = entry.link;
            }
          }
          if (!alertLink) {
            console.warn("No usable alert link found for entry:", entry);
            continue;
          }

          try {
            const alertRes = await axios.get(alertLink);
            const alertXML = parser.parse(alertRes.data);
            const alertInfo = alertXML.alert
            if (!alertInfo) {
              console.warn(`No <alert> element in: ${alertLink}`);
              continue;
            }
            let infos = alertInfo.info;
            if (!infos) {
              console.warn(`No <info> element in alert at ${alertLink}`);
              continue;
            } 

            const infoBlocks = Array.isArray(infos) ? infos : [infos];

            // get the english information
            const englishInfo = infoBlocks.find(i =>
              (i.language || i.hreflang || '').toLowerCase().startsWith('en')
            );
            // get the local language
            const otherInfo = infoBlocks.find(i =>
              i.language && !i.language.toLowerCase().startsWith('en')
            );
            const fallbackInfo = infoBlocks[0] || {};
            // get headline
            let headlineText = 'no headline';
            if (englishInfo?.headline) {
              headlineText = englishInfo.headline;
              if (otherInfo?.headline) {
                headlineText += ` (${otherInfo.headline})`;
              }
            } 
            else if (otherInfo?.headline) {
              headlineText = otherInfo.headline;
            } 
            else if (fallbackInfo?.headline) {
              headlineText = fallbackInfo.headline;
            }
            // get the area descriptions
            let areaDescs = [];
            // if area is an array
            if (Array.isArray(englishInfo?.area)) {
              areaDescs = englishInfo.area.flatMap(a => (a.areaDesc || '').split(',').map(s => s.trim()));
            } 
            // if area is a single object with areaDesc string
            else if (englishInfo?.area?.areaDesc) {
              areaDescs = englishInfo.area.areaDesc.split(',').map(s => s.trim());
            }
            //if areaDesc exists directly under 'info' element
            else if (englishInfo?.areaDesc) {
              areaDescs = englishInfo.areaDesc.split(',').map(s => s.trim());
            }
            // get the instructions 
            let instructionText = 'no instructions available';
            if (englishInfo?.instruction) {
              instructionText = englishInfo.instruction;
              if (otherInfo?.instruction) {
                instructionText += ` (${otherInfo.instruction})`;
              }
            } 
            else if (otherInfo?.instruction) {
              instructionText = otherInfo.instruction;
            } 

            alerts.push({
              headline: headlineText,
              event: {
                en: englishInfo?.event || '',
                local: otherInfo?.event || ''
              },
              areas: areaDescs,
              effective: englishInfo?.effective || otherInfo?.effective || englishInfo?.onset || '',
              expires: englishInfo?.expires || otherInfo?.expires || englishInfo?.onset || '',
              description: {
                en: englishInfo?.description || englishInfo?.desc|| '',
                local: otherInfo?.description || ''
              },
              instruction: instructionText,
              severity: englishInfo?.severity || otherInfo?.severity || 'Unknown',
              certainty: englishInfo?.certainty || otherInfo?.certainty || 'Unknown',
              urgency: englishInfo?.urgency || otherInfo?.urgency || 'Unknown',
              link: alertLink,
            });

          } 
          
          catch (alertErr) {
            console.warn(`Failed to fetch full alert from ${alertLink}:`, alertErr.message);
          }
        }
      }
      catch (err) {
      console.error(`Failed to fetch CAP feed for ${country}:`, err.message);
    }
  }
  const uniqueAlerts = [];
  const seen = new Set();

  for (const alert of alerts) {
    const key = `${alert.headline}-${alert.effective}-${alert.link}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAlerts.push(alert);
    }
  }

  return uniqueAlerts;
};

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        // // get location and set longitude and latidue based on it 
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords; 
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        const city = geocode[0]?.city|| geocode[0]?.subregion || geocode[0]?.region
        const country = geocode[0]?.country || ''; 
        // console.log(location.coords)
        // const country = 'USA'
        // console.log('country', country)
        // const response = await axios.get(
        //   `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPI}&q=${country}&alerts=yes&days=3`
        // );
        // get response from weatherapi.com
        const response = await axios.get(
          `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPI}&q=${latitude},${longitude}&alerts=yes&days=3`
        );
        let alerts = response.data.alerts?.alert || [];
       
        if(alerts.length == 0){
          alerts = await fetchCAPAlertsByCountryName(country);
        }
        // prevent duplication of alerts even the api has duplicates
        const normalize = (val) => (val || '').toString().trim().toLowerCase();

        const uniqueAlerts = alerts.filter((alert, index, self) =>
          index === self.findIndex(a =>
            normalize(a.headline) === normalize(alert.headline) &&
            normalize(a.event) === normalize(alert.event) &&
            normalize(a.areas) === normalize(alert.areas) &&
            normalize(a.desc) === normalize(alert.desc)
          )
        );
        // const uniqueAlerts = alerts.filter((alert, index, self) =>
        //   index === self.findIndex(a =>
        //     a.headline === alert.headline &&
        //     a.effective === alert.effective &&
        //     a.expires === alert.expires
        //   )
        // );

       
        setCurrentLocation(country);
        setCurrentWeather(response.data.current);
        setCurrentForecast(response.data.forecast.forecastday);
        setCurrentAlerts(uniqueAlerts);
        setLoading(false);

      } 
      // show error
      catch (error) {
        console.error("API error:", error.response?.data || error.message);
        setErrorMsg('Failed to fetch weather data');
        setLoading(false);
      }
    };

    fetchWeather();
    loadLocationsFromStorage();

  }, []);
  
  // check if there are new alerts and save them
  useEffect(() => {
    if (!loading && allAlerts.length > 0 && allAlerts<10) {
      console.log('Effect triggered: loading =', loading, ', allAlerts.length =', allAlerts.length);

      checkAndNotifyNewAlerts(allAlerts);
    }
    saveAlerts(allAlerts);
  }, [allAlerts, loading]);

  // notify alerts
  const checkAndNotifyNewAlerts = async (newAlerts) => {
    try {
      const alertsDocRef = doc(db, 'alerts', userID);
      const snapshot = await getDoc(alertsDocRef);
      const previousAlerts = snapshot.exists() && snapshot.data().alerts ? snapshot.data().alerts : [];

      const previousKeys = new Set(
        previousAlerts.map(a => `${a.headline}-${a.effective}`)
      );

      const newOnes = newAlerts.filter(
        a => !previousKeys.has(`${a.headline}-${a.effective}`)
      );

      newOnes.forEach(alert => {
        const eventText = typeof alert.event === 'object'
          ? alert.event.en || alert.event.local || 'Alert'
          : alert.event;

        const areaText = typeof alert.areas === 'object'
          ? alert.areas.en || alert.areas.local || 'your area'
          : alert.areas;

        Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ New Alert',
            body: `${eventText} in ${areaText}`,
            data: {
              headline: String(alert.headline || ''),
            },
          },
          trigger: null,
        });
      });

      // Save latest alerts back to Firestore
      await setDoc(alertsDocRef, { alerts: newAlerts }, { merge: true });
    } 
    catch (err) {
      console.error('❌ Error checking for new alerts:', err);
    }
  };

  // add multiple locations
  const addLocation = async () => {
    if (!zipcodeInput.trim()) return;

    try {
      const forecastResponse = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPI}&q=${zipcodeInput}&alerts=yes&days=3&lang=en`
      );
      
      const locationData = forecastResponse.data.location;
      const countryFromApi = locationData.country || ''
      const regionFromApi = locationData.region || ''
      // console.log("countryFromApi",countryFromApi)

      const cityDisplayName = `${locationData.region}, ${locationData.country}`;

      let alerts = forecastResponse.data.alerts?.alert || [];
      if (!alerts.length) {
        alerts = await fetchCAPAlertsByCountryName(countryFromApi);
      }
      // prevent duplication of alerts even the api has duplicates
      
      const normalize = (str = '') => (str || '').toString().trim().toLowerCase();

      const generateAlertKey = (alert) => {
        return [
          normalize(alert.headline),
          normalize(alert.event),
          normalize(Array.isArray(alert.areas) ? alert.areas.join(',') : alert.areas),
          normalize(alert.expires),
          normalize(alert.desc)
        ].join('|');
      };

      const seenKeys = new Set();
      const uniqueAlerts = alerts.filter(alert => {
        const key = generateAlertKey(alert);
        if (seenKeys.has(key)) {
          return false;
        }
        seenKeys.add(key);
        return true;
      })

      const locationEntry = {
        current: forecastResponse.data.current,
        forecast: forecastResponse.data.forecast.forecastday,
        alerts:uniqueAlerts
      };
      // console.log('total number of alerts fetched for:', alerts.length )

      setAdditionalWeatherData(prev => {
        const updated = {
          ...prev,
          [cityDisplayName]: locationEntry
        };
        saveLocation(updated);
        return updated;
      });

      setZipcodeInput('');
      setSelectedSuggestion(null)
      setShowModal(false);
    } 
    catch (error) {
      console.error('Add location error:', error.message);
      alert("Couldn't find that location. Please try a valid city name");
      setShowModal(false);
    }
  };
  // show suggestions to autocomplete the users search location
  // useEffect(() => {
  //   const delayDebounce = setTimeout(() => {
  //       if (stopSuggestions) {
  //           setStopSuggestions(false); 
  //           return;
  //       }
  //       if (searchLoc.trim().length > 1) {
  //           fetchSuggestions(searchLoc);
  //       } else {
  //           setAutoComplete([]);
  //       }
  //   }, 150);

  //   return () => clearTimeout(delayDebounce);
  // }, [searchLoc]);

  //fetch suggestions based on users input in the search box
  // const fetchSuggestions = async (input) => {
  //   const GEOAPIFY_API_KEY = '69b184b42bd641398d543f2022d56bb6'; 
  //   try {
  //     const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&limit=5&apiKey=${GEOAPIFY_API_KEY}`);
  //     const data = await response.json();
  //     if (data.features) {
  //         setAutoComplete(data.features);
  //     }
  //     console.log("Geoapify Suggestions for:", input);

  //   } catch (err) {
  //       console.error("Autocomplete error:", err);
  //   }
  // };

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
  // const removeLocationFromWatch = async(locationName)=>
  //   {
  //     setAdditionalWeatherData((prevData) => {
  //     const updated = { ...prevData };
  //     delete updated[locationName];
  //     saveLocation(updated);
  //     return updated;
  //   });

  //   // clear removed alerts data and index for this particular location
  //   setRemovedAlertData((prev) => prev.filter((item) => item.location !== locationName));
  //   setRemovedAlertIndex((prev) => {
  //     const updated = { ...prev };
  //     delete updated[locationName];
  //     return updated;
  //   });

  //   try {
  //     const alertData = await AsyncStorage.getItem(`${userID}_alerts`);
      
  //     if (alertData) {
  //       const parsedAlerts = JSON.parse(alertData);

  //       // split the location name as it currrently in the format of city - country
  //       const locationParts = locationName.toLowerCase().split(',').map(s => s.trim());
        
  //        // filter out alerts for the removed location
  //       const updatedAlerts = parsedAlerts.filter(alert => {
  //         const area = alert.areas?.toLowerCase() || '';
  //         const headline = alert.headline?.toLowerCase() || '';

  //         return !locationParts.some(part =>
  //           area.includes(part) || headline.includes(part)
  //         );
  //       });

  //       await AsyncStorage.setItem(`${userID}_alerts`, JSON.stringify(updatedAlerts));
  //     }
  //   } catch (error) {
  //     console.error('Failed to update alerts after location removal:', error);
  //   }
  // }
  const removeLocationFromWatch = async (locationName) => {
    try {
      const locDocRef = doc(db, 'locations', userID);
      const snapshot = await getDoc(locDocRef);

      if (snapshot.exists()) {
        const docData = snapshot.data();
        console.log(docData)
        const updatedLocations = (docData.locations || []).filter(loc => loc !== locationName);

        // Make a shallow copy of data and delete the location key
       await updateDoc(locDocRef, {
          locations: updatedLocations,
          [`data.${locationName}`]: deleteField(), // 2. Explicitly delete the nested key
        });

        // 3. Update local state
        const updatedData = { ...docData.data };
        delete updatedData[locationName];
        setAdditionalWeatherData(updatedData);
        setLocationName(updatedLocations);

        // setAdditionalWeatherData(updatedData);
        // setLocationName(updatedLocations);

      }
    } catch (error) {
      console.error('❌ Failed to update locations after removal:', error);
    }
  };

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

  const affectedAreas = [];

  
  currentAlerts?.forEach(alert => {
    // affectedAreas.push(...alert.areas);
    if (typeof alert.areas === 'string') {
      affectedAreas.push(...alert.areas.split(';').map(s => s.trim()));
    }
    else if(Array.isArray(alert.areas)) {
      affectedAreas.push(...alert.areas);
    }
  })

  const dropdownStatesData = Array.from(new Set(affectedAreas)).map(area => ({
    label: area,
    value: area,
  }));

  const filteredAlerts = filteredStatesForCurrent.length > 0
    ? currentAlerts.filter(alert => {
        let areas = [];
        if (Array.isArray(alert.areas)) {
          areas = alert.areas;
        } else if (typeof alert.areas === 'string') {
          areas = alert.areas.split(';').map(s => s.trim());
        }

        return areas.some(area => filteredStatesForCurrent.includes(area));
      })
    : currentAlerts;


  return (
  <View style={{flex:1}}>
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.locationsBar}>
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
          itemTextStyle={{ color: '#54626F' }}
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

      {currentAlerts.length > 0 && (
        <>
          <Text style={{ padding: 10, color:'#54626F', fontFamily:'times new roman', fontSize:12}}>
            There are currently {currentAlerts.length} alerts present in the country. Choose specific cities below to narrow the search:
          </Text>
          <View style={{flex: 1, maxWidth: '65%', marginBottom: 10}}>
            <MultiSelect
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              search
              data={dropdownStatesData}
              labelField="label"
              valueField="value"
              placeholder="Choose specific"
              searchPlaceholder="Search..."
              value={filteredStatesForCurrent}
              onChange={item => setFilteredStates(item)}
              renderLeftIcon={() => (
                <AntDesign
                  style={styles.icon}
                  color="black"
                  name="Safety"
                  size={15}
                />
              )}
              renderSelectedItem={() => <View />}
              itemTextStyle={{ color: '#54626F', fontFamily:'times new roman', fontSize:13 }}
            />
          </View>
          </>
        )}
      {filteredStatesForCurrent.length > 0 && (
          <View style={styles.selectedContainer}>
            {filteredStates.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedLocation}
                onPress={() => {
                  const updated = filteredStates.filter(loc => loc !== item);
                  setFilteredStates(updated);
                }}
              >
                <Text style={styles.selectedLocationText}>{item} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}


      {/** show the serverity, warning type and headline and when clicked it should show the details of the alert */}
      {filteredAlerts.slice(0,2).map((alert, index) => {
        // get the severity of the alert to render the box color accordingly
        const severityColor = getAlertColor(alert.severity);
        return (
         <TouchableOpacity key={`${alert.headline}-${alert.effective}-${index}`} onPress={() => { setshowAlertModal(true); setSelectedAlert(alert); }}>
          <View style={[styles.alertBox, { backgroundColor: severityColor }]}>
            <Text style={styles.alertTitle}>
              <Text style={{ fontWeight: 'bold' }}>Headline: </Text>
              {alert.headline || 'No headline'}
            </Text>
            <Text style={styles.alertTitle}>
              <Text style={{ fontWeight: 'bold' }}>Warning type: </Text>
                {typeof alert.event === 'string'
                  ? alert.event
                  : alert.event?.en || alert.event?.local || 'Unknown'}         
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
        const removedKeys = removedAlertIndex[locationName] || new Set();
        const alertsArray = Array.isArray(data.alerts) ? data.alerts : [];
        const visibleAlerts = alertsArray.filter(alert => !removedKeys.has(`${alert.headline}-${alert.effective}`));
        const affectedAreas =[]

        visibleAlerts.forEach(alert => {
          if (typeof alert.areas === 'string') {
            affectedAreas.push(...alert.areas.split(';').map(s => s.trim()));
          }
          else if (Array.isArray(alert.areas)) {
            affectedAreas.push(...alert.areas);
          }
        });

        // get unique area names for dropdown data
        const dropdownStatesData = Array.from(new Set(affectedAreas)).map(area => ({
          label: area,
          value: area
        }));

        const filteredAlerts = filteredStates.length > 0
          ? visibleAlerts.filter(alert =>{
            let areas = [];
              if (Array.isArray(alert.areas)) {
                areas = alert.areas;
              } else if (typeof alert.areas === 'string') {
                areas = alert.areas.split(';').map(s => s.trim());
              }
              return areas.some(area => filteredStates.includes(area));
              }
            )
          : visibleAlerts;

        return( 
          <View key={locationName}>
            <View style={styles.locationHeader}>
              <Text style={[styles.header,{fontStyle:'italic'}]}>Weather in {locationName}</Text>
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
            { visibleAlerts.length > 0 ? (
              <View style={styles.alertHeaderBox}>
                <AntDesign style={[styles.icon, {marginRight:50}]} color="red" name="warning" size={20} />
                <Text style={{fontFamily:'times new roman', fontSize:15, color:'black', fontWeight:'bold', flexShrink: 1, textAlign:'center'}}>
                  Alerts in {locationName}
                </Text>
              </View>
            ) : (
              <Text style={{fontFamily:'times new roman', fontSize:14, fontStyle:'italic', color:'gray', marginBottom: 5, textAlign:'center'}}>
                No alerts in {locationName}
              </Text>
            )}
          {visibleAlerts.length > 2 && (
            <>
              <Text style={{ padding: 10, color:'black', fontFamily:'times new roman', fontSize:12 }}>
                There are currently {visibleAlerts.length} alerts present in the country. Choose specific cities below to narrow the search:
              </Text>
              <View style={{flex: 1, maxWidth: '65%', marginBottom: 10}}>
                <MultiSelect
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  search
                  data={dropdownStatesData}
                  labelField="label"
                  valueField="value"
                  placeholder="Choose specific"
                  searchPlaceholder="Search..."
                  value={filteredStates}
                  onChange={item => setFilteredStates(item)}
                  renderLeftIcon={() => (
                    <AntDesign
                      style={styles.icon}
                      color="black"
                      name="Safety"
                      size={15}
                    />
                  )}
                  renderSelectedItem={() => <View />}
                  itemTextStyle={{ color: '#54626F' }}
                />
              </View>
              </>
            )}

            {filteredStates.length > 0 && (
              <View style={styles.selectedContainer}>
                {filteredStates.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.selectedLocation}
                    onPress={() => {
                      const updated = filteredStates.filter(loc => loc !== item);
                      setFilteredStates(updated);
                    }}
                  >
                    <Text style={styles.selectedLocationText}>{item} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {filteredAlerts.length >= 1 && (
              <Text>{filteredAlerts.length}</Text>
            )}
       
            {filteredAlerts.slice(0,5).map((alert, index) => {
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
                      {alert.headline || 'No headline'}
                    </Text>
                    <Text style={styles.alertTitle}>
                      <Text style={{ fontWeight: 'bold' }}>Warning type: </Text>
                        {typeof alert.event === 'string'
                          ? alert.event
                          : alert.event?.en || alert.event?.local || 'Unknown'}         
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
      
      {/** modal to show description of the alerts when user clicks on them*/}
      <Modal animationType="fade" transparent={true} visible={showAlertModal} onRequestClose={() => setshowAlertModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={{ fontWeight: 'bold', marginBottom: 10, color:'#3B444B', fontFamily:'times new roman'}}>{selectedAlert?.headline}</Text>
              {/** show the details */}
              <View>
                <Text style={styles.detailsHeader}> Details</Text>
                <Text style={styles.descriptionText}>{selectedAlert?.description?.en || selectedAlert?.description?.local || selectedAlert?.desc || 'No description available.'}</Text>
              </View>
              {/** list and split out the instrucstions if any*/}
              <View>
                <Text style={styles.detailsHeader}>Instructions</Text>
                {selectedAlert?.instruction
                  ? selectedAlert.instruction.split(/[\n❖✓]+/).map((line, idx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      return (
                        <Text key={idx} style={styles.descriptionText}>
                          • {trimmed}
                        </Text>
                      );
                    })
                  : <Text style={styles.descriptionText} >No instructions available.</Text>}
              </View>
              </ScrollView>
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
            <Text style={{ fontWeight: 'bold', color:'#54626F', fontFamily:'times new roman'}}>Country</Text>
            <TextInput
              style={styles.input}
              value={zipcodeInput}
              onChangeText={(text) => {
                setZipcodeInput(text);
                setSearchLoc(text); 
              }}
              placeholder="e.g. Singapore / USA"
              placeholderTextColor='#54626F'
            />
            {autoComplete.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {autoComplete.map((item, index) => {
                  const displayName = item.properties.formatted;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        // console.log("Selected suggestion:", displayName);

                        // console.log("Selected suggestion:", item.properties.formatted);

                        setZipcodeInput(displayName);
                        setSelectedSuggestion({
                          name: displayName,
                          lat: item.properties.lat,
                          lon: item.properties.lon,
                        }); 

                        setAutoComplete([]);
                        setStopSuggestions(true);
                      }}
                      style={styles.suggestionItem}
                    >
                      <Text style={{color:'#54626F', fontFamily:'times new roman', fontSize:12 }}>{displayName}</Text>
                    </TouchableOpacity>
                  );
              })}
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
    // color:'red'
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
    maxHeight: '80%',
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
    elevation:5

  },
  placeholderStyle: {
    fontSize: 14,
    textAlign:'center',
    color:'#54626F', 
    fontFamily:'times new roman'
  },
  selectedTextStyle: {
    fontSize: 14,
    color:'black'
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    color:'black'
    
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
    color:'black',
    fontFamily:'times new roman',
    marginBottom:10
  },

  selectedLocationText: {
    fontSize: 14,
    color: '#54626F',
    fontFamily:'times new roman'
  },
  loadingIcon:{
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
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
    // flexWrap:'wrap',
    // alignItems: 'center',
  },
  filterAlert:{
    flexDirection:'row',
    justifyContent:'space-evenly'
  },
  descriptionText:{
    marginBottom:10,
    color:'#2A3439',
    fontFamily:'times new roman',
   
  },
  detailsHeader:{
    fontWeight: 'bold', 
    marginBottom: 20, 
    fontFamily:'times new roman', 
    color:'#3B444B',  
    textDecorationLine:'underline',
    textAlign:'center',
    marginTop:20
  }
});

export default WeatherForecast;
