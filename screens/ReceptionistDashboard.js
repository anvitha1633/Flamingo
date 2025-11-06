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
} from "firebase/firestore";

export default function ReceptionistDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRebookModal, setShowRebookModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [newTime, setNewTime] = useState("");

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

    // Confirm or reject appointment
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

    // Delete appointment
    const handleDelete = async (id) => {
        Alert.alert("Delete Appointment", "Are you sure you want to delete this booking?", [
            { text: "Cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, "appointments", id));
                        Alert.alert("Deleted", "Appointment removed.");
                    } catch (error) {
                        console.error(error);
                        Alert.alert("Error", "Could not delete appointment.");
                    }
                },
            },
        ]);
    };

    // Open rebook modal
    const handleRebook = (appointment) => {
        setSelectedAppointment(appointment);
        setShowRebookModal(true);
    };

    // Save new rebooked appointment
    const saveRebook = async () => {
        if (!newTime) {
            Alert.alert("Please enter new time");
            return;
        }
        try {
            const receptionistId = auth.currentUser?.uid || "manual";
            await addDoc(collection(db, "appointments"), {
                ...selectedAppointment,
                status: "pending",
                time: newTime,
                createdAt: new Date(),
                rebookedFrom: selectedAppointment.id,
                updatedBy: receptionistId,
            });
            setShowRebookModal(false);
            setNewTime("");
            Alert.alert("Success", "Appointment rebooked!");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not rebook.");
        }
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Pending Appointments</Text>
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
                            <Button
                                title="Confirm"
                                color="green"
                                onPress={() => handleUpdateStatus(item.id, "confirmed")}
                            />
                            <Button
                                title="Reject"
                                color="orange"
                                onPress={() => handleUpdateStatus(item.id, "cancelled")}
                            />
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 10 }}>
                            <Button title="Rebook" onPress={() => handleRebook(item)} />
                            <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
                        </View>
                    </View>
                )}
            />

            {/* Rebook Modal */}
            <Modal visible={showRebookModal} animationType="slide" transparent={true}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            padding: 20,
                            borderRadius: 10,
                            width: "85%",
                        }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                            Rebook Appointment
                        </Text>
                        <TextInput
                            placeholder="Enter new time (e.g., 2025-11-07T14:00)"
                            value={newTime}
                            onChangeText={setNewTime}
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                padding: 10,
                                borderRadius: 5,
                                marginBottom: 10,
                            }}
                        />
                        <Button title="Save" onPress={saveRebook} />
                        <View style={{ marginTop: 10 }}>
                            <Button title="Cancel" color="red" onPress={() => setShowRebookModal(false)} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}