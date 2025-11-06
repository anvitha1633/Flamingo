import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Button,
    FlatList,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
} from "react-native";
import { db, auth } from "../firebaseConfig";
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc,
    addDoc,
    getDoc,
} from "firebase/firestore";

export default function ReceptionistDashboard({ navigation }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState("");   // ✅ New state
    const [showRebookModal, setShowRebookModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [newTime, setNewTime] = useState("");

    // ✅ Fetch role from Firestore
    useEffect(() => {
        const fetchRole = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                setUserRole(userDoc.data().role);
            }
        };
        fetchRole();
    }, []);

    // Fetch only pending appointments
    useEffect(() => {
        const q = query(collection(db, "appointments"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setAppointments(data);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const receptionistId = auth.currentUser?.uid || "manual";
            await updateDoc(doc(db, "appointments", id), {
                status: newStatus,
                updatedBy: receptionistId,
                updatedAt: new Date(),
            });
            Alert.alert("Success", `Appointment ${newStatus}`);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not update status.");
        }
    };

    const handleDelete = async (id) => {
        Alert.alert("Delete Appointment", "Are you sure?", [
            { text: "Cancel" },
            {
                text: "Delete",
                onPress: async () => await deleteDoc(doc(db, "appointments", id)),
                style: "destructive",
            },
        ]);
    };

    const handleRebook = (appointment) => {
        setSelectedAppointment(appointment);
        setShowRebookModal(true);
    };

    const saveRebook = async () => {
        if (!newTime) {
            Alert.alert("Enter new time");
            return;
        }
        await addDoc(collection(db, "appointments"), {
            ...selectedAppointment,
            customerId: auth.currentUser.uid,
            status: "pending",
            time: newTime,
            createdAt: new Date(),
            rebookedFrom: selectedAppointment.id,
            updatedBy: auth.currentUser?.uid,
        });
        setShowRebookModal(false);
        setNewTime("");
        Alert.alert("Success", "Rebooked!");
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
                Pending Appointments
            </Text>

            {/* ✅ Show Button only for Receptionist */}
            {userRole === "receptionist" && (
                <Button
                    title="Receptionist Special Button"
                    onPress={() => navigation.navigate("YourNextScreen")}
                />
            )}

            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View
                        style={{
                            padding: 15,
                            marginBottom: 15,
                            borderWidth: 1,
                            borderRadius: 10,
                            borderColor: "#ddd",
                            backgroundColor: "#fff",
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: "500" }}>{item.customerName}</Text>
                        <Text style={{ color: "#555" }}>Time: {item.time}</Text>

                        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 10 }}>
                            <Button title="Confirm" onPress={() => handleUpdateStatus(item.id, "confirmed")} />
                            <Button title="Reject" color="orange" onPress={() => handleUpdateStatus(item.id, "cancelled")} />
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 10 }}>
                            <Button title="Rebook" onPress={() => handleRebook(item)} />
                            <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
                        </View>
                    </View>
                )}
            />
        </View>
    );
}
