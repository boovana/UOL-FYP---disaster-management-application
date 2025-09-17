import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,Platform, Button } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';
import { MultiSelect } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Notifications from 'expo-notifications';
import { navigate } from './navigationRef';
import * as Device from 'expo-device';
import { auth,db} from './firebaseConfig';
import { doc, setDoc, getDoc, collection, updateDoc, arrayRemove, deleteField, onSnapshot} from 'firebase/firestore';
import { XMLParser } from 'fast-xml-parser';
import {capFeeds} from './capfeeds'
import Footer from './footer'
import { ProgressBar } from 'react-native-paper';
import { Linking } from 'react-native';


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
    const [filteredAlertsBySeverity, setFilteredAlertsBySeverity] = useState([]); 
    const [sortingBySeverity, setSortingBySeverity] = useState(null); 


    const [autoComplete, setAutoComplete] = useState([])
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [stopSuggestions, setStopSuggestions] = useState(false)
    const [searchLoc, setSearchLoc] = useState('')

    const [expoPushToken, setExpoPushToken] = useState('');
    const [globalExpoPushToken, setGlobalExpoPushToken] = useState(null);

    const [notification, setNotification] = useState(null);
    const [selectedSeverityFilter, setSelectedSeverityFilter] = useState(null)
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [selectedCoord, setSelectedCoord] = useState(null);
    const [selectedAreaFilter, setSelectedAreaFilter] = useState('');
    const [lastNotifiedCount, setLastNotifiedCount] = useState(0);
    const globalExpoPushTokenRef = useRef(null);
    const [progress, setProgress] = useState(0);

    const [allowNotification, setAllowNotification] = useState(false)




    const userID = auth.currentUser?.uid;

    useEffect(() => {
      const setupNotifications = async () => {
        console.log('setting up notifs')
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setExpoPushToken(token)
            setGlobalExpoPushToken(token);
            globalExpoPushTokenRef.current = token; 
          }
        } 
        catch (err) {
          console.error("Notification setup error:", err);
        }
      };

      setupNotifications();
    }, []);

    useEffect(() => {
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });
      // go to login page
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        navigate('home'); 
      });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    }, []);
 

    const registerForPushNotificationsAsync = async () => {
      console.log('calling register push notifications')
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
          console.log('Existing permission status:', existingStatus);

          let finalStatus = existingStatus;
          if(existingStatus =='granted'){
            setAllowNotification(true)
            console.log('permission granted to send notifs!')
          }

          //ask for permission to send notification
          if (existingStatus !== 'granted') {
            setAllowNotification(false)
            console.log(' no permisssion to send notifs')
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus !== 'granted') {
            setAllowNotification(false)
            console.log('Permission not granted for push notifications');
            return null;
          }

          token = (await Notifications.getExpoPushTokenAsync()).data;
          
          console.log("Expo Push Token:", token);
          if (userID && token) {
            await setDoc(doc(db, 'users', userID), { expoPushToken: token }, { merge: true });
          }
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
    const saveLocation = async (locationsData) => {
      try {
        const userID = auth.currentUser?.uid;
        if (!userID) {
          console.log('No user is signed in.')
        };

        const docRef = doc(db, 'locations', userID);
        const locationsList = Object.keys(locationsData);
       
        await setDoc(docRef, { data: locationsList }, { merge: true });

      } catch (error) {
        console.error('unable to save locations to firestore:', error);
      }
    };

    //get all alerts 
    const allAlerts = [
      ...(currentAlerts || []),
      ...Object.values(additionalWeatherData ||{}).flatMap(loc => loc.alerts || [])
    ];

    //save alerts to storage 
    const saveAlerts = async(allAlerts)=>{
      try {
        const userID = auth.currentUser?.uid;
        if (!userID) throw new Error('User not signed in');

        const alertsRef = doc(db, 'alerts', userID);
        await setDoc(alertsRef, { data: allAlerts });
      } 
      catch (error) {
        console.error('Failed to save alerts to Firestore:', error);
      }
    }

  // load locations from firestore
    useEffect(() => {
      if (!userID) return;

      const loadLocationsFromStorage = async () => {
        try {
          const docRef = doc(db, 'locations', userID);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const docData = docSnap.data();
            const data = docData.data || {};
            const locationsList = docData.locations || [];

            // keep only data for the saved locations
            const filteredData = {};
            locationsList.forEach(loc => {
              if (data[loc]) {
                filteredData[loc] = data[loc];
              }
            });
            // set the addiitonal location data
            setAdditionalWeatherData(filteredData);

            if (locationsList?.length > 0) {
              const firstLocationKey = locationsList[0];
              // get the country name
              const countryName = firstLocationKey.split(',').pop().trim(); 
              const freshDisasters = await fetchGDACSByCountry(countryName);

              filteredData[firstLocationKey].gdacsDisasters = freshDisasters;

              await setDoc(docRef, { data: filteredData }, { merge: true });
            } 
            else {
              console.log('no locations found for user:', userID);
            }
          }
        } catch (error) {
          console.error('failed to load locations:', error);
        }
      };

      loadLocationsFromStorage();
    }, [userID]); 

    //fetch the GDACS events for each disaster type
    const fetchGDACSByCountry = async (countryName) => {
      const GDACSRSS_URLS = {
        TC_3m: 'https://www.gdacs.org/contentdata/xml/rss_tc_7d.xml',
        EQ_24h: 'https://www.gdacs.org/contentdata/xml/rss_eq_24h.xml',
        FL_3m: 'https://www.gdacs.org/contentdata/xml/rss_fl_7d.xml',
        WF_48h: 'https://www.gdacs.org/contentdata/xml/rss_wf_3m.xml',
        DR_48h: 'https://www.gdacs.org/contentdata/xml/DR_news.xml',
        all_7d: 'https://www.gdacs.org/contentdata/xml/rss_7d.xml'
      };

      const parser = new XMLParser();
      let allItems = [];

      for (const key in GDACSRSS_URLS) {
        const url = GDACSRSS_URLS[key];
        try {
          const response = await axios.get('https://corsproxy.io/?' + encodeURIComponent(url));
          const parsed = parser.parse(response.data);
          const items = parsed?.rss?.channel?.item || [];

          // push only items that include the country name
          const countryFiltered = items.filter(item =>
            item.description?.toLowerCase().includes(countryName.toLowerCase())
          );

          allItems.push(...countryFiltered);
        } 
        catch (error) {
          console.error(`❌ Failed to fetch GDACS RSS [${key}]:`, error.message);
        }
      }
      // remove duplicates
      const seenReports = new Set()
      const uniqueReports = []
      // if the title and published date is the same, only add 1 of it
      for (const item of allItems) {
        const key = `${item.title}-${item.pubDate}`;
        if (!seenReports.has(key)) {
          seenReports.add(key);
          uniqueReports.push(item);
        }
      }

      return uniqueReports.map(item => ({
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pubDate
      }));
    };

    // convert the added locations into an array
    const dropdownData = Object.keys(additionalWeatherData || {}).map((location) => ({
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
      console.log('calling cap feeds for country:', country)

      for (const url of feeds) {
        try {
          const res = await axios.get(url);
          const parsed = parser.parse(res.data);
          const items = parsed.rss?.channel?.item || parsed.feed?.entry || [];
          const entries = Array.isArray(items) ? items : [items];

          for (const entry of entries) {

            let alertLink = null;
            if (entry.link) {
              // console.log(entry.link)
              if (Array.isArray(entry.link)) {
                const capLink = entry.link.find(l => l?.['@_type'] === 'application/cap+xml' && l?.['@_href']);
                if (capLink) {
                  alertLink = capLink['@_href'];
                  console.log('alertLink:',alertLink)
                } else {
                  // fallback to first href or text link
                  const fallback = entry.link[0];
                  console.log('alertLink:',alertLink)
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
            // console.log(alertLink)

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
              let instructionText = 'No instructions available';
              if (englishInfo?.instruction) {
                instructionText = englishInfo.instruction;
                if (otherInfo?.instruction) {
                  instructionText += ` (${otherInfo.instruction})`;
                }
              } 
              else if (otherInfo?.instruction) {
                instructionText = otherInfo.instruction;
              } 
              else if(fallbackInfo?.instruction){
                instructionText = fallbackInfo.instruction;
              }

              // get the description of the alerts in the available languages
              let descriptionText = 'No description available';

              if (englishInfo?.description) {
                descriptionText = englishInfo.description;
              } 
              else if (englishInfo?.desc) {
                descriptionText = englishInfo.desc;
              } 
              else if (otherInfo?.description) {
                descriptionText = otherInfo.description;
              } 
              else if (otherInfo?.desc) {
                descriptionText = otherInfo.desc;
              } 
              else if (fallbackInfo?.description) {
                descriptionText = fallbackInfo.description;
              } else if (fallbackInfo?.desc) {
                descriptionText = fallbackInfo.desc;
              }

              alerts.push({
                country:country,
                headline: headlineText,
                event: {
                  en: englishInfo?.event ||  fallbackInfo?.event || '',
                  local: otherInfo?.event || ''
                },
                areas: areaDescs,
                effective: englishInfo?.effective || otherInfo?.effective || englishInfo?.onset || 'Uncertain',
                expires: englishInfo?.expires || otherInfo?.expires || englishInfo?.onset || fallbackInfo?.expires ||'',
                description:descriptionText,
                instruction: instructionText,
                severity: englishInfo?.severity || otherInfo?.severity || fallbackInfo?.severity||  'Unknown',
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
  
          setCurrentLocation(country);
          setCurrentWeather(response.data.current);
          setCurrentForecast(response.data.forecast.forecastday);
          setCurrentAlerts(uniqueAlerts);
          setLoading(false);

        } 
        // show error
        catch (error) {
          // console.error("API error:", error.response?.data || error.message);
          setErrorMsg('Failed to fetch weather & alerts data \nPlease ensure you have granted permissions to access location!');
          setLoading(false);
        }
      };

      fetchWeather();

    }, []);

  


    // check if there are new alerts and save them
    useEffect(() => {
      if (!loading && allAlerts.length > 0 &&  allAlerts.length <20)  {
        // console.log('Effect triggered: loading =', loading, ', allAlerts.length =', allAlerts.length);
      }
      saveAlerts(allAlerts);
    }, [allAlerts, loading]);

    


    // add multiple locations
    const addLocation = async () => {
      if (!zipcodeInput.trim()) return;
      setProgress(0);
      // simulate progress
      for (let i = 1; i <= 100; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        setProgress(i / 100);
      }
      try {
        console.log('adding location')
        const forecastResponse = await axios.get(
          `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPI}&q=${zipcodeInput}&alerts=yes&days=3&lang=en`
        );
        // get the relevant details
        const locationData = forecastResponse.data.location;
        const countryFromApi = locationData.country || ''
        const regionFromApi = locationData.region || ''

        const cityDisplayName = `${locationData.region}, ${locationData.country}`;

        let alerts = forecastResponse.data.alerts?.alert || [];
        if (!alerts.length) {
          alerts = await fetchCAPAlertsByCountryName(countryFromApi);
          // make sure expired alerts are not shown
          alerts = alerts.filter(a => {
            const expiry  = new Date(a.expires);
            return isNaN(expiry.getTime()) || expiry > Date.now();
          });
        }
        const gdacsDisasters = await fetchGDACSByCountry(countryFromApi);

        // prevent duplication of alerts even the api has duplicates
        const normalize = (str = '') => (str || '').toString().trim().toLowerCase();

        const generateAlertKey = (alert) => {
          return [
            normalize(alert.headline),
            normalize(alert.event),
            normalize(Array.isArray(alert.areas) ? alert.areas.join(',') : alert.areas),
            normalize(alert.expires),
            normalize(alert.desc?.en || '')
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
          alerts:uniqueAlerts,
          gdacsDisasters: gdacsDisasters
        };

        setAdditionalWeatherData(prev => {
          const updated = {
            ...prev,
            [cityDisplayName]: locationEntry
          };

          // save to firestore
          const docRef = doc(db, 'locations', userID);
          const newLocationList = Object.keys(updated);

          setDoc(docRef, {data: updated,locations: newLocationList}, { merge: true });

          return updated;
        });

        setZipcodeInput('');
        setSelectedSuggestion(null)
        setShowModal(false);
      } 
      catch (error) {
        console.error('add location error:', error.message);
        alert("Couldn't find that location. Please try a valid city name");
        setShowModal(false);
      }
      finally{
        setIsLoading(false);
      }
    };

    const generateAlertKey = (alert) => {
      const normalize = (str = '') => (str || '').toString().trim().toLowerCase();

      return [
        normalize(alert.headline),
        normalize(typeof alert.event === 'object' ? alert.event.en || alert.event.local : alert.event),
        normalize(typeof alert.areas === 'object' ? alert.areas.en || alert.areas.local : alert.areas),
        normalize(alert.expires || alert.effective || '')
      ].join('|');
    };
    
    // refresh location data
    const refreshAllLocations = async () => {
      try {
        const userDocRef = doc(db, 'locations', userID);
        const userDocSnap = await getDoc(userDocRef);

        const savedLocations = userDocSnap.data()?.locations || [];
        const savedData = userDocSnap.data()?.data || {};
        const tempData = {};

        for (const cityDisplayName of savedLocations) {
          const [region, country] = cityDisplayName.split(',').map(s => s.trim());
          const existingData = savedData[cityDisplayName] || {};

          try {
            const query = `${region},${country}`;
            const forecastResponse = await axios.get(
              `https://api.weatherapi.com/v1/forecast.json?key=${weatherAPI}&q=${query}&alerts=yes&days=3&lang=en`
            );

            // get alerts from weatherAPI
            let alerts = forecastResponse.data.alerts?.alert || [];
            // ensure that expired alerts are not shown
            if (!alerts.length && existingData.alerts?.length) {
              alerts = existingData.alerts;
            }

            // use CAP alerts if nothing is found in the API -- fallback
            if (!alerts.length) {
              try {
                alertsFetchedFromCAP = await fetchCAPAlertsByCountryName(country);
              } 
              catch (error) {
                console.warn(`Failed to fetch CAP alerts for ${country}:`, error.message);
                alerts = existingData.alerts || [];
              }
            }
            alerts = alerts.filter(a => {
              const exp = new Date(a.expires);
              return isNaN(exp.getTime()) || exp > Date.now();
            });
                      
            // get rid duplicates from the feeds/api
            const seenKeys = new Set();
            const uniqueAlerts = alerts.filter(alert => {
              const key = generateAlertKey(alert);
              if (seenKeys.has(key)) return false;
              seenKeys.add(key);
              return true;
            });
            // notify about new alerts
            // await checkAndNotifyNewAlerts(cityDisplayName, uniqueAlerts, existingData.alerts, expoPushToken);

            // preserve GDACS if available
            const gdacsDisasters = existingData.gdacsDisasters || [];

            tempData[cityDisplayName] = {
              current: forecastResponse.data.current,
              forecast: forecastResponse.data.forecast.forecastday,
              alerts: uniqueAlerts,
              gdacsDisasters
            };

          } catch (err) {
            console.warn(`Failed to refresh ${cityDisplayName}:`, err.message);
            if (existingData.current && existingData.forecast) {
              tempData[cityDisplayName] = existingData;
            }
          }
        }

        // update firestore with the refreshed data and local state
        await setDoc(userDocRef, {data: tempData,locations: savedLocations}, { merge: true });
        setAdditionalWeatherData(prev => ({...prev, ...tempData}));
      } 
      catch (error) {
        console.log('Refresh locations error:', error.message);
      }
    };
    
    // refresh locations every 2 hours
    useEffect(() => {
      const oneHour = 60 * 120 * 1000;

      const intervalId = setInterval(() => {
        refreshAllLocations();
      }, oneHour);

      refreshAllLocations();

      return () => clearInterval(intervalId);
    }, [userID]);


    //show loader 
    if (loading) {
      return (
        <View style={styles.loadingIcon}>
          <ActivityIndicator  size="large" color="#0000ff" />
          <Text style={{color:'black', fontFamily:'times new roman'}}>Hang on for just a bit!</Text>
        </View>
      );
    }

    if (errorMsg) {
      return (
        <View style={styles.center}>
          <Text style={styles.errMessage}>{errorMsg}</Text>
        </View>
      );
    }
    
    // set the severity color of the alert box
    const getAlertColor = (severity) => {
      switch (severity?.toLowerCase()) {
        case 'moderate':
          return '#f1e166ff'; 
        case 'severe':
          return '#FB9E3A'; 
        case 'extreme':
          return '#d75050ff'; 
        default:
          return '#B0BEC5'; 
      }
    };

    // remove location from watch
    const removeLocationFromWatch = async (locationName) => {
      try {
        const locDocRef = doc(db, 'locations', userID);
        const snapshot = await getDoc(locDocRef);

        if (snapshot.exists()) {
          const docData = snapshot.data();
          console.log(docData)
          const updatedLocations = (docData.locations || []).filter(loc => loc !== locationName);
          const currentData = docData.data || {};
          const updatedData = {};
          for (const key in currentData) {
            if (key !== locationName) {
              updatedData[key] = currentData[key];
            }
          }
          
          // overwrite with new values
          await setDoc(locDocRef, {
            data: updatedData,
            locations: updatedLocations
          }, { merge: false });

          // updating local state
          setAdditionalWeatherData(updatedData);
          setLocationName(updatedLocations);
        }
      } catch (error) {
        console.error('failed to update locations after removal:', error);
      }
    };

    // function to remove an alert if user wants 
    const removeAlert = (locationName, alert) => {
      // the alert key 
      const alertKey = `${alert.headline}-${alert.effective}`;
      const uniqueId = `${locationName}_${alertKey}_${Date.now()}`;
      setRemovedAlertIndex((prev) => {
        const updated = { ...prev };
        updated[locationName] = new Set([...(updated[locationName] || []), alertKey]);
        return updated;
      });

      const alertData = 
      {
        id: uniqueId,
        location: locationName,
        alertKey,
        alert,
      };
      // show undo banner after removing alert
      setRemovedAlertData((prev) => [...prev, alertData]);
      setShowUndoBanner(true);
      // persist the undo banner for awhile
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

    /// setting the dropdown values with the affected areas for users to choose from
    const dropdownStatesData = Array.from(new Set(affectedAreas)).map(area => ({
      label: area,
      value: area,
    }));
    // get filtered alerts
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

    
    const sortAlertsBySeverity =(color) =>{
      const severityLevels = {Red: 'Extreme', Orange: 'Severe',Yellow: 'Moderate',Grey: 'Minor'};
      console.log('selected color:', color)
      const severity = severityLevels[color];
      /// filter the alerts by severity, toggle and save state
      if (sortingBySeverity === severity) {
        // if clicked on the same severity again, clear filter
        setFilteredAlertsBySeverity([]);
        setSortingBySeverity(null);
      } 
      else {
        // else filter alerts by selected severity
        const filtered = allAlerts.filter(alert => alert.severity === severity);
        setFilteredAlertsBySeverity(filtered);
        setSortingBySeverity(severity);
      }
    };

    // get the alert color based on the first word in the title of the report 
    const getReportHeaderColor=(title)=>{
      const alertType = title?.split(' ')[0]; 
      switch (alertType){
        case 'Green':
          return '#dadd9893'
        case 'Orange':
          return 'orange'
        case 'Red':
          return '#cf8384ff'
      }
    }



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
          <Text style={{fontFamily:'times new roman', color:'#3B444B', padding:10, fontWeight:'bold', fontSize:15}} >Sort by alert severity</Text>
          <View style={{flexDirection:'row', flexWrap:'wrap', justifyContent:'center', marginTop:10, marginBottom:20}}>

            <TouchableOpacity onPress={() => sortAlertsBySeverity('Red')}  style ={[styles.filterSeverityBtn, {backgroundColor:'#d75050ff'}]}>
              <Text style={{color:'black', fontFamily:'times new roman'}}>
                Red {sortingBySeverity === 'Extreme' && <AntDesign name="close" size={13} color="black"/>}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => sortAlertsBySeverity("Orange")} style ={[styles.filterSeverityBtn, {backgroundColor:'#FB9E3A'}]}>
              <Text style={{color:'black', fontFamily:'times new roman'}}>
                Orange {sortingBySeverity === 'Severe'  && <AntDesign name="close" size={13} color="black" />}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => sortAlertsBySeverity("Yellow")} style ={[styles.filterSeverityBtn, {backgroundColor:'#f1e166ff'}]}>
              <Text style={{color:'black', fontFamily:'times new roman'}}>
                Yellow {sortingBySeverity === 'Moderate'  && <AntDesign name="close" size={13} color="black" />}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => sortAlertsBySeverity("Grey")} style ={[styles.filterSeverityBtn,{backgroundColor:'#B0BEC5'}]}>
              <Text style={{color:'black', fontFamily:'times new roman'}}>
                Grey {sortingBySeverity === 'Minor'  && <AntDesign name="close" size={13} color="black" />}
              </Text>
            </TouchableOpacity>

          </View>
          {filteredAlertsBySeverity.length > 0 && sortingBySeverity && (
            <View style={{ marginTop: 10 }}>
              {/** country of the alert */}
              {[
                ...new Set(filteredAlertsBySeverity.map(alert => alert.country || 'Unknown'))
              ].map((country, idx) => (
                <Text key={idx} style={styles.alertTitle}>Country: {country}</Text>
              ))}
              <Text> {alert.country}</Text>
              {/** show the filtered alerts */}
              {filteredAlertsBySeverity.map((alert, index) => {
                const severityColorMap = {
                  Extreme: '#d75050ff', 
                  Severe: '#FFA726', 
                  Moderate: '#f1e166ff',
                  Minor: '#B0BEC5',  
                };

                const severityColor = severityColorMap[alert.severity] || '#CFD8DC';
                
                return (
                  <View>
                  
                  <TouchableOpacity
                    key={generateAlertKey(alert)}
                    onPress={() => {
                      setshowAlertModal(true);
                      setSelectedAlert(alert);
                    }}>
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
                  </View>
                );
              })}
            </View>
          )}


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
          {!sortingBySeverity && (
            <View>
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
            </View>
            
          )}
          

          {currentAlerts.length > 5 && !sortingBySeverity &&(
            <>
              <Text style={{ padding: 10, color:'#54626F', fontFamily:'times new roman', fontSize:12}}>
                **There are currently {currentAlerts.length} alerts present in the country. Choose specific cities below to narrow the search**:
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
          {filteredStatesForCurrent.length > 0 && !sortingBySeverity(
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
          {filteredAlerts.slice(0,5).map((alert) => {
            // get the severity of the alert to render the box color accordingly
            const severityColor = getAlertColor(alert.severity);
            const alertKey = generateAlertKey(alert);
            return (
            <TouchableOpacity key={alertKey} onPress={() => { setshowAlertModal(true); setSelectedAlert(alert); }}>
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
          { !sortingBySeverity && additionalWeatherData && Object.entries(visibleLocations).map(([locationName, locationData]) => {
            const removedKeys = removedAlertIndex[locationName] || new Set();
            const alertsArray = Array.isArray(locationData.alerts) ? locationData.alerts : [];
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
            // filtered alerts of filtered states
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
                <Text style={styles.subtext}>Temperature: {locationData.current.temp_c}°C</Text>
                <Text style={styles.subtext}>Condition: {locationData.current.condition.text}</Text>

                <Text style={[styles.header, {fontSize:18, padding:5}]}>3-Day Forecast</Text>
                {locationData.forecast.map((day) => (
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
              {visibleAlerts.length > 5 && (
                <>
                  <Text style={{ padding: 10, color:'black', fontFamily:'times new roman', fontSize:12 }}>
                    **There are currently {visibleAlerts.length} alerts present in the country. Choose specific cities below to narrow the search**:
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
          
                {filteredAlerts.slice(0,5).map((alert, index) => {
                  const severityColor = getAlertColor(alert.severity);
                  const alertKey = generateAlertKey(alert);
                  // const alertKey = `${alert.headline}-${alert.effective}-${index}`;
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

                {/* GDACS disasters section arranged from the latest report, desc - 7 day report */}
                {locationData.gdacsDisasters && locationData.gdacsDisasters.length > 0 && (
                  <>
                    <Text style={[styles.header, { fontSize: 18, padding: 5, marginTop: 10 }]}>Recent Disaster Reports</Text>
                    {locationData.gdacsDisasters.slice().sort((a,b) =>new Date(b.pubDate) - new Date(a.pubDate)).map((disaster, index) => (
                      <View key={`${disaster.title}-${index}`} style={styles.disasterBox}>
                        <Text style={{backgroundColor: getReportHeaderColor(disaster.title), fontSize:14,fontWeight: 'bold',color:'#3B444B',
                          fontFamily:'times new roman',
                          marginBottom:10,
                          borderRadius:10,
                          padding:10}}>
                          {disaster.title}
                          </Text>
                        <Text style={{ color:'#3B444B', fontFamily:'times new roman',  marginBottom:10, padding:10 }}>{disaster.description}</Text>
                        <Text style={{ color: 'blue', marginBottom:10}} onPress={() => Linking.openURL(disaster.link)}>More info</Text>
                        <Text style={{ fontStyle: 'italic', fontSize: 12, color: 'gray' }}>{disaster.pubDate}</Text>
                      </View>
                    ))}
                  </>
                )}
                {/**remove location */}
                <TouchableOpacity onPress={() => {setRemoveLocation(locationName); setShowRemovalModal(true)}} style={styles.removeLocationBtn}>
                  <Text style={{ color: 'black', fontWeight: 'bold' }}>Remove Location</Text>
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
                    {/* <Text style={styles.descriptionText}>
                      {typeof selectedAlert?.description === 'string'
                        ? selectedAlert.description
                        : 'No description available.'}
                    </Text> */}
                    <Text style={styles.descriptionText}>{selectedAlert?.description || selectedAlert?.desc}</Text>
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
              <View style={[styles.modalContent]}>
                <Text style={{ fontWeight: 'bold', marginBottom: 10, textAlign:'center', color:'black', fontFamily:'times new roman' }}>Are you sure you want to remove this location from your weather watch??</Text>
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
                {/* {autoComplete.length > 0 && (
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
                )} */}
                <View style={{ padding: 20 }}>
                  <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:10}}>
                      <TouchableOpacity onPress={() =>setShowModal(false)}
                       style={{
                          backgroundColor: '#722fd1ff',
                          padding: 10,
                          borderRadius: 5,
                          alignItems: 'center',
                          marginBottom: 10,
                        }}>
                        <Text style={{ color: 'white', fontFamily:'times new roman' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={addLocation}
                        style={{
                          backgroundColor: '#722fd1ff',
                          padding: 10,
                          borderRadius: 5,
                          alignItems: 'center',
                          marginBottom: 10,
                        }}>
                        <Text style={{ color: 'white', fontFamily:'times new roman' }}>Add</Text>
                      </TouchableOpacity>
                  </View>
                  
                  <ProgressBar progress={progress} color="#6200ee" style={{ height: 8, borderRadius: 4 }} />
                  <Text style={{ marginTop: 5, textAlign: 'center', color:'black' }}>{Math.round(progress * 100)}%</Text>
                 
                </View>
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
    color:'red',
    padding:30,
   
  },
  errMessage:{
    color:'red',
    fontFamily:'times new roman',
    fontSize:17,
    textAlign:'center'
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
    maxHeight: 500,
    
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
    alignSelf:'flex-end',
    marginTop:10
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
  },
  filterSeverityBtn:{
    width:'45%',
    padding:5,
    alignItems:'center',
    borderRadius:14,
    elevation:5,
    margin:5
  },
  crossIcon:{
    color:'blue',
    backgroundColor:'yellow',
    borderWidth:1,
    borderColor:'black',
    borderRadius:10
  },
  disasterBox:{
    borderWidth:1,
    borderRadius:10,
    borderColor:'#CD5C5C',
    padding:10,
    marginBottom:10
  },
  // reportHeader:{
  //   fontSize:1,
  //   fontWeight: 'bold',
  //   color:'#3B444B',
  //   fontFamily:'times new roman',
  //   backgroundColor:'#dadd9893',
  //   marginBottom:10,
  //   borderRadius:10,
  //   padding:10}
});

export default WeatherForecast;
