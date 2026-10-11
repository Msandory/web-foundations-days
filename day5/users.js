const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusText = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

const USERS_URL = "https://jsonplaceholder.typicode.com/users";

// All loaded users are stored here; filtering never makes a new request
let allUsers = [];

async function loadUsers() {
  statusText.textContent = "Loading users...";
  loadButton.disabled = true;

  try {
    const response = await fetch(USERS_URL);

    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }

    allUsers = await response.json();
    renderUsers(allUsers);
    statusText.textContent = "Loaded " + allUsers.length + " users.";
  } catch (error) {
    statusText.textContent = "Could not load users: " + error.message;
  } finally {
    loadButton.disabled = false;
  }
}

// Draws any array of users
function renderUsers(list) {
  usersList.innerHTML = ""; // clears the list only; user data goes in with textContent

  if (list.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No users match your filter.";
    usersList.append(li);
    return;
  }

  list.forEach(function (user) {
    const li = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = user.name;

    const details = document.createElement("span");
    details.textContent =
      " | " + user.email +
      " | " + user.address.city +
      " | " + user.company.name;

    li.append(name, details);
    usersList.append(li);
  });
}

// Filter the stored array as the user types (no new request)
filterInput.addEventListener("input", function () {
  const term = filterInput.value.trim().toLowerCase();

  const filtered = allUsers.filter(function (user) {
    return user.name.toLowerCase().includes(term);
  });

  // Nothing to filter before the users have loaded
  if (allUsers.length === 0) {
    return;
  }

  renderUsers(filtered);
});

loadButton.addEventListener("click", loadUsers);