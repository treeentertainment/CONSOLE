const firebaseConfig = {
  apiKey: "AIzaSyBsUla3VNIn6wccJ43Ui5Dzw9mwIAHcdKE",
  authDomain: "auth.appwebsite.tech",
  databaseURL: "https://treeentertainment-default-rtdb.firebaseio.com",
  projectId: "treeentertainment",
  storageBucket: "treeentertainment.appspot.com",
  messagingSenderId: "302800551840",
  appId: "1:302800551840:web:1f7ff24b21ead43cc3eec5",
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const realtimeDb = firebase.database();
const number = localStorage.getItem("number");
const name = localStorage.getItem("name");
const email = localStorage.getItem("email");

window.onload = function () {
  display();
};
auth.onAuthStateChanged((user) => {
  if (user) {
    var originalEmail = user.email;
    var fixedemail = originalEmail.replace(".", "@");

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
                window.location.href = "index.html";
              }
            });
        } else {
          window.location.href = "index.html";
        }
      })
      .catch((error) => {
        window.location.href = "index.html";
      });
  } else {
    window.location.href = "index.html";
  }
});

function toggleFullScreen() {
  if (
    !document.fullscreenElement && // 전체 화면이 아닌 경우
    !document.mozFullScreenElement && // Firefox
    !document.webkitFullscreenElement && // Chrome, Safari
    !document.msFullscreenElement
  ) {
    // IE/Edge
    // 전체 화면으로 전환
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      // Firefox
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      // Chrome, Safari
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      // IE/Edge
      document.documentElement.msRequestFullscreen();
    }

    document.getElementById("fullscreen-icon").textContent = "fullscreen_exit"; // 아이콘 변경
  } else {
    // 전체 화면 종료
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      // Firefox
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      // Chrome, Safari
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      // IE/Edge
      document.msExitFullscreen();
    }
    document.getElementById("fullscreen-icon").textContent = "fullscreen"; // 아이콘 변경
  }
}

var commentsRef = firebase.database().ref("people/data/" + number + "/order");

commentsRef.on("child_changed", (data) => {
  updateorder(data.val(), data.key);
});

function updateorder() {
  const menuEditor = document.getElementById("order-body");
  menuEditor.innerHTML = ""; // 초기화

  const menuRef = firebase.database().ref("people/data/" + number + "/order");
  menuRef.once("value", function (snapshot) {
    const doneList = [];
    const pendingList = [];

    snapshot.forEach(function (childSnapshot) {
      const childData = childSnapshot.val();
      const key = childSnapshot.key;
      const phoneNumber = childData[0];
      const lastFourDigits = phoneNumber.split("-").pop();

      const div = document.createElement("div");
      div.className = "order-item-content";
      div.id = key;
      div.innerHTML = `
        <h3>${key}</h3>
        <p>주문번호: ${lastFourDigits}</p>
      `;

      if (childData.status === true) {
        doneList.push(div); // 준비 완료
      } else {
        pendingList.push(div); // 준비 중
      }
    });

    const maxLength = Math.max(doneList.length, pendingList.length);

    for (let i = 0; i < maxLength; i++) {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td"); // 왼쪽: 준비 완료
      const td2 = document.createElement("td"); // 오른쪽: 준비 중

      if (doneList[i]) td1.appendChild(doneList[i]);
      if (pendingList[i]) td2.appendChild(pendingList[i]);

      tr.appendChild(td1);
      tr.appendChild(td2);
      menuEditor.appendChild(tr);
    }
  });
}

function closeModal() {
  document.getElementById("menu-modal").classList.remove("active");
}

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text); // 텍스트로 음성 객체 생성

  // 선택적으로 음성의 속도, 피치, 언어 등을 설정할 수 있습니다.
  utterance.rate = 1; // 속도 (0.1 ~ 10)
  utterance.pitch = 1; // 피치 (0 ~ 2)
  utterance.lang = "ko-KR"; // 언어 (한국어 설정)

  // 음성 출력이 끝난 후 실행될 함수
  utterance.onend = function (event) {
    setTimeout(() => {
      closeModal(); // 3초 후 함수 실행
    }, 3000); // 3000ms = 3초
  };

  // 음성 출력 시작
  speechSynthesis.speak(utterance);
}

function display() {
  const menuEditor = document.getElementById("order-body");
  menuEditor.innerHTML = ""; // 초기화

  const menuRef = firebase.database().ref("people/data/" + number + "/order");
  menuRef.once("value", function (snapshot) {
    const doneList = [];
    const pendingList = [];

    snapshot.forEach(function (childSnapshot) {
      const childData = childSnapshot.val();
      const key = childSnapshot.key;
      const phoneNumber = childData[0];
      const lastFourDigits = phoneNumber.split("-").pop();

      const div = document.createElement("div");
      div.className = "order-item-content";
      div.id = key;
      div.innerHTML = `
        <h3>${key}</h3>
        <p>주문번호: ${lastFourDigits}</p>
      `;

      if (childData.status === true) {
        doneList.push(div); // 준비 완료
      } else {
        pendingList.push(div); // 준비 중
      }
    });

    const maxLength = Math.max(doneList.length, pendingList.length);

    for (let i = 0; i < maxLength; i++) {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td"); // 왼쪽 (준비 완료)
      const td2 = document.createElement("td"); // 오른쪽 (준비 중)

      if (doneList[i]) td1.appendChild(doneList[i]);
      if (pendingList[i]) td2.appendChild(pendingList[i]);

      tr.appendChild(td1);
      tr.appendChild(td2);
      menuEditor.appendChild(tr);
    }
  });
}
