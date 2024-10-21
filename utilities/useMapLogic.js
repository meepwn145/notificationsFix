import { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy, startAt, endAt } from "firebase/firestore";
import { Dimensions } from "react-native";
import * as geofire from "geofire-common";
import * as Location from "expo-location";
import { LocationStore } from "../store";
import { db } from "../config/firebase";
import { AnimatedRegion } from "react-native-maps"; // Ensure this is imported if used

const screen = Dimensions.get("window");
const LATITUDE_DELTA = 0.03;
const ASPECT_RATIO = screen.width / screen.height;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export const useMapLogic = () => {
    const [recommendedPlaces, setRecommendedPlaces] = useState([]);

    useEffect(() => {
        const fetchNearbyEstablishments = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error("Location permission not granted");
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const center = [latitude, longitude];
            const radiusInM = 5 * 1000; // 5 kilometers

            const bounds = geofire.geohashQueryBounds(center, radiusInM);
            const promises = bounds.map((b) => {
                const q = query(collection(db, "establishments"), orderBy("geohash"), startAt(b[0]), endAt(b[1]));
                return getDocs(q);
            });

            try {
                const snapshots = await Promise.all(promises);
                let matchingDocs = [];

                for (const snap of snapshots) {
                    for (const doc of snap.docs) {
                        const establishment = doc.data();
                        const lat = establishment.coordinates.lat;
                        const lng = establishment.coordinates.lng;
                        // Calculate actual distance to filter out edge cases
                        const distanceInKm = geofire.distanceBetween([lat, lng], center);
                        const distanceInM = distanceInKm * 1000;
                        if (distanceInM <= radiusInM) {
                            matchingDocs.push({ ...establishment, id: doc.id });
                        }
                    }
                }

                // Sort by distance
                matchingDocs.sort((a, b) => a.distance - b.distance);
                setRecommendedPlaces(matchingDocs);
                console.log("Recommended Places:", matchingDocs);
            } catch (error) {
                console.error("Error fetching nearby establishments:", error);
            }
        };

        fetchNearbyEstablishments();
    }, []);

    return {
        recommendedPlaces
    };
};
