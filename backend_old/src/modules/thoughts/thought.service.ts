import { getFirestore } from "../../config/firebase";

const db = getFirestore();
const collection = db.collection("thoughts");

export class ThoughtService {
  static async listByPublishDate(date: string) {
    const snapshot = await collection
      .where("publishDate", "==", date)
      .where("deleted", "!=", true)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  static async listAll() {
    const snapshot = await collection
      .where("deleted", "!=", true)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  static async create(data: {
    text: string;
    createdBy: { uid: string; name: string };
  }) {
    const today = new Date().toISOString().split("T")[0];

    const docRef = await collection.add({
      text: data.text,
      status: "published",
      createdBy: data.createdBy,
      createdAt: new Date(),
      publishDate: today,
      deleted: false,
    });

    return { id: docRef.id };
  }

  static async update(id: string, text: string) {
    const docRef = collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) throw new Error("Thought not found");

    await docRef.update({
      text,
      updatedAt: new Date(),
    });

    return { id };
  }

  static async softDelete(id: string) {
    const docRef = collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) throw new Error("Thought not found");

    await docRef.update({
      deleted: true,
      updatedAt: new Date(),
    });

    return { id };
  }
}