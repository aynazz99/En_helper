let dialogs = {};
let currentDialog = null;
let currentNode = null;

const dialogSelect = document.getElementById("DialogSelect");
const leftBubble = document.querySelector(".left-bubble");
const rightBubble = document.querySelector(".right-bubble");
const answersContainer = document.getElementById("answers");

// Скрываем кнопки до выбора диалога
answersContainer.style.display = "none";

// Загружаем диалоги
fetch("dialogs.json")
  .then(res => res.json())
  .then(data => {
    dialogs = data;

    // Заполняем список выбора тем
    Object.keys(dialogs).forEach(topic => {
      const option = document.createElement("option");
      option.value = topic;
      option.textContent = topic;
      dialogSelect.appendChild(option);
    });
  });

// При выборе диалога
dialogSelect.addEventListener("change", () => {
  const topic = dialogSelect.value;
  if (!topic) return;

  currentDialog = dialogs[topic];
  currentNode = currentDialog.start;

  answersContainer.style.display = ""; // показываем контейнер
  showNode(currentNode);
});

// Показ узла
function showNode(nodeKey) {
  const node = currentDialog.nodes[nodeKey];
  currentNode = nodeKey;

  // Сброс пузырей
  leftBubble.textContent = "";
  rightBubble.textContent = "";

  // Реплика персонажа
  if (node.speaker === "left") {
    leftBubble.textContent = node.text;
  } else if (node.speaker === "right") {
    rightBubble.textContent = node.text;
  }

  // Кнопки только если есть ответы
  answersContainer.innerHTML = "";
  if (node.answers) {
    node.answers.forEach(ans => {
    const nextNodeKey = ans.next;
    const nextNode = currentDialog.nodes[nextNodeKey];

    const btn = document.createElement("button");
    btn.className = "answerBtn";
    
    // Используем текст следующей ноды вместо короткого ответа
    btn.textContent = nextNode.text;

    btn.onclick = () => {
        // Показываем ответ пользователя
        if (nextNode.speaker === "right") {
        rightBubble.textContent = nextNode.text;

        setTimeout(() => {
            if (!nextNode.next || !(nextNode.next in currentDialog.nodes)) {
            leftBubble.textContent = "";
            rightBubble.textContent = "Диалог завершён.";
            answersContainer.style.display = "none";
            } else {
            showNode(nextNode.next);
            }
        }, 800);
        } else {
        showNode(nextNodeKey);
        }
    };

    answersContainer.appendChild(btn);
    });

  } else {
    // Если у текущей ноды нет ответов и next нет — диалог завершён
    if (!node.next || !(node.next in currentDialog.nodes)) {
      leftBubble.textContent = "";
      rightBubble.textContent = "Диалог завершён.";
      answersContainer.style.display = "none"; // скрываем кнопки
    } else {
      showNode(node.next);
    }
  }
}