  const path = window.location.pathname;

  if (path.includes("test")) {
    document.getElementById("testBtn").classList.add("active");
  } else if (path.includes("level")) {
    document.getElementById("levelBtn").classList.add("active");
  } else if (path.includes("cards")) {
    document.getElementById("cardsBtn").classList.add("active");
  } else if (path.includes("airport")) {
    document.getElementById("DialogBtn").classList.add("active");
  }