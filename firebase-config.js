// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC97kVilBaeEotFi7V79yJw9ytXHA3eJyA",
    authDomain: "vera-hair.firebaseapp.com",
    projectId: "vera-hair",
    storageBucket: "vera-hair.firebasestorage.app",
    messagingSenderId: "580202102548",
    appId: "1:580202102548:web:5ca6bcccbd6a461e35cc01",
    measurementId: "G-E9FHSPXC4C"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 공지사항 컬렉션 참조
const noticesCollection = db.collection('notices');
