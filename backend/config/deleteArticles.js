// deleteArticles.js
import admin from 'firebase-admin';
import serviceAccount from './factstream-7f50e-firebase-adminsdk-fgu50-a656ed948e.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://factstream-7f50e-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function deleteAllArticles() {
  const collectionPath = 'articles';
  const batchSize = 10;

  try {
    await deleteCollection(collectionPath, batchSize);
    console.log(`All documents in collection ${collectionPath} have been deleted.`);
  } catch (error) {
    console.error(`Error deleting documents: ${error}`);
  }
}

deleteAllArticles();
