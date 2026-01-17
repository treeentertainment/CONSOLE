document
  .getElementById("googleLoginBtn")
  .addEventListener("click", googleLogin);

async function googleLogin() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/v2/index.html`,
    },
  });
  if (error) {
    console.error("Error logging in with Google:", error);
  }
}

const form = document.getElementById("loginForm");
form.addEventListener("submit", loginpassword);

async function loginpassword(event) {
  event.preventDefault();
  const email = event.srcElement[0].value;
  const password = event.srcElement[1].value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Error: " + error.message);
    show("login", "start");
    return;
  }
}

async function logout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
    return;
  }
  show("login", "start");
}

// Monitor auth state
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session && session.user) {
    handleResult(session.user);
  } else if (event === "SIGNED_OUT") {
    show("login", "start");
  }
});

async function handleResult(user) {
  const email = user.email;
  window.localStorage.setItem("email", JSON.stringify(email));

  try {
    // 1. 'admins' 테이블에서 사용자 정보 조회
    const { data: adminData, error: adminError } = await supabaseClient
      .from("admins")
      .select("store, access")
      .eq("user_id", user.id)
      .single();

    if (adminError || !adminData) {
      alert("관리자 정보를 찾을 수 없습니다. 잠시후 로그아웃 됩니다.");
      await supabaseClient.auth.signOut();
      show("login", "start");
      return;
    }

    // 2. 'stores' 테이블에서 매장 정보 조회
    const { data: storeData, error: storeError } = await supabaseClient
      .from("stores")
      .select("email")
      .eq("store_number", Number(adminData.store))
      .single();

    if (storeError || !storeData) {
      alert("매장 정보를 찾을 수 없습니다. 잠시후 로그아웃 됩니다.");
      await supabaseClient.auth.signOut();
      show("login", "start");
      return;
    }

    // 3. 사용자 이메일과 매장 이메일 일치 여부 확인
    if (storeData.email === email) {
      window.localStorage.setItem("number", adminData.store);
      show("start", "login");
    } else {
      alert(
        "올바른 데이터가 아니거나 관리자가 아닙니다. 잠시후 로그아웃 됩니다.",
      );
      await supabaseClient.auth.signOut();
      show("login", "start");
    }
  } catch (error) {
    console.error("Error handling result:", error);
    alert(`에러 발생: ${error.message}`);
    await supabaseClient.auth.signOut();
    show("login", "start");
  }
}

function show(showId, hideId) {
  document.getElementById(showId).style.display = "block";
  document.getElementById(hideId).style.display = "none";
}

document.getElementById("logoutTxt").addEventListener("dblclick", logout);

document.getElementById("startBtn").addEventListener("click", () => {
  window.location.href = "main.html";
});

// 페이지 최초 진입 시 세션 체크
(async () => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) {
    show("login", "start");
  }
})();
