const firebaseConfig = {
  apiKey: "AIzaSyBsUla3VNIn6wccJ43Ui5Dzw9mwIAHcdKE",
  authDomain: "auth.appwebsite.tech",
  databaseURL: "https://treeentertainment-default-rtdb.firebaseio.com",
  projectId: "treeentertainment",
  storageBucket: "treeentertainment.appspot.com",
  messagingSenderId: "302800551840",
  appId: "1:302800551840:web:1f7ff24b21ead43cc3eec5"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const realtimeDb = firebase.database();
const number = localStorage.getItem('number');
const name = localStorage.getItem('name');
const email = localStorage.getItem('email');

window.onload = function () {
  window.localStorage.setItem('itemlist', null);
  var hash = window.location.hash.slice(1); // '#' 제거
  if (hash === "") {
    window.location.hash = "order";
  } else {
 changePage();
  }
   document.getElementById(`${hash}-button`)?.classList.add('active');
}

function getlist() {
  return JSON.parse(localStorage.getItem('itemlist')) || [];
}

auth.onAuthStateChanged((user) => {
  if (user) {
    var originalEmail = user.email;
    var fixedemail = originalEmail.replace(".", "@");

    window.localStorage.setItem('email', JSON.stringify(fixedemail));

    firebase.database().ref('/people/admin/' + fixedemail).once('value').then((snapshot) => {
      const data = snapshot.val();
      if (data && data.enabled === true) {
        window.localStorage.setItem('number', JSON.stringify(data.store));
        firebase.database().ref('/people/data/' + data.store).once('value').then((snapshot) => {
          const data = snapshot.val();
          if (data && data.email === fixedemail) {
            window.localStorage.setItem('name', JSON.stringify(data.name));
          } else {
            window.location.href = "index.html";
          }
        });
      } else {
        window.location.href = "index.html";
      }
    }).catch((error) => {
      window.location.href = "index.html";
    });

  } else {
    window.location.href = "index.html";
  }
});

function edit(templist, key) {
  const editor = document.getElementById('menu-editor');
  editor.innerHTML = "";

  templist.forEach((item, index) => {
    editor.innerHTML += `
      <div class="form-group">
        <label class="form-label" for="key-${key}-item-${index}">수량 - ${item.name}</label>
        <input class="form-input" type="number" id="key-${key}-item-${index}" value="${item.quantity}" required>
      </div>
    `;
  });

  document.getElementById('modal-title').textContent = `${key}번 주문 수정`;
  document.getElementById('menu-modal').classList.add('active');

  document.getElementById('submitit').onclick = function () {
    applycontent(key, templist);
    document.getElementById('modal-title').textContent = "";
  }
}

function applycontent(key, templist, words) {
  var updates = {};

  if (words === false) {
    updates[`people/data/${number}/order/${key}/status`] = true; // 주문 완료
    updates[`people/data/${number}/order/${key}/call`] = true; // 부르도록 요정
 
  } else if (words === "return") {
    updates[`people/data/${number}/order/${key}/status`]= false; // return
    updates[`people/data/${number}/order/${key}/call`] = false;

    } else {
    templist.forEach((item, idx) => {
      var newQuantity = Number(document.getElementById(`key-${key}-item-${idx}`).value);
      updates[`people/data/${number}/order/${key}/${idx + 1}/quantity`] = newQuantity;
    });
  }
  firebase.database().ref().update(updates);
  closeModal();
}

function closeModal() {
  document.getElementById('modal-title').textContent = "";
  document.getElementById('menu-editor').innerHTML = "";
  document.getElementById('submitit').onclick = null; // 클릭 이벤트 초기화
  document.getElementById('menu-modal').classList.remove('active');
}

var commentsRef = firebase.database().ref('people/data/' + number + '/order');

commentsRef.on('child_added', (data) => {
  neworder(data.key, data.val());
});

commentsRef.on('child_changed', (data) => {
  updateorder(data.key, data.val());
});

commentsRef.on('child_removed', (data) => {
  deleteorder(data.key, data.val());
});

function updateorder(key, orderData) {
  if (isNaN(Number(key))) return;

  console.log("UPDATE:", key, orderData);

  const element = document.getElementById(`content-${key}`);
  if (!element) return;

  element.innerHTML = "";

  const templist = [];
  const phonenumber = orderData["0"];
  const tdContent = document.createElement('td');
  tdContent.id = `content-${key}`;
  
  Object.keys(orderData).forEach(k => {
    if (!isNaN(Number(k))) {
      const currentItem = orderData[k];
      if (!currentItem || !currentItem.name || !currentItem.quantity) return;

      const nameDiv = document.createElement('div');
      nameDiv.textContent = `name: ${currentItem.name}`;
      tdContent.appendChild(nameDiv);

      const quantityDiv = document.createElement('div');
      quantityDiv.textContent = `quantity: ${currentItem.quantity}`;
      tdContent.appendChild(quantityDiv);

      const optionsDiv = document.createElement('div');
      optionsDiv.textContent = "options:";
      tdContent.appendChild(optionsDiv);

      if (Array.isArray(currentItem.options)) {
        currentItem.options.forEach(option => {
          const optionLine = document.createElement('div');
          optionLine.textContent = `${option.name} - ${option.value}`;
          tdContent.appendChild(optionLine);
        });
      }

      tdContent.appendChild(document.createElement('br'));
      templist.push(currentItem);
    }
  });

  element.appendChild(tdContent);

  const list = getlist();
  list.push({ phonenumber, itemlist: templist });
  window.localStorage.setItem('itemlist', JSON.stringify(list));

  const tr = document.getElementById(key);
  if (orderData.status === true) {
    tr.style.backgroundColor = "khaki";
    tr.style.pointerEvents = "none";
    tr.style.filter = "brightness(90%)"; // 흐릿하게 보이지만 자식에는 영향 없음
  
    // 자식 중 모든 버튼만 다시 활성화 및 불투명하게 설정
    const buttons = tr.querySelectorAll("button");
    buttons.forEach((btn) => {
      btn.style.pointerEvents = "auto";
    });   
    
  } else {
    tr.style.backgroundColor = "white";
    tr.style.pointerEvents = "auto";
    tr.style.filter = "brightness(100%)"; // 흐릿하게 보이지만 자식에는 영향 없음

  }
  
}

function deleteorder(key, orderData) {
  if (isNaN(Number(key))) return;

  console.log("DELETE:", key, orderData);

  const element = document.getElementById(key);
  if (element) element.remove();

  const list = getlist().filter(item => item.phonenumber !== orderData[0]);
  window.localStorage.setItem('itemlist', JSON.stringify(list));
}

function neworder(key, orderData) {
  if (isNaN(Number(key))) return;

  console.log("NEW ORDER:", key, orderData);
  const list = getlist();
  const templist = [];

  const phonenumber = orderData["0"]; // 전화번호

  const tr = document.createElement('tr');
  tr.id = key;

  const tdIndex = document.createElement('td');
  tdIndex.textContent = key;
  tr.appendChild(tdIndex);

  const tdContent = document.createElement('td');
  tdContent.id = `content-${key}`;

  Object.keys(orderData).forEach(k => {
    if (!isNaN(Number(k))) {
      const currentItem = orderData[k];
      if (!currentItem || !currentItem.name || !currentItem.quantity) return;

      const nameDiv = document.createElement('div');
      nameDiv.textContent = `name: ${currentItem.name}`;
      tdContent.appendChild(nameDiv);

      const quantityDiv = document.createElement('div');
      quantityDiv.textContent = `quantity: ${currentItem.quantity}`;
      tdContent.appendChild(quantityDiv);

      const optionsDiv = document.createElement('div');
      optionsDiv.textContent = "options:";
      tdContent.appendChild(optionsDiv);

      if (Array.isArray(currentItem.options)) {
        currentItem.options.forEach(option => {
          const optionLine = document.createElement('div');
          optionLine.textContent = `${option.name} - ${option.value}`;
          tdContent.appendChild(optionLine);
        });
      }

      tdContent.appendChild(document.createElement('br'));
      templist.push(currentItem);
    }
  });

  tr.appendChild(tdContent);

  const tdPhone = document.createElement('td');
  tdPhone.textContent = phonenumber;
  tr.appendChild(tdPhone);

  const editor = document.createElement('td');

  const menubutton = document.createElement('button');
  menubutton.classList.add('material-icons', 'btn', 'btn-error');
  menubutton.textContent = "edit";
  menubutton.style.marginRight = "5px";
  menubutton.onclick = () => edit(templist, key);
  editor.appendChild(menubutton);

  const callbutton = document.createElement('button');
  callbutton.classList.add('material-icons', 'btn', 'btn-success');
  callbutton.textContent = "ring_volume";
  callbutton.style.marginRight = "5px";
  callbutton.onclick = () => readymenu(key, phonenumber, templist);
  editor.appendChild(callbutton);

  const deletebutton = document.createElement('button');
  deletebutton.classList.add('material-icons', 'btn', 'btn-error');
  deletebutton.textContent = "delete";
  deletebutton.style.marginRight = "5px";
  deletebutton.onclick = () => deletemenu(key, phonenumber);
  editor.appendChild(deletebutton);

  const returnorigin = document.createElement('button');
  returnorigin.classList.add('material-icons', 'btn', 'btn-primary');
  returnorigin.textContent = "restart_alt";
  returnorigin.onclick = () => areyoureturn(key, phonenumber, templist);
  editor.appendChild(returnorigin);

  tr.appendChild(editor);

  if (orderData.status === true) {
    tr.style.backgroundColor = "khaki";
    tr.style.pointerEvents = "none";
    tr.style.filter = "brightness(90%)"; // 흐릿하게 보이지만 자식에는 영향 없음
  
    const buttons = tr.querySelectorAll("button");
    buttons.forEach((btn) => {
      btn.style.pointerEvents = "auto";
    });
       
  }
  document.getElementById('order-table').appendChild(tr);

  list.push({ phonenumber, itemlist: templist });
  window.localStorage.setItem('itemlist', JSON.stringify(list));
}


function deletemenu(key, phonenumber) {
  if (confirm(`${phonenumber}님의 주문을 삭제하시겠습니까?`)) {
    firebase.database().ref(`people/data/${number}/order/${key}`).remove()
      .then(() => {
        console.log(`Order ${key} deleted successfully.`);
      })
      .catch((error) => {
        console.error(`Error deleting order ${key}:`, error);
      });
  }
}

function readymenu(key, phonenumber, templist) {
  document.getElementById('menu-editor').innerHTML = "";
  document.getElementById('modal-title').textContent = `${phonenumber} 을 콜 하시겠습니까?`;
  document.getElementById('menu-modal').classList.add('active');

  document.getElementById('submitit').onclick = function () {
    console.log("콜 버튼 클릭됨:", key, phonenumber, templist);
    applycontent(key, templist, false);
    document.getElementById('modal-title').textContent = "";
  }
}

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // 전체 화면이 아닌 경우
      !document.mozFullScreenElement && // Firefox
      !document.webkitFullscreenElement && // Chrome, Safari
      !document.msFullscreenElement) { // IE/Edge
      // 전체 화면으로 전환
      if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) { // Firefox
          document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari
          document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
          document.documentElement.msRequestFullscreen();
      }

      document.getElementById('fullscreen-icon').textContent = "fullscreen_exit"; // 아이콘 변경
  } else {
      // 전체 화면 종료
      if (document.exitFullscreen) {
          document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
          document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Chrome, Safari
          document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
          document.msExitFullscreen();
      }
      document.getElementById('fullscreen-icon').textContent = "fullscreen"; // 아이콘 변경

  }
}

  async function logout() {
    await auth.signOut(); // Firebase 세션 로그아웃
  
    // 상태 초기화
     localStorage.clear();
     sessionStorage.clear();
     clickCount = 0;

     console.error('finish');
     window.location.reload();  // 강제로 새로고침하여 상태 초기화
  }
  
  function areyoureturn(key, phonenumber, templist) {
    document.getElementById('menu-editor').innerHTML = "";
    document.getElementById('modal-title').textContent = `${phonenumber} 을 준비중으로 바꾸시겠습니까?`;
    document.getElementById('menu-modal').classList.add('active');
  
    document.getElementById('submitit').onclick = function () {
      applycontent(key, templist, "return");
    }
  }
  
