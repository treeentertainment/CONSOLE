const firebaseConfig = {
  apiKey: "AIzaSyDJRpL1f7zssYZ5495icYrjga_U4jAoLAE",
  authDomain: "treeentertainment.web.app",
  databaseURL: "https://treeentertainment-default-rtdb.firebaseio.com",
  projectId: "treeentertainment",
  storageBucket: "treeentertainment.firebasestorage.app",
  messagingSenderId: "302800551840",
  appId: "1:302800551840:web:77c5d1af87e43cb3c3eec5"
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    handleResult(user);
  } else {
    window.localStorage.removeItem("email");
    window.localStorage.removeItem("name");
    window.location.href = "index.html";
  }
});

function handleResult(user) {
  const email = user.email;
  const fixedemail = email.replace(/\./g, "@");
  window.localStorage.setItem("email", JSON.stringify(fixedemail));

  firebase
    .database()
    .ref("/people/admin/" + fixedemail)
    .once("value")
    .then((snapshot) => {
      const data = snapshot.val();
      if (data && data.enabled === true) {
        window.localStorage.setItem("number", JSON.stringify(data.store));

        firebase
          .database()
          .ref("/people/data/" + data.store)
          .once("value")
          .then((snapshot) => {
            const data = snapshot.val();
            if (data && data.email === fixedemail) {
              window.localStorage.setItem("name", JSON.stringify(data.name));
            } else {
              alert(
                "올바른 데이터가 아니거나 관리자가 아닙니다. 잠시후 로그아웃 됩니다."
              );
              firebase.auth().signOut();
              window.location.href = "index.html";
            }
          })
          .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            firebase.auth().signOut();
            alert(`에러 코드: ${errorCode} 에러 메시지: ${errorMessage}`);
            window.location.href = "index.html";
          });
      } else {
        alert("관리자가 아닙니다. 잠시후 로그아웃 됩니다.");
        firebase.auth().signOut();
        window.location.href = "index.html";
      }
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      firebase.auth().signOut();

      alert(`에러 코드: ${errorCode} 에러 메시지: ${errorMessage}`);
      window.location.href = "index.html";
    });
}
