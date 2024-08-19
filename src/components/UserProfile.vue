<template>
  <div v-if="user">
    <div class="background-image">
      <div class="content">
        <!-- Sección de la izquierda -->
        <div class="game-section">
          <div class="positionC"> 
            <label for="contador">Contador:</label>
            <input type="number" v-model="contador" class="form-control" readonly> 
          </div>
          <!-- IMAGE -->
          <div class="position">
            <img :src="pokemon.img" class="image-dark" alt="Imagen del Pokémon" ref="pokemonImage" />
            <div v-if="showPokemonName" class="pokemon-name">{{ pokemon.name }}</div>
          </div>
          <div class="positionE" v-if="errorMessage"> 
            <label>Error el nombre es:</label> 
            <label>{{ errorMessage }}</label> 
          </div>
          <div class="positionF"> 
            <input type="text" v-model="name" placeholder="Nombre" class="form-control"> 
            <button type="button" @click="solucion" id="miBoton" class="btn btn-success">Solución</button>
          </div>
          <v-btn @click="logout">Logout</v-btn>
        </div>

        <!-- Sección de la derecha -->
        <div class="leaderboard-section">
          <h2>Leaderboard</h2>
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Puntuación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(score, index) in scores" :key="index">
                <td>{{ score.name }}</td>
                <td>{{ score.counter }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <p>No estás registrado. Por favor, inicia sesión para continuar.</p>
    <v-btn @click="login">Login</v-btn>
  </div>
</template>



<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db, collection, doc, setDoc, getDoc, getDocs } from '@/firebase';
let contador = 0;
const user = ref(null);
const userName = ref(''); // Para almacenar el nombre del usuario
const counter = ref(0);
const pokemon = ref({ img: '', name: '' });
const errorMessage = ref('');
const name = ref('');
const showPokemonName = ref(false);
const pokemonImage = ref(null);
const scores = ref([]); // Para almacenar la tabla de puntuaciones
const router = useRouter();

