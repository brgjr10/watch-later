import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const addWatchlistItem = async (uid, item) => {
  const ref = doc(db, "users", uid, "watchlist", String(item.tmdbId));
  await setDoc(ref, {
    ...item,
    watched: false,
    addedAt: Date.now(),
  });
};

export const removeWatchlistItem = async (uid, itemId) => {
  const ref = doc(db, "users", uid, "watchlist", String(itemId));
  await deleteDoc(ref);
};

export const toggleWatched = async (uid, itemId, watched) => {
  const ref = doc(db, "users", uid, "watchlist", String(itemId));
  await updateDoc(ref, { watched });
};

export const subscribeToWatchlist = (uid, callback) => {
  const q = query(
    collection(db, "users", uid, "watchlist"),
    orderBy("addedAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(items);
  });
};