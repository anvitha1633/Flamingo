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
    const [userRole, setUserRole] = useState("");
    const [showRebookModal, setShowRebookModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [newTime, setNewTime] = useState("");

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

    // ✅ Fetch ALL bookings, not only "pending"
    useEffect(() => {
        const q = query(collection(db, "bookings"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAppointments(data);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, "bookings", id), {
                status,
                updatedBy: auth.currentUser.uid,
                updatedAt: new Date(),
            });
            Alert.alert("Updated!", `Status: ${status}`);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "bookings", id));
            // ✅ No need to manually update list — onSnapshot auto refreshes UI ✅
            Alert.alert("Deleted Successfully");
        } catch (err) {
            Alert.alert("Error deleting", err.message);
        }
    };

    const handleRebook = (appointment) => {
        setSelectedAppointment(appointment);
        setShowRebookModal(true);
    };

    const saveRebook = async () => {
        if (!newTime) return Alert.alert("Enter new time");

        await addDoc(collection(db, "bookings"), {
            ...selectedAppointment,
            status: "pending",
            appointmentTime: newTime,
            createdAt: new Date(),
            rebookedFrom: selectedAppointment.id,
        });

        setShowRebookModal(false);
        setNewTime("");
        Alert.alert("Rebooked!");
    };

    if (loading) return <ActivityIndicator size="large" />;

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
                Pending Appointments
            </Text>

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
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: "500" }}>
                            {item.customerName}
                        </Text>
                        <Text>{item.serviceType}</Text>
                        <Text>{item.appointmentDate} - {item.appointmentTime}</Text>
                        <Text style={{ fontSize: 16, fontWeight: "500" }}>
                            {item.customerEmail}
                        </Text>

                        <Text style={{ color: item.status === "confirmed" ? "green" : item.status === "cancelled" ? "red" : "orange" }}>
                            Status: {item.status}
                        </Text>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                            <Button title="Confirm" onPress={() => handleUpdateStatus(item.id, "confirmed")} />
                            <Button title="Reject" color="orange" onPress={() => handleUpdateStatus(item.id, "cancelled")} />
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                            <Button title="Rebook" onPress={() => handleRebook(item)} />
                            <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
                        </View>
                    </View>
                )}
            />

            {/* ✅ Rebook Modal */}
            <Modal visible={showRebookModal} transparent>
                <View style={{ flex: 1, backgroundColor: "#00000099", justifyContent: "center" }}>
                    <View style={{ backgroundColor: "#fff", padding: 20, margin: 20, borderRadius: 10 }}>
                        <Text>Enter New Time:</Text>
                        <TextInput
                            placeholder="e.g. 04:00 PM"
                            value={newTime}
                            onChangeText={setNewTime}
                            style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
                        />
                        <Button title="Save" onPress={saveRebook} />
                        <Button title="Cancel" onPress={() => setShowRebookModal(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
