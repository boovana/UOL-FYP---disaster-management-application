import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView, SectionList, TextInput, TouchableOpacity} from 'react-native';
import * as Location from 'expo-location';
import emergencyContacts from './data/emergencyContacts.json'
import { getName } from 'country-list';
import Footer from './footer'


//api key from geoapi
const GEOAPIFY_API_KEY = '69b184b42bd641398d543f2022d56bb6'; 

const Resources = ({title,category, navigation}) => {
    const [error, setError] = useState('');
    const [hospitals, setHospitals] = useState([]);
    const [foodBanks, setFoodBanks] = useState([]);
    const [shelters, setShelters] = useState([]);

    const [contacts, setContacts] = useState([]);

    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchLoc, setSearchLoc] = useState('')
    const [autoComplete, setAutoComplete] = useState([])
    const [stopSuggestions, setStopSuggestions] = useState(false)
    const [newsArticles, setNewsArticles] = useState([]);
    const [countryName, setCountryName] = useState('');
    const disasterTypes = ['earthquake', 'storm', 'flood', 'forestfire', 'hurricane', 'tsunami', 'pandemic', 'wildfire'];
    const newsAPIKey = '4e9e1b1df0bd43d1af09fa5268b6e45b';

    const[expandSection, setExpandSection] = useState({})

    console.log('successfully navigated to the resources page')

    // fetch user's location
    useEffect(() => {
        async function getCurrentLocation(){
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Permission to access location was denied');
                setLoading(false);
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);

            /// get country code 
            const geo = await Location.reverseGeocodeAsync({latitude: location.coords.latitude,longitude: location.coords.longitude,});
            const countryCode = geo[0]?.isoCountryCode;

            if (countryCode) {
                console.log("Detected country:", countryCode);
                fetchData(location.coords.latitude, location.coords.longitude, countryCode);
            } 
            else {
                setError("Could not determine country.");
                setLoading(false);
            }
        }
        getCurrentLocation();
    }, []);

    // fetch articles based on country/city/disaster
    const fetchArticlesForType = async (type, country) => {
        const query = `${type} ${country}`;
        const encodedQuery = encodeURIComponent(query);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
        const fromISO = fromDate.toISOString().split('T')[0];
        const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&from=${fromISO}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${newsAPIKey}`;

        try {
            const res = await fetch(url);
            const json = await res.json();
            if (json.status === 'ok') {
            // filter articles that contain both words
            const filtered = (json.articles || []).filter(article => {
                const text = `${article.title} ${article.description || ''}`.toLowerCase();
                return text.includes(type.toLowerCase()) && text.includes(country.toLowerCase());
            });
            return filtered;
            } 
            else {
            console.warn('NewsAPI error:', json.message);
            return [];
            }
        } catch (e) {
            console.error('Fetch error:', e);
            return [];
        }
    };

    const fetchAllArticles = async (country) => {
        let allArticles = [];
        for (const type of disasterTypes) {
            const articles = await fetchArticlesForType(type, country);
            allArticles = allArticles.concat(articles);
        }
        // rm duplicates by title
        const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.title, a])).values());
        // format the unique title and arrange by the properties
        const formatted = uniqueArticles.map((article, index) => ({
            properties: {
            address_line1: article.title,
            address_line2: `${article.source.name} - ${new Date(article.publishedAt).toLocaleDateString()}`,
            place_id: `news-${index}`,
            },
        }));

        setNewsArticles(formatted);
    };
   

    //fetch data from the api
    const fetchData = async (latitude,longitude,countryCode) => 
    {
        try{
            const radius = 5000;
            //get hospital data
            const fetchHospitals = await fetch(`https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${longitude},${latitude},${radius}&limit=10&apiKey=${GEOAPIFY_API_KEY}`)
            const hospitalData = await fetchHospitals.json();
            setHospitals(hospitalData.features || []);
            // console.log(hospitalData.features[0])
            
            // get food bank data 
            const fetchFoodBanks = await fetch(`https://api.geoapify.com/v2/places?categories=service.social_facility.food&filter=circle:${longitude},${latitude},${radius}&limit=10&apiKey=${GEOAPIFY_API_KEY}`);
            const foodBankData = await fetchFoodBanks.json();
            setFoodBanks(foodBankData.features || []);

            //fetch shelters
            const fetchShelters = await fetch(`https://api.geoapify.com/v2/places?categories=service.social_facility&filter=circle:${longitude},${latitude},${radius}&limit=10&apiKey=${GEOAPIFY_API_KEY}`);
            const sheltersData = await fetchShelters.json();
            setShelters(sheltersData.features || []);


            // fetch emergency contacts
            const countryName = getName(countryCode);
            if (!countryName) {
                console.warn("Invalid or unsupported country code:", countryCode);
                setError("Could not fetch emergency contacts for this country.");
                setLoading(false);
                return;
            }
            console.log("countryName:", countryName)
            if (countryName && emergencyContacts[countryName]) {
                const countryContacts = emergencyContacts[countryName];
                const formattedContacts = [];

                Object.entries(countryContacts).forEach(([type, number], index) => {
                    if (!type || !number) return;
                    //capitalize and push into array
                    const label = type.charAt(0).toUpperCase() + type.slice(1); 
                    formattedContacts.push({
                        properties: {
                            address_line1: label,
                            address_line2: `Contact: ${number}`,
                            place_id: `${type}-${index}`,
                        }
                    });
                });
                setContacts(formattedContacts)
            }
            await fetchAllArticles(countryName);
            // await fetchDisasterNews(countryCode);

        }
        catch(error){
            setError('Error fetching data.');
            console.error(error);
        }
        setLoading(false)
    };

   
    const sections = [
        { title: 'Nearby Hospitals', data: hospitals || 'none'},
        { title: 'Nearby Food Banks', data: foodBanks },
        { title: 'Nearby Shelters', data: shelters },
        { title: 'Emergency Contacts', data: contacts },
        { title: 'News & Updates', data: newsArticles },
    ];
    // toggle between expansion and compression of secctions
    const toggleSection =(title)=>{
        console.log('pressed on ', title)
        setExpandSection(prev => ({
        ...prev,
        [title]: !prev[title]
    }));
    }

    // autocompletions and suggestions of address
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
        }, 300); // 300ms debounce

        return () => clearTimeout(delayDebounce);
    }, [searchLoc]);

    //fetch suggestions based on users input in the search box
    const fetchSuggestions = async (input) => {
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

    // find the resouces based on the location searched
    const findResourcesForLocationSearched=async()=>{
        if(!searchLoc){
            setError("Please enter a valid location")
            return
        }
        try{
            setLoading(true);
            setAutoComplete([]);
            setStopSuggestions(true);
            setError('');
            // using geoapify geocoding api to convert text input to lat/lng
            const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchLoc)}&apiKey=${GEOAPIFY_API_KEY}`);
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const { lat, lon } = data.features[0].properties;
                const countryCode = data.features[0].properties.country_code?.toUpperCase();
                console.log("Search location coordinates:", lat, lon, "Country:", countryCode);
                await fetchData(lat, lon, countryCode);
            } 
            else {
                setError("Could not find location. Please try a different search.");
                setLoading(false);
            }
        } 
        catch (err) {
            console.error(err);
            setError("Error fetching location data.");
            setLoading(false);
        }
    }
    // show activity indicator if loading
    if (loading){
        return (
        <View style={styles.centeredLoading}>
            <ActivityIndicator size="large" />
            <Text>{searchLoc ? "Searching..." : "Loading resources..."}</Text>
        </View>
        );
    }

    return (
        <View style={styles.container}>
            {/**search bar */}
            <View>
                <Text style={{ padding: 10, fontSize:15, fontStyle:'italic', color:'black', fontFamily:'times new roman'}}>Looking for location specific resources?</Text>
                <TextInput
                style={styles.searchLocationInput}
                onChangeText={setSearchLoc}
                value={searchLoc}
                placeholder="Enter Zipcode/Postal code/City name"
                placeholderTextColor="#999"
                />
                <Text style={styles.error} >{error}</Text>
                <TouchableOpacity onPress={findResourcesForLocationSearched} style={styles.findResourcesBtn}>
                    <Text style={{fontFamily:'times new roman', color:'black'}}>Find</Text>
                </TouchableOpacity>

                {autoComplete.length > 0 && (
                    <View style={{ backgroundColor: '#FAF9F6', borderRadius: 14, elevation: 5 }}>
                        {autoComplete.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={async () => {
                                const { lat, lon, country_code, formatted } = item.properties || {};
                                if (lat && lon && country_code) {
                                    setStopSuggestions(true)
                                    setSearchLoc(formatted);
                                    setAutoComplete([]);
                                    setLoading(true);
                                    await fetchData(lat, lon, country_code.toUpperCase());
                                }
                                }}
                                style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ddd' }}
                            >
                                <Text>{item.properties.formatted}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

            </View>
            
            {/**render contacts and addresses */}
            <SectionList
                contentContainerStyle={{ paddingBottom: 100 }}
                sections={sections}
                keyExtractor={(item, index) => item?.properties?.place_id ?? index.toString()}
                renderSectionHeader={({ section: { title } }) => ( 
                    <TouchableOpacity onPress={() => toggleSection(title)} style={styles.sectionHeader}>
                        <Text style={{fontFamily:'times new roman', fontSize:18, fontWeight:'bold', color:'#3B444B'}}>{title}</Text>
                        <Text style={[styles.title,{ color: 'black', alignSelf:'center'}]}>{expandSection[title] ?'-':'+'}</Text>
                    </TouchableOpacity>
                )}
                renderItem={({ item, section}) => {
                    if (!expandSection[section.title]) return null; 

                    const props = item.properties;
                    return (
                        <View style={styles.resourceItem}>
                            <Text style={styles.name}>{props.address_line1 || 'Unnamed'}</Text>
                            <Text style={{fontFamily:'times new roman', color:'grey'}}>{props.address_line2 || ''}</Text>
                        </View>
                    );
                }}
            />
            
            <Footer navigation={navigation} />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex:1,
        padding: 16,
        paddingBottom:100,
        backgroundColor:'white'
    },
    title: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 10,

    },
    resourceItem: { 
        marginTop:10,
        marginBottom: 10, 
        padding: 20, 
        backgroundColor:'#faf5ef',
        // backgroundColor: '#F5ECCF', 
        borderWidth:1,
        borderColor:'#B2BEB5',
        borderRadius: 8,
        elevation:2,
       
    },
    name: { 
        fontSize:16,
        fontWeight: 'bold',
        fontFamily:'times new roman',
        marginBottom:10,
        color:'grey'
    },
    error: { 
        color: 'red',
        padding:10,
        fontStyle:'italic'
    },
    centeredLoading: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        color:'black',
        fontFamily:'times new roman'
    },
    searchLocationInput:{
        borderRadius:10,
        borderWidth:1,
        borderColor:'#9DC183',
        color:'black',
        padding:10,
        fontFamily:'times new roman'
    },
    findResourcesBtn:{
        backgroundColor:'#9DC183',
        marginTop:5,
        marginBottom:10,
        padding:5,
        width:'30%',
        alignItems:'center',
        alignSelf:'flex-end',
        borderRadius:14,
    },
    sectionHeader:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginTop:20,
        padding:15,
        backgroundColor:'#F5ECCF',
        borderRadius:10,
        alignItems:'center'
    }

});


export default Resources;