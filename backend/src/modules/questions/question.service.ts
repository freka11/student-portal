import { getFirestore } from "../../config/firebase";

const db = getFirestore();
const collection = db.collection("questions");

type Question = {
  text: string;
  status: "draft" | "published";
  createdBy: { uid: string; name: string };
  createdAt: string;
  publishDate: string;
  deleted: boolean;
  updatedAt?: string;
};

export class QuestionService {
  async listByPublishDate(date: string) {
    const snapshot = await collection
      .where("publishDate", "==", date)
      .get();

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as Question) }))
      .filter((q: any) => q.deleted !== true)
      .sort((a: any, b: any) => {
        const aAt = a.createdAt || ''
        const bAt = b.createdAt || ''
        return bAt.localeCompare(aAt)
      });
  }

  async listAll() {
    const snapshot = await collection.get();

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as Question) }))
      .filter((q: any) => q.deleted !== true)
      .sort((a: any, b: any) => {
        const aAt = a.createdAt || ''
        const bAt = b.createdAt || ''
        return bAt.localeCompare(aAt)
      });
  }

  async create(data: {
    text: string;
    status?: "draft" | "published";
    createdBy: { uid: string; name: string };
    publishDate?: string;
  }) {
    const publishDate =
      data.publishDate ?? new Date().toISOString().split("T")[0];

    const docRef = await collection.add({
      text: data.text,
      status: data.status ?? "published",
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
      publishDate,
      deleted: false,
    });

    return { id: docRef.id };
  }

  async update(id: string, text: string) {
    await collection.doc(id).update({
      text,
      updatedAt: new Date().toISOString(),
    });

    return { id };
  }

  async softDelete(id: string) {
    await collection.doc(id).update({
      deleted: true,
      updatedAt: new Date().toISOString(),
    });

    return { id };
  }

  async updateStatus(id: string, status: "draft" | "published") {
    await collection.doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    return { id };
  }
}