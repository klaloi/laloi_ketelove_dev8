import { useAuth, useOAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { child, get, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db, saveUserToRealtimeDB } from "../firebaseConfig";
import { RootStackParamList } from "../types/types";

const { width } = Dimensions.get("window");

//Définition du type des données utilisateur
type UserData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  initials?: string;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const navigation = useNavigation<LoginScreenNavigationProp>();

  //Hooks Clerk pour vérifier si l'utilisateur est connecté
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  //OAuth Hooks pour Google, Apple, Facebook via Clerk
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: "oauth_facebook" });

  //Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "utilisateur";
      
      Alert.alert(
        "Déjà connecté ✅",
        `Vous êtes déjà connecté en tant que ${userName}. Voulez-vous accéder à l'accueil ?`,
        [
          {
            text: "Rester ici",
            style: "cancel"
          },
          {
            text: "Aller à l'accueil",
            onPress: () => router.replace("/(tabs)/Home")
          }
        ]
      );
    }
  }, [isLoaded, isSignedIn]);

  //Vérifier avant toute tentative de connexion
  const checkAlreadyConnected = (): boolean => {
    if (isSignedIn) {
      const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "utilisateur";
      
      Alert.alert(
        "Déjà connecté ✅",
        `Vous êtes déjà connecté en tant que ${userName}.`,
        [
          {
            text: "Rester ici",
            style: "cancel"
          },
          {
            text: "Aller à l'accueil",
            onPress: () => router.replace("/(tabs)/Home")
          }
        ]
      );
      return true;
    }
    return false;
  };

  //Connexion avec Email/Password (Firebase)
  const handleLogin = async () => {
    // Vérifier si déjà connecté
    if (checkAlreadyConnected()) return;

    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez entrer votre email et mot de passe.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Connexion en cours...");

    try {
      //Étape 1: Authentification Firebase.
      setLoadingMessage("Vérification des identifiants...");
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;


      //Étape 2: Récupération des données utilisateur.
      setLoadingMessage("Récupération de vos informations...");

      const dbRef = ref(db);
      const usersSnapshot = await get(child(dbRef, "users"));

      if (!usersSnapshot.exists()) {
        Alert.alert(
          "Erreur",
          "Aucune donnée utilisateur trouvée. Veuillez vous inscrire d'abord."
        );
        setLoading(false);
        return;
      }

      const users = usersSnapshot.val();

      //Étape 3: Recherche de l'utilisateur correspondant.
      setLoadingMessage("Finalisation de la connexion...");

      const foundUserKey = Object.keys(users).find(
        (key) => users[key].email === email
      );

      if (!foundUserKey) {
        Alert.alert(
          "Erreur",
          "Impossible de récupérer vos informations. Veuillez contacter le support."
        );
        setLoading(false);
        return;
      }

      const foundUser = users[foundUserKey] as UserData;
      const initials = `${foundUser.firstName?.[0]?.toUpperCase() || ""}${
        foundUser.lastName?.[0]?.toUpperCase() || ""
      }`;

      //Étape 4: Attendre un peu pour s'assurer que tout est prêt
      setLoadingMessage("Préparation de votre session...");
      await new Promise(resolve => setTimeout(resolve, 500));

      //Étape 5: Fermer le modal de chargement
      setLoading(false);
      setLoadingMessage("");

      //Étape 6: Afficher le message de succès et rediriger      
      Alert.alert(
        "Connexion réussie ✅", 
        `Bienvenue ${foundUser.firstName} !`,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)/Home");
            }
          }
        ],
        { cancelable: false }
      );
      
      //Redirection automatique après 2 secondes si l'utilisateur ne clique pas
      setTimeout(() => {
        router.replace("/(tabs)/Home");
      }, 2000);

    } catch (error: any) {
      
      if (error.code === "auth/user-not-found") {
        Alert.alert("Erreur", "Aucun compte trouvé avec cet email.");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Erreur", "Mot de passe incorrect.");
      } else if (error.code === "auth/invalid-credential") {
        Alert.alert("Erreur", "Email ou mot de passe incorrect.");
      } else if (error.code === "auth/network-request-failed") {
        Alert.alert("Erreur", "Problème de connexion réseau. Vérifiez votre connexion internet.");
      } else {
        Alert.alert("Erreur", "Impossible de se connecter. Vérifiez vos informations.");
      }
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  //Connexion avec Google via Clerk - VERSION OPTIMISÉE
  const handleGoogleSignIn = async () => {
    if (checkAlreadyConnected()) return;

    setLoading(true);
    setLoadingMessage("Connexion avec Google...");
    console.log("Starting Google OAuth Sign-In with Clerk...");
    
    try {
      setLoadingMessage("Ouverture de Google...");
      const { createdSessionId, setActive, signIn, signUp } = await startGoogleOAuth();

      if (createdSessionId && setActive) {
        setLoadingMessage("Activation de la session...");
        await setActive({ session: createdSessionId });
        
        setLoadingMessage("Récupération des informations...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Si c'est une inscription (nouveau compte)
        if (signUp) {
          setLoadingMessage("Création du profil...");
          const clerkUserId = signUp.createdUserId || "";
          const userEmail = signUp.emailAddress || "";
          const userFirstName = signUp.firstName || "";
          const userLastName = signUp.lastName || "";
          
          const initials = `${userFirstName[0]?.toUpperCase() || ""}${userLastName[0]?.toUpperCase() || ""}`;

          const userData = {
            firstName: userFirstName,
            lastName: userLastName,
            email: userEmail,
            phone: "",
            address: "",
            initials,
            authProvider: 'clerk-google',
            clerkUserId: clerkUserId
          };

          console.log("Google User Data (Sign Up):", userData);

          if (clerkUserId) {
            await saveUserToRealtimeDB(clerkUserId, userData);
          }
        }

        setLoadingMessage("Finalisation...");
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fermer le loading avant l'alert
        setLoading(false);
        setLoadingMessage("");

        Alert.alert(
          "Connexion réussie ✅", 
          "Bienvenue sur Bizay !",
          [
            {
              text: "OK",
              onPress: () => {
                console.log("📍 Navigation vers Home depuis Google");
                router.replace("/(tabs)/Home");
              }
            }
          ],
          { cancelable: false }
        );

        // Redirection automatique après 2 secondes
        setTimeout(() => {
          console.log("📍 Navigation automatique vers Home depuis Google");
          router.replace("/(tabs)/Home");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      Alert.alert("Erreur", "Impossible de se connecter avec Google.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  //Connexion avec Apple via Clerk.
  const handleAppleSignIn = async () => {
    if (checkAlreadyConnected()) return;

    setLoading(true);
    setLoadingMessage("Connexion avec Apple...");
    
    try {
      setLoadingMessage("Ouverture d'Apple...");
      const { createdSessionId, setActive, signIn, signUp } = await startAppleOAuth();

      if (createdSessionId && setActive) {
        setLoadingMessage("Activation de la session...");
        await setActive({ session: createdSessionId });
        
        setLoadingMessage("Récupération des informations...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (signUp) {
          setLoadingMessage("Création du profil...");
          const clerkUserId = signUp.createdUserId || "";
          const userEmail = signUp.emailAddress || "";
          const userFirstName = signUp.firstName || "";
          const userLastName = signUp.lastName || "";
          
          const initials = `${userFirstName[0]?.toUpperCase() || ""}${userLastName[0]?.toUpperCase() || ""}`;

          const userData = {
            firstName: userFirstName,
            lastName: userLastName,
            email: userEmail,
            phone: "",
            address: "",
            initials,
            authProvider: 'clerk-apple',
            clerkUserId: clerkUserId
          };

          if (clerkUserId) {
            await saveUserToRealtimeDB(clerkUserId, userData);
          }
        }

        setLoadingMessage("Finalisation...");
        await new Promise(resolve => setTimeout(resolve, 500));

        //Fermer le loading avant l'alert
        setLoading(false);
        setLoadingMessage("");

        Alert.alert(
          "Connexion réussie ✅", 
          "Bienvenue sur Bizay !",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(tabs)/Home");
              }
            }
          ],
          { cancelable: false }
        );

        //Redirection automatique après 2 secondes
        setTimeout(() => {
          router.replace("/(tabs)/Home");
        }, 2000);
      }
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de se connecter avec Apple.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  //Connexion avec Facebook via Clerk 
  const handleFacebookSignIn = async () => {
    if (checkAlreadyConnected()) return;

    setLoading(true);
    setLoadingMessage("Connexion avec Facebook...");
    
    try {
      setLoadingMessage("Ouverture de Facebook...");
      const { createdSessionId, setActive, signIn, signUp } = await startFacebookOAuth();

      if (createdSessionId && setActive) {
        setLoadingMessage("Activation de la session...");
        await setActive({ session: createdSessionId });
        
        setLoadingMessage("Récupération des informations...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (signUp) {
          setLoadingMessage("Création du profil...");
          const clerkUserId = signUp.createdUserId || "";
          const userEmail = signUp.emailAddress || "";
          const userFirstName = signUp.firstName || "";
          const userLastName = signUp.lastName || "";
          
          const initials = `${userFirstName[0]?.toUpperCase() || ""}${userLastName[0]?.toUpperCase() || ""}`;

          const userData = {
            firstName: userFirstName,
            lastName: userLastName,
            email: userEmail,
            phone: "",
            address: "",
            initials,
            authProvider: 'clerk-facebook',
            clerkUserId: clerkUserId
          };


          if (clerkUserId) {
            await saveUserToRealtimeDB(clerkUserId, userData);
          }
        }

        setLoadingMessage("Finalisation...");
        await new Promise(resolve => setTimeout(resolve, 500));

        //Fermer le loading avant l'alert
        setLoading(false);
        setLoadingMessage("");

        Alert.alert(
          "Connexion réussie ✅", 
          "Bienvenue sur Bizay !",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(tabs)/Home");
              }
            }
          ],
          { cancelable: false }
        );

        //Redirection automatique après 2 secondes
        setTimeout(() => {
          router.replace("/(tabs)/Home");
        }, 2000);
      }
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de se connecter avec Facebook.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <LinearGradient colors={["#146C6C", "#0F1E33"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Se connecter</Text>
        </View>

        {/* Badge si déjà connecté */}
        {isSignedIn && (
          <View style={styles.alreadyConnectedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#00CC99" />
            <Text style={styles.alreadyConnectedText}>
              Déjà connecté en tant que {user?.firstName || "utilisateur"}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, paddingVertical: 0, marginBottom: 0 }]}
              placeholder="************"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={showPassword ? "#146C6C" : "#999"}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#999", "#666"] : ["#00FFCC", "#00CC99"]}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Chargement..." : "Se connecter"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Ou continuer avec</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Boutons OAuth via Clerk */}
          <View style={styles.socialButtonsContainer}>
            {/* Google */}
            <TouchableOpacity 
              style={[styles.socialButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Image 
                source={{ uri: 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png' }}
                style={styles.socialIcon}
              />
            </TouchableOpacity>

            {/* Apple - iOS uniquement */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={[styles.socialButton, loading && styles.buttonDisabled]}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                <Ionicons name="logo-apple" size={30} color="#000" />
              </TouchableOpacity>
            )}

            {/* Facebook */}
            <TouchableOpacity 
              style={[styles.socialButton, loading && styles.buttonDisabled]}
              onPress={handleFacebookSignIn}
              disabled={loading}
            >
              <Ionicons name="logo-facebook" size={30} color="#1877F2" />
            </TouchableOpacity>
          </View>

          {/* Lien vers inscription */}
          <TouchableOpacity 
            style={styles.signupButton}
            onPress={() => router.push("/Connection")}
            disabled={loading}
          >
            <Text style={styles.signupText}>
              Pas encore de compte ? <Text style={styles.signupLink}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bouton direct vers Home si déjà connecté */}
        {isSignedIn && (
          <TouchableOpacity 
            style={styles.goToHomeButton}
            onPress={() => router.replace("/(tabs)/Home")}
          >
            <LinearGradient
              colors={["#00FFCC", "#00CC99"]}
              style={styles.goToHomeButtonGradient}
            >
              <Ionicons name="home" size={20} color="#0F1E33" style={{ marginRight: 8 }} />
              <Text style={styles.goToHomeButtonText}>Aller à l'accueil</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Image
          source={require("../assets/images/download.png")}
          style={styles.bottomImage}
          resizeMode="contain"
        />
      </ScrollView>

      {/*Modal de chargement avec message détaillé */}
      <Modal
        transparent
        visible={loading}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FFCC" />
            <Text style={styles.loadingTitle}>Connexion en cours</Text>
            <Text style={styles.loadingMessage}>{loadingMessage}</Text>
            <View style={styles.loadingDotsContainer}>
              <View style={[styles.loadingDot, styles.loadingDot1]} />
              <View style={[styles.loadingDot, styles.loadingDot2]} />
              <View style={[styles.loadingDot, styles.loadingDot3]} />
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollContent: {
    paddingTop: 50, 
    alignItems: "center",
    paddingBottom: 30
  },
  header: { 
    width: "90%", 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20 
  },
  backButton: { 
    marginRight: 10 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#fff" 
  },
  alreadyConnectedBadge: {
    width: "90%",
    backgroundColor: "rgba(0, 255, 204, 0.2)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#00FFCC",
  },
  alreadyConnectedText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  label: { 
    color: "#0F1E33", 
    fontWeight: "600", 
    marginBottom: 6, 
    fontSize: 14 
  },
  input: {
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    marginBottom: 20,
    color: "#0F1E33",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 25,
    paddingVertical: 12,
  },
  loginButton: { 
    borderRadius: 25, 
    overflow: "hidden", 
    marginBottom: 15 
  },
  loginButtonGradient: {
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  loginButtonText: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#0F1E33" 
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 13,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  socialIcon: {
    width: 30,
    height: 30,
  },
  signupButton: {
    marginTop: 10,
    alignItems: "center",
  },
  signupText: {
    color: "#666",
    fontSize: 14,
  },
  signupLink: {
    color: "#146C6C",
    fontWeight: "700",
  },
  goToHomeButton: {
    width: "90%",
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 15,
  },
  goToHomeButtonGradient: {
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  goToHomeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1E33",
  },
  bottomImage: { 
    width: width * 0.8, 
    height: 150, 
    marginTop: 20 
  },
  // Styles pour le modal de chargement
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    minWidth: 250,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F1E33",
    marginTop: 15,
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  loadingDotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00FFCC",
  },
  loadingDot1: {
    opacity: 0.3,
  },
  loadingDot2: {
    opacity: 0.6,
  },
  loadingDot3: {
    opacity: 1,
  },
});