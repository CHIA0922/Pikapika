const URL_BASE = "https://pokeapi.co/api/v2/pokemon/";
const pokemonList = document.querySelector("#pokemonList");
const searchInput = document.querySelector("#search");
const btnVerFavoritos = document.querySelector("#btn-ver-favoritos");
const favCountSpan = document.querySelector("#fav-count");

const modal = document.querySelector("#pokemon-modal");
const closeModalBtn = document.querySelector("#close-modal");
const modalBody = document.querySelector("#modal-body");

let favoritos = JSON.parse(localStorage.getItem("pokedex_favoritos")) || [];
let mostrandoFavoritos = false;

// Inicialización de event listeners
document.addEventListener("DOMContentLoaded", () => {
  actualizarContadorFav();
  cargarPokemonesIniciales();
});

// Carga inicial de Pokémons (1-151)
async function cargarPokemonesIniciales() {
  pokemonList.innerHTML = "";
  for (let i = 1; i <= 151; i++) {
    await obtenerPokemon(i);
  }
}

// Consumo de Pokédex API con manejo de errores
async function obtenerPokemon(idOrName) {
  try {
    const response = await fetch(`${URL_BASE}${idOrName.toString().toLowerCase()}`);
    if (!response.ok) throw new Error("Pokémon no encontrado");
    const data = await response.json();
    mostrarPokemon(data);
  } catch (error) {
    if (searchInput.value.trim() !== "") {
      mostrarError("No se encontró ningún Pokémon con ese parámetro.");
    }
  }
}

// Renderizado de tarjeta individual
function mostrarPokemon(poke) {
  const tipos = poke.types.map(type => `<p class="${type.type.name} tipo">${type.type.name.toUpperCase()}</p>`).join("");
  const esFav = favoritos.includes(poke.id);

  const div = document.createElement("div");
  div.classList.add("pokemon");
  div.dataset.id = poke.id;
  div.innerHTML = `
    <p class="pokemon-id-back">#${poke.id.toString().padStart(3, "0")}</p>
    <div class="pokemon-imagen">
      <img src="${poke.sprites.other["official-artwork"].front_default || poke.sprites.front_default}" alt="${poke.name}">
    </div>
    <div class="pokemon-info">
      <div class="nombre-contenedor">
        <span class="pokemon-id">#${poke.id.toString().padStart(3, "0")}</span>
        <h2 class="pokemon-nombre">${poke.name}</h2>
      </div>
      <div class="pokemon-tipos">
        ${tipos}
      </div>
      <button class="btn-fav ${esFav ? "active" : ""}" data-id="${poke.id}">
        ${esFav ? "En Favoritos" : "Agregar a Favoritos"}
      </button>
    </div>
  `;

  // Evento para abrir el modal
  div.addEventListener("click", (e) => {
    if (!e.target.classList.contains("btn-fav")) {
      abrirModal(poke);
    }
  });

  // Evento para botón de favorito en la tarjeta
  const btnFav = div.querySelector(".btn-fav");
  btnFav.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorito(poke.id);
  });

  pokemonList.append(div);
}

// Generación y apertura de Pop-up Modal
function abrirModal(poke) {
  const tipos = poke.types.map(t => t.type.name.toUpperCase()).join(", ");
  const stats = poke.stats.map(s => `
    <div class="stat-item">
      <span><strong>${s.stat.name.toUpperCase()}:</strong></span>
      <span>${s.base_stat}</span>
    </div>
  `).join("");

  const esFav = favoritos.includes(poke.id);

  modalBody.innerHTML = `
    <h2>${poke.name.toUpperCase()} (#${poke.id})</h2>
    <img src="${poke.sprites.other["official-artwork"].front_default || poke.sprites.front_default}" alt="${poke.name}" style="width: 180px;">
    <p><strong>Tipo(s):</strong> ${tipos}</p>
    <p><strong>Altura:</strong> ${(poke.height / 10)} m</p>
    <p><strong>Peso:</strong> ${(poke.weight / 10)} kg</p>
    <div class="stats-container">
      <h3>Estadísticas Base</h3>
      ${stats}
    </div>
    <button id="modal-fav-btn" class="btn-fav ${esFav ? "active" : ""}" style="margin-top: 15px;">
      ${esFav ? "Quitar de Favoritos" : "Agregar a Favoritos"}
    </button>
  `;

  document.querySelector("#modal-fav-btn").addEventListener("click", () => {
    toggleFavorito(poke.id);
    abrirModal(poke); // Re-renderiza el estado del botón en el modal
  });

  modal.classList.remove("hidden");
}

// Cierre de Modal
closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

// Lógica de Favoritos (Persistencia con localStorage)
function toggleFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(favId => favId !== id);
  } else {
    favoritos.push(id);
  }
  localStorage.setItem("pokedex_favoritos", JSON.stringify(favoritos));
  actualizarContadorFav();
  
  if (mostrandoFavoritos) {
    renderizarFavoritos();
  } else {
    actualizarBotonesFavTarjetas(id);
  }
}

function actualizarContadorFav() {
  if (favCountSpan) favCountSpan.textContent = favoritos.length;
}

function actualizarBotonesFavTarjetas(id) {
  const card = document.querySelector(`.pokemon[data-id="${id}"]`);
  if (card) {
    const btn = card.querySelector(".btn-fav");
    const esFav = favoritos.includes(id);
    btn.classList.toggle("active", esFav);
    btn.textContent = esFav ? "En Favoritos" : "Agregar a Favoritos";
  }
}

// Vista de Favoritos
btnVerFavoritos.addEventListener("click", () => {
  mostrandoFavoritos = !mostrandoFavoritos;
  if (mostrandoFavoritos) {
    btnVerFavoritos.textContent = "Ver Todos";
    renderizarFavoritos();
  } else {
    btnVerFavoritos.textContent = `Ver Favoritos (${favoritos.length})`;
    cargarPokemonesIniciales();
  }
});

async function renderizarFavoritos() {
  pokemonList.innerHTML = "";
  if (favoritos.length === 0) {
    pokemonList.innerHTML = "<p class='error-msg'>No tienes Pokémon agregados a favoritos.</p>";
    return;
  }
  for (const id of favoritos) {
    await obtenerPokemon(id);
  }
}

// Buscador por Nombre e ID
searchInput.addEventListener("input", async (e) => {
  const valor = e.target.value.trim().toLowerCase();
  pokemonList.innerHTML = "";

  if (valor === "") {
    if (mostrandoFavoritos) {
      renderizarFavoritos();
    } else {
      cargarPokemonesIniciales();
    }
    return;
  }

  await obtenerPokemon(valor);
});

// Manejo de errores en interfaz
function mostrarError(mensaje) {
  pokemonList.innerHTML = `<p class="error-msg">${mensaje}</p>`;
}