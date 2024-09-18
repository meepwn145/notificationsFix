import React, { useState, useRef, useEffect, useContext } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, FlatList } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import UserContext from "./UserContext";
import { LocationStore } from "./store";
import * as Location from "expo-location";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./config/firebase";

export default function Dashboard() {
    const navigation = useNavigation();
    const { user } = useContext(UserContext);

    const goToProfile = () => {
        navigation.navigate("Profiles", { user });
    };

    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [recommended, setRecommended] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const [reservationConfirmed, setReservationConfirmed] = useState(false); // Track reservation status

    const carouselImages = [
        { image: { uri: 'https://www.saifulbouquet.com/wp-content/uploads/2020/04/featured-DSC00889.jpg' }, text: "Oakridge Parking Lot" },
        { image:  { uri: 'https://media-cdn.tripadvisor.com/media/photo-s/10/08/e5/a6/mall-exterior.jpg' }, text: "Country Mall" },
        { image:  { uri: 'https://static-ph.lamudi.com/static/media/bm9uZS9ub25l/2x2x5x880x396/b82c78f8faadef.jpg' }, text: "Crossroads Carpark" },
        { image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfMENYcdscVVk9zQdRBXEnelebDd04UbZ9KW36V9wwLw&s' }, text: "Banilad Town Centre" },
        { image:  { uri: 'https://i.pinimg.com/736x/5d/e2/c5/5de2c5ef0e446ddb39f0d090dcf2c033.jpg' }, text: "Pacific Mall" },
    ];

    useEffect(() => {
        const fetchRecommended = async () => {
            const promises = [];

            for (const c of carouselImages) {
                const q = query(collection(db, "establishments"), where("managementName", "==", c.text));
                promises.push(getDocs(q));
            }

            const snapshots = await Promise.all(promises);
            const recommendations = [];
            for (const snap of snapshots) {
                for (const doc of snap.docs) {
                    const establishment = doc.data();
                    recommendations.push({
                        id: doc.id,
                        ...establishment,
                    });
                }
            }
            setRecommended(recommendations);
        };

        fetchRecommended();
    }, []);

    useEffect(() => {
        if (reservationConfirmed) {
            setIsActive(true);
        }
    }, [reservationConfirmed]);

    const handleCarouselCard = (text) => {
        setSidebarVisible(false);
        for (const r of recommended) {
            if (text === r.managementName) {
                navigation.navigate("Map", { from: r });
            }
        }
    };

    const handleCardClick = (screenName) => {
        setSidebarVisible(false);
        navigation.navigate(screenName);
    };

    const handleBarsClick = () => {
        setSidebarVisible(!isSidebarVisible);
    };

    const flatListRef = useRef(null);
    const scrollInterval = useRef(null);

    useEffect(() => {
        scrollInterval.current = setInterval(() => {
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                    index: (currentIndex + 1) % carouselImages.length,
                    animated: true,
                });
            }
        }, 2000);

        return () => clearInterval(scrollInterval.current);
    }, []);

    const handleViewRecentParked = () => {
        navigation.navigate("Map");
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            currentIndex = viewableItems[0].index;
        }
    }).current;

    let currentIndex = 0;

    useEffect(() => {
        const getCurrentLoc = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.log("Please grant location permissions");
                return;
            }

            let currentLocation;

            while (!currentLocation) {
                currentLocation = await Location.getCurrentPositionAsync({});
                if (!currentLocation) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            if (currentLocation) {
                updateLoc(currentLocation);
            }
        };

        const updateLoc = async (location) => {
            if (location) {
                LocationStore.update((store) => {
                    store.lat = location.coords.latitude;
                    store.lng = location.coords.longitude;
                });
            } else {
                console.log("Location update failed!");
            }
        };

        getCurrentLoc();
    }, []);

    const renderCarouselItem = ({ item }) => {
        return (
            <TouchableOpacity onPress={() => handleCarouselCard(item.text)}>
                <View style={styles.carouselItemContainer}>
                    <Image source={item.image} style={styles.carouselImage} />
                    <Text style={styles.carouselText}>{item.text}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderParkedHistoryItem = ({ item }) => {
        return (
            <View style={styles.historyItemContainer}>
                <Image source={item} style={styles.historyItemImage} />
            </View>
        );
    };

    const renderParkedItem = ({ item }) => {
        return (
            <View style={styles.parkedItemContainer}>
                <Image source={item} style={styles.parkedItemImage} />
            </View>
        );
    };

    const handleReservationStatusClick = () => {
        if (isActive) {
            navigation.navigate("Map");
        }
    };

    return (
        <View style={styles.container}>
            <Image source={{ uri: 'https://i.imgur.com/Y6azwpB.png' }} style={styles.backgroundImage} />

            <View style={styles.container}>
                <Image style={styles.navbar} />
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Explore more available Parking Lots</Text>
                    <Text style={styles.logoSubText}>Find and Reserve Parking Spaces</Text>
                </View>
                <View style={styles.container}>
                    <View>
                        <FlatList
                            ref={flatListRef}
                            data={carouselImages}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderCarouselItem}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={{
                                itemVisiblePercentThreshold: 50,
                            }}
                        />
                    </View>
                    
                    <View style={{ maxWidth: 400, marginBottom: 20 }}>
                        <View >
                        <View style={{ justifyContent: 'center', alignItems: 'center'}}>
                            <View style={styles.additionalCard}>
                                <Text style={styles.additionalCardTitle}>Explore</Text>
                                <Text style={styles.additionalCardContent}>More parking areas are available here!!</Text>
                                <TouchableOpacity style={styles.additionalButton} onPress={() => navigation.navigate("Map")}>
                                <Text style={styles.additionalButtonText}>Explore</Text>
                                </TouchableOpacity>
                            </View>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.reservationStatusContainer, isActive ? styles.active : styles.inactive]}
                        onPress={handleReservationStatusClick}
                        disabled={!isActive}
                    >
                        <Text style={styles.reservationStatusText}>
                            Reservation Status: {isActive ? "Active" : "Inactive"}
                        </Text>
                    </TouchableOpacity>
                </View>
           
                <View style={styles.tabBarContainer}>
                    <View style={[styles.tabBar, { opacity: 0.8 }]}>
                        <TouchableOpacity style={styles.tabBarButton} onPress={goToProfile}>
                            <AntDesign name="user" size={24} color="#A08C5B" />
                            <Text style={styles.tabBarText}>Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.tabBarButton} onPress={() => handleCardClick("Search")}>
                            <AntDesign name="earth" size={24} color="#A08C5B" />
                            <Text style={styles.tabBarText}>Search</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.tabBarButton} onPress={() => handleCardClick("Notifications")}>
                            <AntDesign name="bells" size={24} color="#A08C5B" />
                            <Text style={styles.tabBarText}>Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.tabBarButton} onPress={handleBarsClick}>
                            <AntDesign name="bars" size={24} color="#A08C5B" />
                            <Text style={styles.tabBarText}>Menu</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Modal animationType="fade" transparent={true} visible={isSidebarVisible}>
                    <View style={styles.sidebarContainer}>
                        <TouchableWithoutFeedback onPress={handleBarsClick}>
                            <View style={styles.sidebar}>
                                <TouchableOpacity style={styles.sidebarButton} onPress={() => handleCardClick("Feedback")}>
                                    <Image source={{ uri: 'https://i.imgur.com/c4io4vB.jpeg' }} style={styles.sidebarIcon} />
                                    <Text style={styles.sidebarButtonText}>Feedback</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarButton} onPress={() => handleCardClick("Transaction")}>
                                    <Image source={{ uri: 'https://i.imgur.com/MeRPAqt.png' }} style={styles.sidebarIcon} />
                                    <Text style={styles.sidebarButtonText}>Transaction</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarButton} onPress={() => handleCardClick("Park")}>
                                    <Image source={{ uri: 'https://i.imgur.com/vetauvM.png' }} style={styles.sidebarIcon} />
                                    <Text style={styles.sidebarButtonText}>Parking</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarButton} onPress={() => handleCardClick("Start")}>
                                    <Image source={{ uri: 'https://i.imgur.com/YzzzEXD.png' }} style={styles.sidebarIcon} />
                                    <Text style={styles.sidebarButtonText}>Log Out</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </Modal>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cardContainer: {
        marginHorizontal: 10,
        marginTop: 20,
        borderRadius: 10,
        overflow: "hidden",
        elevation: 5,
        backgroundColor: "white",
    },
    formContainer: {
        padding: 40,
        marginTop: "20%",
        fontFamily: "Courier New",
    },
    navbar: {
        width: "100%",
        height: "7%",
        resizeMode: "contain",
        marginBottom: 15,
        marginTop: 40,
    },
    logoContainer: {
        alignItems: "center",
    },
    logoText: {
        fontSize: 30,
        fontWeight: "bold",
        color: "white",
        marginBottom: 50,
    },
    logoSubText: {
        fontSize: 12,
        color: "#f5f5f5",
        marginTop: -30,
        marginBottom: 10,
        fontWeight: "bold",
    },
    carouselContainer: {
        height: 200,
    },
    carouselItemContainer: {
        width: 360,
        height: 200,
        borderRadius: 20,
        overflow: "hidden",
        marginHorizontal: 10,
        elevation: 5,
        borderWidth: 2,
        borderColor: "#FFD700",
        position: "relative",
        backgroundColor: "white",
    },
    carouselImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    carouselText: {
        position: "absolute",
        bottom: 10,
        left: 10,
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 5,
        zIndex: 1,
    },
    tabBarContainer: {
        marginTop: "60%",
    },
    tabBar: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 10,
        paddingVertical: 10,
        elevation: 3,
    },
    tabBarButton: {
        alignItems: "center",
    },
    tabBarText: {
        color: "#A08C5B",
        marginTop: 5,
    },
    sidebarContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sidebar: {
        width: "80%",
        backgroundColor: "white",
        padding: 25,
        borderRadius: 10,
    },
    sidebarButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    sidebarIcon: {
        width: 24,
        height: 24,
        resizeMode: "contain",
        marginRight: 10,
    },
    sidebarButtonText: {
        fontSize: 16,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    parkedHistoryContainer: {
        overflow: "hidden",
        marginHorizontal: 10,
        position: "relative",
        marginTop: 20,
    },
    historyItemImage: {
        width: 150,
        height: 100,
        resizeMode: "cover",
        borderRadius: 10,
    },
    card: {
        width: '90%',
        maxWidth: 400,
        height: '230%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        backgroundColor: "white",
        opacity: 0.8,
        padding: "6%",
        borderRadius: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#888",
    },
    button: {
        marginTop: 13.4,
        backgroundColor: "#FFD700",
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: "white",
        textAlign: "center",
    },
    additionalCard: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        marginTop: 10,
    },
    additionalCardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    additionalCardContent: {
        fontSize: 16,
        marginBottom: 20,
    },
    additionalButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
    },
    additionalButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    reservationStatusContainer: {
        padding: 10,
        borderRadius: 20,
        marginBottom: 50,
        alignSelf: 'center',
        width: '90%',
        borderWidth: 1,
        borderColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reservationStatusText: {
        fontSize: 16,
    },
    active: {
        backgroundColor: "#39e75f",
    },
    inactive: {
        backgroundColor: "gray",
    },
});
