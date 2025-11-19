import { useAuth, useOAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, saveUserToRealtimeDB } from "../firebaseConfig";
import { RootStackParamList } from "../types/types";

type ConnectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Connection"
>;

export default function ConnectionScreen() {
  const router = useRouter();
  const navigation = useNavigation<ConnectionScreenNavigationProp>();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

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
        "Déjà connecté !",
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

  //Vérifier avant toute tentative d'inscription
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

  // Inscription avec Firebase (Email/Password)
  const handleSignUp = async () => {
    // Vérifier si déjà connecté
    if (checkAlreadyConnected()) return;
    
    if (!firstName || !lastName || !email || !password || !phone || !address) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Création de votre compte...");

    try {
      setLoadingMessage("Vérification des informations...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      setLoadingMessage("Enregistrement de vos données...");
      const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
      const userData = { 
        firstName, 
        lastName, 
        email, 
        phone, 
        address, 
        initials,
        authProvider: 'firebase',
        uid
      };

      await saveUserToRealtimeDB(uid, userData);
      
      setLoadingMessage("Préparation de votre session...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Naviguer directement
      router.replace("/(tabs)/Home");
      
      // Fermer le loading après navigation
      setTimeout(() => {
        setLoading(false);
        setLoadingMessage("");
      }, 500);

    } catch (error: any) {      
      setLoading(false);
      setLoadingMessage("");
      
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Erreur", "Cet email est déjà utilisé sur Bizay.");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Erreur", "Adresse email invalide.");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Erreur", "Le mot de passe est trop faible (6 caractères minimum).");
      } else if (error.code === "auth/network-request-failed") {
        Alert.alert("Erreur", "Problème de connexion internet.");
      } else {
        Alert.alert("Erreur", `Impossible de créer le compte: ${error.message}`);
      }
    }
  };

  //Connexion avec Google via Clerk - VERSION OPTIMISÉE
  const handleGoogleSignIn = async () => {
    if (checkAlreadyConnected()) return;

    setLoading(true);
    setLoadingMessage("Connexion avec Google...");
    
    try {
      setLoadingMessage("Ouverture de Google...");
      const { createdSessionId, setActive, signIn, signUp } = await startGoogleOAuth();

      if (createdSessionId && setActive) {
        setLoadingMessage("Activation de la session...");
        await setActive({ session: createdSessionId });
        
        setLoadingMessage("Récupération des informations...");
        // Augmenter le délai pour s'assurer que tout est chargé
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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


          if (clerkUserId) {
            await saveUserToRealtimeDB(clerkUserId, userData);
          }
        }

        setLoadingMessage("Préparation de votre session...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        
        // Ne pas fermer le loading, naviguer directement
        router.replace("/(tabs)/Home");
        
        // Fermer le loading après la navigation
        setTimeout(() => {
          setLoading(false);
          setLoadingMessage("");
        }, 500);
      }
    } catch (error: any) {
      setLoading(false);
      setLoadingMessage("");
      Alert.alert("Erreur", "Impossible de se connecter avec Google.");
    }
  };

  //Connexion avec Apple via Clerk - VERSION OPTIMISÉE
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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

        setLoadingMessage("Préparation de votre session...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        
        // Naviguer directement sans Alert
        router.replace("/(tabs)/Home");
        
        // Fermer le loading après la navigation
        setTimeout(() => {
          setLoading(false);
          setLoadingMessage("");
        }, 500);
      }
    } catch (error: any) {
      setLoading(false);
      setLoadingMessage("");
      Alert.alert("Erreur", "Impossible de se connecter avec Apple.");
    }
  };

  //Connexion avec Facebook via Clerk - VERSION OPTIMISÉE
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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

        setLoadingMessage("Préparation de votre session...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        
        // Naviguer directement sans Alert
        router.replace("/(tabs)/Home");
        
        // Fermer le loading après la navigation
        setTimeout(() => {
          setLoading(false);
          setLoadingMessage("");
        }, 500);
      }
    } catch (error: any) {
      setLoading(false);
      setLoadingMessage("");
      Alert.alert("Erreur", "Impossible de se connecter avec Facebook.");
    }
  };

  const toggleShowPassword = () => setShowPassword((s) => !s);

  const handleGuestAccess = () => {
    router.replace("/ExploreGuest");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={["#146C6C", "#0F1E33"]} style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Créer votre compte</Text>
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
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor="#999"
              editable={!loading}
            />

            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom"
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor="#999"
              editable={!loading}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              editable={!loading}
            />

            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              editable={!loading}
            />

            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              placeholder="Adresse"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor="#999"
              editable={!loading}
            />

            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={{ flex: 1, fontSize: 14, color: "#0F1E33" }}
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#999"
                editable={!loading}
              />
              <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.buttonDisabled]} 
              onPress={handleSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ["#999", "#666"] : ["#00FFCC", "#00CC99"]}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? "Chargement..." : "S'inscrire"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

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

            <TouchableOpacity 
              style={styles.guestButton} 
              onPress={handleGuestAccess}
              disabled={loading}
            >
              <Text style={styles.guestButtonText}>Explorer sans compte 👀</Text>
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

          <TouchableOpacity
            onPress={() => router.push("/Login")}
            style={styles.existingAccountContainer}
            disabled={loading}
          >
            <Text style={styles.existingAccountText}>
              Déjà un compte ? <Text style={styles.loginText}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

          <Image
            source={require("../assets/images/download.png")}
            style={styles.bottomImage}
            resizeMode="contain"
          />
        </ScrollView>

        {/* Modal de chargement avec message détaillé */}
        <Modal
          transparent
          visible={loading}
          animationType="fade"
        >
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00FFCC" />
              <Text style={styles.loadingTitle}>Inscription en cours</Text>
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
    </KeyboardAvoidingView>
  );
}

const { width: screenWidth } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 30
  },
  header: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 10
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
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 8
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
  guestButton: {
    marginTop: 15,
    alignItems: "center"
  },
  guestButtonText: {
    color: "#146C6C",
    fontWeight: "700",
    fontSize: 15,
    textDecorationLine: "underline",
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
    width: screenWidth * 0.8,
    height: 150,
    marginTop: 20
  },
  existingAccountContainer: {
    marginTop: 15,
    alignItems: "center"
  },
  existingAccountText: {
    color: "#fff",
    fontSize: 14
  },
  loginText: {
    fontWeight: "700",
    color: "#00FFCC"
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