window.onhashchange = function() {
 changePage();
};

function changePage() {
   const hash = window.location.hash.slice(1); // '#' 제거
  document.querySelectorAll('.tab a').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.page').forEach(page => {
      page.style.display = 'none';
    });

    const target = document.getElementById(hash);
    if (target) {
      target.style.display = 'block';
    }
   document.getElementById(`${hash}-button`)?.classList.add('active');
   if(hash === "menu-edit"){
    editmenu();
   }
}

function editmenu() {
  try {
    firebase.database().ref('/people/data/' + number + '/menu')
      .on('value', (snapshot) => {
        const data = snapshot.val();
        console.log(data);

        const menupan = document.getElementById('menupan');

        // 기존 tbody 제거
        const oldTbody = menupan.querySelector('tbody');
        if (oldTbody) menupan.removeChild(oldTbody);

        const tbody = document.createElement('tbody');

        const renderItems = (items, type, category) => {
          items.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td><img src="${item.image}?w=400&h=300&fm=webp&q=75&auto=compress,format" class="menupan-img"></td>
              <td><input class="form-input" type="text" id="${index}-${type}-name" value="${item.name}" onchange="editmenufin('${index}', '${type}', 'name', '${category}')"></td>
              <td><input class="form-input" type="text" id="${index}-${type}-price" value="${item.price}" onchange="editmenufin('${index}', '${type}', 'price', '${category}')"></td>
              <td><input class="form-input" type="text" id="${index}-${type}-max" value="${item.max}" onchange="editmenufin('${index}', '${type}', 'max', '${category}')"></td>
              <td>
                <label class="form-switch">
                  <input type="checkbox" id="${index}-${type}-status" onchange="editmenufin('${index}', '${type}', 'status', '${category}')" ${item.status ? 'checked' : ''}>
                  <i class="form-icon"></i>
                </label>
              </td>
              <td>
                <button class="material-icons btn btn-error" onclick="deletecheck('${item.name}', '${category}', '${type}', '${index}')">delete</button>
              </td>
            `;
            tbody.appendChild(row);
          });
        };


        // cafe 내부 카테고리 처리
        if (data.cafe) {
          for (const [type, items] of Object.entries(data.cafe)) {
            if (Array.isArray(items)) {
              renderItems(items, type, 'cafe');
            }
          }
        }

        for (const [category, items] of Object.entries(data)) {
          if (category !== 'cafe' && Array.isArray(items)) {
            renderItems(items, category, category); // category가 그대로 type
          }
        }


        menupan.appendChild(tbody);
      });
  } catch (error) {
    console.error("Error fetching menu data:", error);
  }
}

function deletecheck(name, category, type, index) {
  console.log("Delete check called for:", name, category, type, index);
  const alertbox = document.getElementById('applymodal-content');
  alertbox.innerHTML = `${name}을 삭제 하시겠습니까?`;
  document.getElementById('applymodals').classList.add('active');

  document.getElementById("applymodal").addEventListener("click", function handler() {
    firebase.database().ref(`people/data/${number}/menu/${category}/${type}/${index}/`).remove()
      .then(() => {
        document.getElementById('applymodals').classList.remove('active');
      })
      .catch((error) => {
        console.error("Error deleting menu item:", error);
        alertbox.innerHTML = `오류 발생, 관리자에게 다음 메시지를 전달해주십시오: ${error}`;
      });
  }, { once: true });
}


function editmenufin(key, type, field, category) {
  const element = document.getElementById(`${key}-${type}-${field}`);
  const newValue = field === "status" ? element.checked : element.value;
  const updates = {};
  updates[`people/data/${number}/menu/${category}/${type}/${key}/${field}`] = newValue;

  firebase.database().ref().update(updates)
    .then(() => {
      console.log("Menu item updated successfully.");
    })
    .catch((error) => {
      console.error("Error updating menu item:", error);
    });
}

function editstate(event) {
  const value = document.getElementById('editimg').value;

   if (value && !isValidURL(value)) {
    alertbox("이미지 주소가 유효하지 않습니다.", true, false);
    return;
  }
 var text = document.getElementById('editstatetxt').value;
 var updates = {};
  updates[`people/data/${number}/state/reason/message`] = text;
  updates[`people/data/${number}/state/reason/img`] = document.getElementById('editimg').value;
  firebase.database().ref().update(updates)
    .then(() => {
      alertbox(`상태 변경이 완료되었습니다.`, true, false);
    })
    .catch((error) => {
      alertbox(`오류 발생, 관리자에게 다음 메시지를 전달해주십시오: ${error}`, true, false);  
    });
}

  const group = document.getElementById('setting-edit');
  const radios = group.querySelectorAll('input[type="radio"]');

  radios.forEach(radio => {
    radio.addEventListener('change', (event) => {
      if (event.target.checked) {
        radios.forEach(other => {
          if (other !== event.target) {
            other.checked = false;
          }
        });
        const updates = {};
        updates[`people/data/${number}/state/state`] = Number(event.target.value);
        firebase.database().ref().update(updates)
          .then(() => {
            alertbox(`상태가 ${event.target.closest('label')?.textContent.trim()}로 변경되었습니다.`, true, false);
          })
          .catch((error) => {
            alertbox(`오류 발생, 관리자에게 다음 메시지를 전달해주십시오: ${error}`, true, false);  
          });
      }
    });
  });

  function alertbox(text, ok, cancel) {
    const alertbox = document.getElementById('modal-content');
    alertbox.innerHTML = text;

    if (ok) {
      document.getElementById("cancelmodal").style.display = "none";
      document.getElementById("okmodal").style.display = "block";
    }
    if (cancel) {
      document.getElementById("okmodal").style.display = "none";
      document.getElementById("cancelmodal").style.display = "block";
    }

      document.getElementById('alertbox').classList.add('active');
  }

  function closeAlert() {
    const alertbox = document.getElementById('alertbox');
    alertbox.classList.remove('active');
    document.getElementById('modal-content').innerHTML = "";
  }

    firebase.database().ref('/people/data/' + number + '/state').once('value').then((snapshot) => {
     if(snapshot.val()) {
        document.getElementById('editstatetxt').value = snapshot.val().reason.message;
        document.getElementById('editimg').value = snapshot.val().reason.img;
        radios[Number(snapshot.val().state)].checked = true;      
      }
      }).catch((error) => {
      console.error("Error fetching state data:", error);
    });

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}