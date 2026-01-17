function getMenuData() {
  try {
    const raw = localStorage.getItem("menus");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    handleError(e)
  }
}

function getlist() {
  return JSON.parse(window.localStorage.getItem("itemlist")) || []; // order list
}
function handleError(e) {
  console.log(e);
}

// order.js + menu.js
var menuRef = firebase.database().ref("/people/data/" + number + "/menu/v5");

menuRef.on("child_added", (data) => {
  window.localStorage.setItem("menus", data.val());
});

menuRef.on("child_changed", (data) => {
  window.localStorage.setItem("menus", data.val());
});

menuRef.on("child_removed", (data) => {
  window.localStorage.setItem("menus", data.val());
});

window.addEventListener("DOMContentLoaded", function () {
  firebase
    .database()
    .ref("/people/data/" + number + "/menu/v5")
    .on("value", (snapshot) => {
      localStorage.setItem("menus", JSON.stringify(snapshot.val()));
    });
});

// order.js
var commentsRef = firebase.database().ref("people/data/" + number + "/order");

commentsRef.on("child_added", (data) => {
  neworder(data.key, data.val());
});

commentsRef.on("child_changed", (data) => {
  updateorder(data.key, data.val());
});

commentsRef.on("child_removed", (data) => {
  deleteorder(data.key, data.val());
});
