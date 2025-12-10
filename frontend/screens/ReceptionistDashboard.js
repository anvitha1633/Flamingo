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
    onSnapshot,
    updateDoc,
    doc,
    setDoc,
    deleteDoc,
    addDoc,
    getDoc,
} from "firebase/firestore";

export default function ReceptionistDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState("");
    const [showRebookModal, setShowRebookModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [newTime, setNewTime] = useState("");

    // Fetch user role
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        getDoc(doc(db, "users", user.uid)).then((snap) => {
            if (snap.exists()) setUserRole(snap.data().role);
        });
    }, []);

    // Live bookings
    useEffect(() => {
        const q = query(collection(db, "bookings"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results = snapshot.docs
                .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
                .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

            setAppointments(results);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Update status only
    const handleUpdateStatus = async (appointment, newStatus) => {
        try {
            const id = appointment.id;
            if (!id) return Alert.alert("❌ Missing document ID");

            await updateDoc(doc(db, "bookings", id), { status: newStatus });

            setAppointments(prev =>
                prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
            );

            Alert.alert("✅ Status updated", `Booking status changed to ${newStatus}`);
        } catch (error) {
            Alert.alert("❌ Error", error.message);
        }
    };

    // Move booking to WrongBooking
    const handleDeleteBooking = async (appointment) => {
        try {
            const id = appointment.id;
            if (!id) return Alert.alert("❌ Missing document ID");

            await addDoc(collection(db, "WrongBooking"), {
                ...appointment,
                movedAt: new Date(),
                movedBy: auth.currentUser.uid,
                originalBookingId: id,
            });

            await deleteDoc(doc(db, "bookings", id));

            setAppointments(prev => prev.filter(item => item.id !== id));

            Alert.alert("✅ Booking deleted", "Moved to WrongBooking collection");
        } catch (error) {
            Alert.alert("❌ Error deleting booking", error.message);
        }
    };

    // Complete booking
    const handleComplete = async (appointment) => {
        try {
            const id = appointment?.id;
            if (!id) return Alert.alert("❌ Missing document ID");

            if (appointment.status !== "confirmed") {
                return Alert.alert("Only confirmed bookings can be completed.");
            }

            await setDoc(doc(db, "archived", id), { ...appointment, completedAt: new Date() });
            await deleteDoc(doc(db, "bookings", id));

            Alert.alert("✔️ Completed", "Booking moved to archive.");
        } catch (e) {
            Alert.alert("❌ Error completing booking");
        }
    };

    // Rebook booking
    const handleRebook = (appt) => {
        setSelectedAppointment(appt);
        setShowRebookModal(true);
    };

    const saveRebook = async () => {
        if (!newTime) return Alert.alert("Enter New Time");

        const { id, ...rest } = selectedAppointment;

        await addDoc(collection(db, "bookings"), {
            ...rest,
            appointmentTime: newTime,
            status: "pending",
            createdAt: new Date(),
            rebookedFrom: id,
        });

        setShowRebookModal(false);
        setNewTime("");
        Alert.alert("✅ Rebooked Successfully");
    };

    // Status badge component
    const StatusBadge = ({ status }) => (
        <Text
            style={{
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 6,
                fontSize: 12,
                alignSelf: "flex-start",
                backgroundColor:
                    status === "pending"
                        ? "#FFD966"
                        : status === "confirmed"
                            ? "#91E57D"
                            : "#FF8A8A",
                color: "#000",
                marginTop: 4,
            }}
        >
            {status.toUpperCase()}
        </Text>
    );

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

    return (
        <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold" }}>Pending Bookings</Text>

            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View
                        style={{
                            padding: 16,
                            backgroundColor: "#fff",
                            borderRadius: 10,
                            marginBottom: 14,
                            borderWidth: 0.6,
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: "600" }}>
                            {item.customerEmail || "No Email"}
                        </Text>

                        <StatusBadge status={item.status} />

                        <Text style={{ marginTop: 4, color: "#555" }}>{item.serviceType}</Text>
                        <Text style={{ color: "#666" }}>
                            {item.appointmentDate} – {item.appointmentTime}
                        </Text>

                        {userRole === "receptionist" && (
                            <>
                                {/* Row 1: Status */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        marginTop: 10,
                                    }}
                                >
                                    <Button
                                        title="Confirm ✅"
                                        onPress={() => handleUpdateStatus(item, "confirmed")}
                                    />
                                    <Button
                                        title="Reject ❌"
                                        color="red"
                                        onPress={() => handleUpdateStatus(item, "cancelled")}
                                    />
                                </View>

                                {/* Row 2: Actions */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        marginTop: 8,
                                    }}
                                >
                                    <Button
                                        title="Rebook 🔁"
                                        color="black"
                                        onPress={() => handleRebook(item)}
                                    />
                                    <Button
                                        title="Complete 🗑️"
                                        color="green"
                                        onPress={() => handleComplete(item)}
                                    />
                                    <Button
                                        title="Delete ❌"
                                        color="red"
                                        onPress={() => handleDeleteBooking(item)}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                )}
            />

            {/* Rebook Modal */}
            <Modal visible={showRebookModal} transparent animationType="fade">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "#00000088",
                        justifyContent: "center",
                        padding: 20,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            padding: 20,
                            borderRadius: 10,
                        }}
                    >
                        <Text>Enter New Time:</Text>
                        <TextInput
                            placeholder="e.g. 4:00 PM"
                            value={newTime}
                            onChangeText={setNewTime}
                            style={{
                                borderWidth: 1,
                                borderRadius: 8,
                                marginTop: 10,
                                padding: 10,
                            }}
                        />
                        <View style={{ marginTop: 10 }}>
                            <Button title="Save" onPress={saveRebook} disabled={!newTime} />
                        </View>
                        <View style={{ marginTop: 10 }}>
                            <Button
                                title="Cancel"
                                color="gray"
                                onPress={() => setShowRebookModal(false)}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
