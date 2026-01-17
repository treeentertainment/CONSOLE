const firebaseConfig = {
  apiKey: "AIzaSyDJRpL1f7zssYZ5495icYrjga_U4jAoLAE",
  authDomain: "treeentertainment.web.app",
  databaseURL: "https://treeentertainment-default-rtdb.firebaseio.com",
  projectId: "treeentertainment",
  storageBucket: "treeentertainment.firebasestorage.app",
  messagingSenderId: "302800551840",
  appId: "1:302800551840:web:77c5d1af87e43cb3c3eec5",
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

document
  .getElementById("googleLoginBtn")
  .addEventListener("click", googleLogin);

function googleLogin() {
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope("openid", "email", "profile");
  firebase.auth().useDeviceLanguage();

  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      handleResult(result.user);
    })
    .catch((error) => {});
}

const form = document.getElementById("loginForm");
form.addEventListener("submit", loginpassword);

function loginpassword(event) {
  event.preventDefault();
  const email = event.srcElement[0].value;
  const password = event.srcElement[1].value;

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((result) => {
      handleResult(result.user);
    })
    .catch((error) => {
      alert("Error: " + error.message);
      show("login", "start");
    });

  return null;
}

function logout() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      show("login", "start");
    })
    .catch((error) => {});
}

// Monitor auth state
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    handleResult(user);
  } else {
    show("login", "start");
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
              show("start", "login");
            } else {
              alert(
                "올바른 데이터가 아니거나 관리자가 아닙니다. 잠시후 로그아웃 됩니다.",
              );
              firebase.auth().signOut();
              show("login", "start");
            }
          })
          .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            firebase.auth().signOut();
            alert(`에러 코드: ${errorCode} 에러 메시지: ${errorMessage}`);
            show("login", "start");
          });
      } else {
        alert("관리자가 아닙니다. 잠시후 로그아웃 됩니다.");
        firebase.auth().signOut();
        show("login", "start");
      }
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      firebase.auth().signOut();

      alert(`에러 코드: ${errorCode} 에러 메시지: ${errorMessage}`);
      show("login", "start");
    });
}

function show(showId, hideId) {
  document.getElementById(showId).style.display = "block";
  document.getElementById(hideId).style.display = "none";
}

document.getElementById("logoutTxt").addEventListener("dblclick", logout);

document.getElementById("startBtn").addEventListener("click", () => {
  window.location.href = "main.html";
});
