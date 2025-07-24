const functions = require('firebase-functions/v1');
const admin = require("firebase-admin");
const { region } = require('firebase-functions/v1');

admin.initializeApp();
const db = admin.firestore();

exports.userDeleted = functions.auth.user().onDelete(async (user) => {
    region('northamerica-northeast1');
    const reason = 'deleted';
    return UserDeleted(user, reason, false);
});




async function UserDeleted(user, reason, isActive) {
    try {
        console.log(`User ${isActive ? 'enabled' : 'disabled/deleted'}:`, user.uid);
        await db.collection("userStatus").doc(user.uid).set({
            active: isActive,
            reason: reason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return null;
    } catch (error) {
        console.error("Error updating user status:", error);
        return null;
    }
}