// Verificar si el usuario está autenticado al cargar la página
onMounted(async () => {
  auth.onAuthStateChanged(async (currentUser) => {
    if (currentUser) {
      user.value = currentUser;
      console.log("User is authenticated:", user.value.uid);

      // Obtener el nombre del usuario
      try {
        const usuarioRef = doc(db, 'usuarios', user.value.uid);
        const usuarioDoc = await getDoc(usuarioRef);
        if (usuarioDoc.exists()) {
          userName.value = usuarioDoc.data().name; // Suponiendo que el campo de nombre es 'name'
        } else {
          userName.value = 'Unknown User'; // Valor predeterminado si no se encuentra el documento
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        userName.value = 'Unknown User'; // Valor predeterminado en caso de error
      }

      // Cargar datos del Pokémon y la puntuación del usuario
      getPokemon();
      loadUserScore();
      loadLeaderboard(); // Cargar la tabla de puntuaciones
    } else {
      console.log("No user is authenticated");
      router.push('/'); // Redirige a la página de inicio si no hay usuario
    }
  });
});

// Función para obtener un Pokémon aleatorio
const getPokemon = async () => {
  if (!user.value) return; // No hacer nada si no hay usuario
  const randomId = Math.floor(Math.random() * 806 + 1);
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const data = await response.json();
    pokemon.value = {
      id: data.id,
      name: data.species.name,
      img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`
    };
    console.log(pokemon);
    
    showPokemonName.value = false;
    if (pokemonImage.value) {
      pokemonImage.value.style.filter = "brightness(0) invert(0)";
    }
  } catch (error) {
    console.error("Error fetching Pokémon data:", error);
  }
};

// Función para cargar la puntuación del usuario desde Firestore
const loadUserScore = async () => {
  if (!user.value) return; // No hacer nada si no hay usuario
  const userId = user.value.uid;
  const userScoreRef = doc(collection(db, 'puntuaciones'), userId);

  try {
    const docSnapshot = await getDoc(userScoreRef);
    if (docSnapshot.exists()) {
      counter.value = docSnapshot.data().contador || 0;
      console.log("User score loaded:", counter.value);
    } else {
      console.log("No score document found for this user.");
    }
  } catch (error) {
    console.error("Error loading user score:", error);
  }
};

// Función para cargar el leaderboard
const loadLeaderboard = async () => {
  try {
    const scoresRef = collection(db, 'puntuaciones');
    const querySnapshot = await getDocs(scoresRef);
    scores.value = await Promise.all(querySnapshot.docs.map(async doc => {
      const data = doc.data();
      const userId = doc.id;
      const userName = await fetchUserName(userId); // Obtén el nombre del usuario usando su ID
      return {
        name: userName,
        counter: data.contador || 0
      };
    }));
  } catch (error) {
    console.error("Error loading leaderboard data:", error);
  }
};

// Función para obtener el nombre del usuario basado en su ID
const fetchUserName = async (userId) => {
  try {
    const userDocRef = doc(db, 'usuarios', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().name; // Suponiendo que el nombre del campo es 'name'
    } else {
      console.log("No such user document!");
      return 'Unknown User'; // O algún valor predeterminado
    }
  } catch (error) {
    console.error("Error fetching user name:", error);
    return 'Unknown User'; // O algún valor predeterminado
  }
};

// Función para manejar la solución del juego
const solucion = async () => {
  if (!user.value) return; // No hacer nada si no hay usuario
  if (name.value.toLowerCase() === pokemon.value.name.toLowerCase()) {
    contador++;
    errorMessage.value = '';
    showPokemonName.value = true;
    if (pokemonImage.value) {
      pokemonImage.value.style.filter = "none";
    }

    // Actualizar la puntuación en Firestore
    const userId = user.value.uid;
    let usuario = doc(db, 'usuarios', user.value.uid);
    const userScoreRef = doc(collection(db, 'puntuaciones'), userId);
console.log(userName);

    try {
      const docSnapshot = await getDoc(userScoreRef);
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (contador > data.contador) {
          debugger
          await setDoc(userScoreRef, { contador: contador, name:userName.value }, { merge: true });
          console.log("Score updated successfully");
        }
      } else {
        await setDoc(userScoreRef, { contador: contador, name: userName.value });
        console.log("New score document created successfully");
      }
    } catch (error) {
      console.error("Error updating score:", error);
    }

    setTimeout(() => {
      getPokemon(); // Obtén un nuevo Pokémon después de 2 segundos
      loadLeaderboard(); // Actualiza la tabla de puntuaciones
    }, 2000);
    name.value = '';
  } else {
    errorMessage.value = pokemon.value.name;
    setTimeout(() => {
      const positionE = document.querySelector(".positionE");
      if (positionE) {
        positionE.style.display = "flex";
      }
    }, 0);
    pokemonImage.value.style.filter = "none";
    setTimeout(() => {
      getPokemon(); // Obtén un nuevo Pokémon después de 2 segundos
      loadLeaderboard(); // Actualiza la tabla de puntuaciones
    }, 2000);
    setTimeout(() => {
      const positionE = document.querySelector(".positionE");
      if (positionE) {
        positionE.style.display = "none";
      }
    }, 2000);
  }
};

// Función para cerrar sesión
const logout = async () => {
  try {
    await auth.signOut();
    user.value = null;
    userName.value = ''; // Limpia el nombre del usuario
    console.log("User logged out successfully");
    router.push('/'); // Redirige a la página de inicio después de cerrar sesión
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// Función para redirigir a la página de inicio de sesión (si es necesario)
const login = () => {
  router.push('/');
};
</script>




<style scoped>
/* Incluye tu CSS aquí */

.background-image {
  background-image: url('path/to/your/background-image.jpg');
  background-size: cover;
  background-position: center;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.position {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 2% auto;
}

.positionC {
  width: 90%;
  max-width: 400px;
  margin: 2% auto;
  position: relative;
  display: flex;
  gap: 10px;
  border: 2px solid #4CAF50;
  border-radius: 15px;
  background-color: rgba(203, 251, 149, 0.5);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.positionC label {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-right: 10px;
}

.positionC input {
  width: 80px;
  height: 30px;
  font-size: 14px;
  padding: 5px;
  border: 2px solid #4CAF50;
  border-radius: 10px;
  outline: none;
}

.positionE {
  width: 90%;
  max-width: 400px;
  margin: 2% auto;
  display: none; /* Initially hidden */
  background-color: rgba(255, 99, 71, 0.5);
  border: 2px solid #f50800;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.positionF {
  width: 90%;
  max-width: 400px;
  margin: 2% auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

#pokemon-image {
  max-width: 100%;
  height: auto;
}

.pokemon-name {
  font-size: 16px;
  font-weight: bold;
  margin-top: 10px;
  color: #4CAF50;
}

#nombreF {
  width: 100%;
  max-width: 300px;
  padding: 10px 15px;
  font-size: 16px;
  border: 2px solid #ccc;
  border-radius: 25px;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

#miBoton {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s, box-shadow 0.3s;
}

#miBoton:hover {
  background-color: #45a049;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}

#miBoton:active {
  background-color: #3e8e41;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  transform: translateY(2px);
}
.content {
  display: flex;
  width: 100%;
  max-width: 1200px;
}

.game-section {
  flex: 3;
}

.leaderboard-section {
  flex: 1;
  margin-left: 20px;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th, .leaderboard-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.leaderboard-table th {
  background-color: #4CAF50;
  color: white;
}




/* Media Queries para pantallas más pequeñas */
@media (max-width: 768px) {
  .positionC, .positionF, .positionE {
    width: 100%;
    max-width: none;
    padding: 10px;
  }

  #nombreF, #miBoton {
    width: 100%;
    max-width: none;
  }

  #miBoton {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>
