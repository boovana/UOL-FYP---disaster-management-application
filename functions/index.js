
// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");


// const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
// const { initializeApp } = require('firebase-admin/app');
// const { getFirestore } = require('firebase-admin/firestore');
// const fetch = require('node-fetch');

// initializeApp();
// const db = getFirestore();

// exports.sendAlertNotifications = onDocumentUpdated('locations/{userID}', async (event) => {
//   const beforeData = event.data.before.data();
//   const afterData = event.data.after.data();

//   const flattenAlerts = (locations) => {
//     let allAlerts = [];
//     Object.values(locations).forEach(cityData => {
//       if (cityData?.alerts && Array.isArray(cityData.alerts)) {
//         allAlerts = allAlerts.concat(cityData.alerts);
//       }
//     });
//     return allAlerts;
//   };

//   const beforeAllAlerts = flattenAlerts(beforeData?.data || {});
//   const afterAllAlerts = flattenAlerts(afterData?.data || {});

//   // get new alerts keys set
//   const getKeysSet = (alerts) => new Set(alerts.map(a => `${a.headline}-${a.event}-${a.expires}`));
//   const beforeKeys = getKeysSet(beforeAllAlerts);
//   const newAlerts = afterAllAlerts.filter(a => !beforeKeys.has(`${a.headline}-${a.event}-${a.expires}`));

//   // if no new alerts
//   if (newAlerts.length === 0) {
//     console.log("No new alerts detected.");
//     return;
//   }

//   const userID = event.params.userID;
//   const userDoc = await db.collection('users').doc(userID).get();
//   if (!userDoc.exists) {
//     console.log("No user doc found for", userID);
//     return;
//   }

//   const expoPushToken = userDoc.data()?.expoPushToken;
//   if (!expoPushToken) {
//     console.log("No Expo push token found for user", userID);
//     return;
//   }

//   // notification messages
//   const messages = [];
//   /// if there are more than 5 alerts show 1 messgae to prevent overloading
//   if (newAlerts.length > 5) {
//     messages.push({
//       to: expoPushToken,
//       sound: 'default',
//       title: `⚠️ Alerts for your locations`,
//       body: `There are currently ${newAlerts.length} new alerts.`,
//       data: { alertsCount: newAlerts.length },
//     });
//   } 
//   // else show each individual alert
//   else {
//     newAlerts.forEach(alert => {
//       messages.push({
//         to: expoPushToken,
//         sound: 'default',
//         title: `⚠️ Alert`,
//         body: alert.headline || "New alert available.",
//         data: { alert },
//       });
//     });
//   }

//   // send notifications in bulk
//   const chunkSize = 20;
//   const chunks = [];
//   for (let i = 0; i < messages.length; i += chunkSize) {
//     chunks.push(messages.slice(i, i + chunkSize));
//   }

//   const sendNotifications = async (chunk) => {
//     const response = await fetch('https://exp.host/--/api/v2/push/send', {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json',
//         'Accept-encoding': 'gzip, deflate',
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(chunk),
//     });
//     const data = await response.json();
//     console.log('Push notification response:', data);
//     return data;
//   };

//   for (const chunk of chunks) {
//     await sendNotifications(chunk);
//   }
// });
