<template>
  <v-container>
    <v-card class="mx-auto my-12" max-width="400">
      <v-card-title class="justify-center">{{ isLoginMode ? 'Login' : 'Register' }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            v-model="name"
            label="Name"
            v-if="!isLoginMode"
            required
            :rules="[v => !!v || 'Name is required']"
          ></v-text-field>
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            required
            :rules="[v => !!v || 'Email is required']"
          ></v-text-field>
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            required
            :rules="[v => !!v || 'Password is required']"
          ></v-text-field>
          <v-btn type="submit" color="primary" :loading="loading" class="mt-4">
            {{ isLoginMode ? 'Login' : 'Register' }}
          </v-btn>
        </v-form>
        <v-divider class="my-4"></v-divider>
       <!--<v-btn color="secondary" @click="loginWithGoogle" :loading="loading">
          <v-icon left>mdi-google</v-icon>
          Sign in with Google
        </v-btn>  <v-btn color="secondary" @click="loginWithGoogle" :loading="loading">
          <v-icon left>mdi-google</v-icon>
          Sign in with Google
        </v-btn>-->
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="toggleMode">
          {{ isLoginMode ? 'Create an account' : 'Already have an account? Login' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, db, collection, doc, setDoc } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { getFirestore } from "firebase/firestore"; 
const email = ref('');
const password = ref('');
const name = ref(''); // New ref for name
const isLoginMode = ref(true);
const loading = ref(false);
const router = useRouter();
console.log("helloworld")
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    let userCredential;
    if (isLoginMode.value) {
      userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
     
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
     
    }
    await saveUserToDatabase(userCredential.user, name.value); // Pass name to saveUserToDatabase
    localStorage.setItem('user', JSON.stringify(userCredential.user));
    
  } catch (error) {
    console.error('Authentication error:', error);
    
  } finally {
    loading.value = false;
  }
};

const loginWithGoogle = async () => {
  loading.value = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await saveUserToDatabase(result.user); // No name needed for Google sign-in
    localStorage.setItem('user', JSON.stringify(result.user));
    
  } catch (error) {
    console.error('Error logging in with Google:', error);
  } finally {
    loading.value = false;
  }
};

const saveUserToDatabase = async (user, userName = '') => {
  try {
    // Asegúrate de que los valores están siendo obtenidos correctamente
    console.log('User ID:', user.uid);
    console.log('User Email:', user.email);
    console.log('User Display Name:', user.displayName);
    console.log('Provided Name:', userName);

    const userRef = doc(collection(db, "usuarios"), user.uid);
    
    // Guardar los datos en Firestore
    debugger
    console.log(name);
    
    await setDoc(userRef, {
      email: user.email || '', // Usar valor vacío como fallback
      uid: user.uid || '', // Usar valor vacío como fallback
      name: userName || user.displayName || '' // Usar el nombre proporcionado, el nombre de Google o vacío
    });

    console.log('User added to Firestore:', user.uid);
    router.push('/profile');
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
  }
};
</script>

<style scoped>
.v-btn {
  text-transform: none;
}
</style>
