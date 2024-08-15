<template>
    <div>
      <div v-if="!user">
        <!-- Login/Register Form -->
        <div>
          <h2>Login/Register</h2>
          <v-text-field v-model="email" label="Email" type="email" />
          <v-text-field v-model="password" label="Password" type="password" />
          <v-btn @click="loginWithEmail">Login</v-btn>
          <v-btn @click="registerWithEmail">Register</v-btn>
          <v-btn @click="loginWithGoogle">Login with Google</v-btn>
        </div>
      </div>
      <div v-else>
        <div class="background-image" style="overflow: hidden;">
          <div class="positionC"> 
            <label for="contador">Contador:</label>
            <input type="number" v-model="counter" class="form-control" readonly> 
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
      </div>
    </div>
  </template>
  
  <script setup>
import { ref, onMounted } from 'vue';
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, db, collection, doc, setDoc, getDoc } from '@/firebase';
import { signInWithPopup } from 'firebase/auth';

const email = ref('');
const password = ref('');
const user = ref(null);
const counter = ref(0);
const pokemon = ref({ img: '', name: '' });
const errorMessage = ref('');
const name = ref('');
const showPokemonName = ref(false);
const pokemonImage = ref(null);

// Authentication Functions
const loginWithEmail = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    user.value = userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
  }
};

const registerWithEmail = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    user.value = userCredential.user;
    // Optionally, you can add user data to Firestore here
  } catch (error) {
    console.error('Error registering:', error);
  }
};

const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    user.value = result.user;
  } catch (error) {
    console.error('Error logging in with Google:', error);
  }
};

const logout = async () => {
  try {
    await auth.signOut();
    user.value = null;
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// Pokémon Game Logic
const getPokemon = async () => {
  const randomId = Math.floor(Math.random() * 806 + 1);
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const data = await response.json();
    pokemon.value = {
      id: data.id,
      name: data.species.name,
      img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`
    };
    showPokemonName.value = false;
    if (pokemonImage.value) {
      pokemonImage.value.style.filter = "brightness(0) invert(0)";
    }
  } catch (error) {
    console.error("Error fetching Pokémon data:", error);
  }
};

const solucion = async () => {
  if (name.value === pokemon.value.name) {
    counter.value++;
    errorMessage.value = '';
    showPokemonName.value = true;
    if (pokemonImage.value) {
      pokemonImage.value.style.filter = "none";
    }

    // Handle Firestore updates
    if (user.value) {
      const userId = user.value.uid;
      const userScoreRef = doc(collection(db, 'puntuaciones'), userId);

      try {
        const docSnapshot = await getDoc(userScoreRef);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (counter.value > data.contador) {
            await setDoc(userScoreRef, { contador: counter.value }, { merge: true });
          }
        } else {
          await setDoc(userScoreRef, { contador: counter.value });
        }
      } catch (error) {
        console.error("Error updating score:", error);
      }
    }

    setTimeout(getPokemon, 2000);
    name.value = '';
  } else {
    errorMessage.value = pokemon.value.name;
    setTimeout(() => {
      const positionE = document.querySelector(".positionE");
      if (positionE) {
        positionE.style.display = "flex";
      }
    }, 0);
  }
};

onMounted(() => {
  getPokemon();
});
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
  