const {initializeApp} = require('firebase/app');
const {getFirestore, collection, getDocs, getDoc, addDoc, setDoc, doc} = require('firebase/firestore/lite')



const cfg = {
  apiKey: "AIzaSyA3fMQiCZWFpPZJ1JrObgdygtvAC23Hfwo",
  authDomain: "timirg-copilot.firebaseapp.com",
  databaseURL: "https://timirg-copilot-default-rtdb.firebaseio.com",
  projectId: "timirg-copilot",
  storageBucket: "timirg-copilot.appspot.com",
  messagingSenderId: "491904583147",
  appId: "1:491904583147:web:7ad8a54b7341b1abbf05ae",
  measurementId: "G-GNZKB9SKDE"
  };

 class Firebase {
  constructor() {
    // app.initializeApp(firebaseConfig);
    let app = initializeApp(cfg)
    this.db = getFirestore(app);
    // this.auth = app.auth();
    // this.storage = app.storage();
    // this.users = collection(this.db, 'users')
    this.addNew = this.addNew.bind(this)
    this.find = this.find.bind(this)
  }


  async find(collectionName, query, field='drEmail'){
    const [filter] = query
    try {
        const col = collection(this.db, collectionName)
        const ss = await getDocs(col)
        return ss.docs.map(doc =>  {
            return {id: doc.id, ...doc.data()}
    }).filter(x => x[field] === filter).sort((a, b)=> b.timestamp - a.timestamp)
    } catch(e){
      throw e
    }   
  }
 

  async addNew (collectionName, obj){
    try{
        const col = collection(this.db, collectionName)
        const ref = doc(col)
        return await setDoc(ref, obj)

    } catch(e){
      throw e
    }
  }

}

module.exports = new Firebase();
