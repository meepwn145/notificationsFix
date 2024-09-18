import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from './config/firebase';
import { Button } from 'react-native-elements';

export default function Notifications() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [resStatusLogs, setResStatusLogs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const toggleSelection = (id) => {
    setSelectedId(selectedId === id ? null : id); // Toggle selection
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User:', user); // Add this line
        const userID = user.name;

        // Construct the query for all resStatus logs for the user
        const q = query(collection(db, 'resStatus'), where('userName', '==', userID), orderBy('timestamp', 'desc'));

        const unsubscribeLogs = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const logs = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                managementName: data.managementName,
                paymentStatus: data.paymentStatus,
                timestamp: data.timestamp,
                timeIn: data.timeIn,
                timeOut: data.timeOut,
                slotId: data.slotId,
                carPlateNumber: data.carPlateNumber,
                floorTitle: data.floorTitle,
                resStatus: data.resStatus,
                status: data.status,
                userName: data.userName,
              };
            });
            setResStatusLogs(logs);
          } else {
            setResStatusLogs([]);
          }
          setLoading(false);
        }, (err) => {
          console.error(`Encountered error: ${err}`);
          setLoading(false);
        });

        return () => unsubscribeLogs();
      } else {
        console.error('User is not authenticated.');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  const formatDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return 'N/A';

    const start = new Date(timeIn.seconds * 1000);
    const end = new Date(timeOut.seconds * 1000);
    const duration = end - start;

    // Convert milliseconds to minutes
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  };

  const deleteNotification = async (id) => {
    try {
      // Delete the notification from the database
      await deleteDoc(doc(db, 'resStatus', id));
      console.log('Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <ScrollView style={styles.backgroundColorMain}>
      <View style={styles.container}>
       <Image
      source={{ uri: 'https://i.imgur.com/WwPGlNh.png' }}
      style={styles.backgroundImage}
    />
    <Image
    source={{ uri: 'https://i.imgur.com/Tap1nZy.png' }}
      style={[styles.backgroundImage, {marginTop: 100}]}
    />
    <Text style={{marginTop: 6, textAlign: 'center', fontSize: 50, fontWeight: 'bold', color: 'white', marginVertical: 10}}>Notification</Text>
    <View style={styles.formContainer}></View>

   
      <View style={styles.content}>
        {parkingLogs.length > 0 ? (
          parkingLogs.map((log) => (
            <TouchableOpacity
              key={log.id}
              style={styles.notification}
              onPress={() => toggleSelection(log.id)}
            >
              <Text style={styles.notificationHeader1}>
                Parked at: {log.managementName}
              </Text>
              <Text style={styles.notificationText}>
                Payment Status: {log.paymentStatus}
              </Text>
              <Text style={styles.notificationText}>
                Duration: {formatDuration(log.timeIn, log.timeOut)}
              </Text>
              <Text style={styles.notificationDate}>
                Date: {new Date(log.timestamp.seconds * 1000).toLocaleDateString()} 
                {'\ '} {log.timeIn ? new Date(log.timeIn.seconds * 1000).toLocaleTimeString() : 'N/A'} {'\ '}
                {log.timeOut ? new Date(log.timeOut.seconds * 1000).toLocaleTimeString() : 'N/A'}
              </Text>
              {selectedId === log.id && (
                <TouchableOpacity
                  onPress={() => deleteNotification(log.id)}
                  style={styles.deleteButton}
                >
                    <Image 
                  source={{ uri: 'https://i.imgur.com/92JPGbX.png' }}
                      style={styles.deleteButtonImage}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.notificationText, { textAlign: 'center' }]}>No new reservation notification</Text>
          )}
        </View>

        <View>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.buttonBack}>
            <Text style={styles.buttonTextBack}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backgroundColorMain: {
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  navbarTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center',
  },
  notification: {
    marginTop: '15%',
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    width: '90%',
    alignItems: 'center', // Center horizontally
    backgroundColor: '#fff', // or any other color for non-clicked notification
  },
  notificationHeader1: {
    fontSize: 16,
    padding: 10,
    fontWeight: 'bold',
  },
  notificationText: {
    fontSize: 16,
    padding: 10,
  },
  notificationTextHeader: {
    fontSize: 16,
    padding: 10,
    textAlign: 'center',
  },
  notificationDate: {
    fontSize: 14,
    padding: 10,
    color: 'gray',
  },
  buttonBack: {
    borderColor: '#87CEEB',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 2,
    marginTop: '70%', // Adjusted marginTop
    marginBottom: 30, // Adjusted marginBottom
    width: '90%',
    alignSelf: 'center',
  },
  buttonTextBack: {
    color: '#87CEEB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationClicked: {
    backgroundColor: 'gray',
  },
  deleteButton: {
    position: 'absolute',
    top: 120,
    right: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  deleteButtonImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
