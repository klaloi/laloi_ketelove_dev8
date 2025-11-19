// AppHeader.tsx - VERSION OPTIMISÉE (identique au menu Home)
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { get, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebaseConfig";

interface AppHeaderProps {
  userData: any;
  setUserData: (data: any) => void;
  setInitials: (init: string | null) => void;
}

export default function AppHeader({ userData, setUserData, setInitials }: AppHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [initials, setLocalInitials] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  // Hooks Clerk
  const { isSignedIn, signOut: clerkSignOut } = useAuth();
  const { user: clerkUser } = useUser();

  // Récupération des infos utilisateur (Firebase OU Clerk)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 1️⃣ Vérifier si utilisateur Firebase est connecté
        const firebaseUser = auth.currentUser;
        
        if (firebaseUser) {
          console.log("🔥 Firebase user detected:", firebaseUser.uid);
          const uid = firebaseUser.uid;
          const userRef = ref(db, "users/" + uid);
          
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            const completeUserData = {
              ...data,
              uid,
              email: firebaseUser.email,
              authProvider: data.authProvider || 'firebase'
            };
            
            setUserData(completeUserData);
            setIsConnected(true);

            const fInitial = data.firstName ? data.firstName[0].toUpperCase() : "";
            const lInitial = data.lastName ? data.lastName[0].toUpperCase() : "";
            const init = fInitial + lInitial;
            
            setLocalInitials(init);
            setInitials(init);
            
            console.log("✅ Firebase user data loaded:", completeUserData);
          }
        } 
        // 2️⃣ Sinon vérifier si utilisateur Clerk est connecté
        else if (isSignedIn && clerkUser) {
          console.log("🔵 Clerk user detected:", clerkUser.id);
          
          const clerkUserId = clerkUser.id;
          const userRef = ref(db, "users/" + clerkUserId);
          
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            const completeUserData = {
              ...data,
              uid: clerkUserId,
              clerkUserId: clerkUserId,
              email: clerkUser.primaryEmailAddress?.emailAddress || data.email,
              authProvider: data.authProvider || 'clerk'
            };
            
            setUserData(completeUserData);
            setIsConnected(true);

            const fInitial = data.firstName ? data.firstName[0].toUpperCase() : "";
            const lInitial = data.lastName ? data.lastName[0].toUpperCase() : "";
            const init = fInitial + lInitial;
            
            setLocalInitials(init);
            setInitials(init);
            
            console.log("✅ Clerk user data loaded:", completeUserData);
          } else {
            // Si pas de données dans Firebase, créer depuis Clerk
            console.log("⚠️ No Firebase data, creating from Clerk user");
            
            const firstName = clerkUser.firstName || "";
            const lastName = clerkUser.lastName || "";
            const email = clerkUser.primaryEmailAddress?.emailAddress || "";
            
            const newUserData = {
              uid: clerkUserId,
              clerkUserId: clerkUserId,
              firstName,
              lastName,
              email,
              phone: clerkUser.primaryPhoneNumber?.phoneNumber || "",
              address: "",
              authProvider: 'clerk',
              initials: `${firstName[0]?.toUpperCase() || ""}${lastName[0]?.toUpperCase() || ""}`
            };
            
            setUserData(newUserData);
            setIsConnected(true);
            
            const init = `${firstName[0]?.toUpperCase() || ""}${lastName[0]?.toUpperCase() || ""}`;
            setLocalInitials(init);
            setInitials(init);
            
            console.log("✅ Created user data from Clerk:", newUserData);
          }
        } else {
          console.log("❌ No authenticated user found");
          setIsConnected(false);
          setUserData(undefined);
          setLocalInitials(null);
          setInitials(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert(
          "Erreur",
          "Impossible de récupérer vos informations utilisateur."
        );
      }
    };

    fetchUserData();
  }, [isSignedIn, clerkUser]);

  // Navigation vers AddProducts avec tous les paramètres
  const handleNavigateToAddProducts = () => {
    setMenuVisible(false);

    // Vérifier si l'utilisateur est connecté
    if (!userData || !userData.uid) {
      Alert.alert(
        "Non connecté",
        "Vous devez vous connecter pour publier un produit.",
        [
          {
            text: "Se connecter",
            onPress: () => router.push("/Login"),
          },
          {
            text: "S'inscrire",
            onPress: () => router.push("/Connection"),
          },
          {
            text: "Annuler",
            style: "cancel",
          },
        ]
      );
      return;
    }

    console.log("➕ Navigation vers AddProducts depuis AppHeader");
    console.log("📦 Données utilisateur:", userData);

    // Passer tous les paramètres nécessaires
    router.push({
      pathname: "../AddProducts",
      params: {
        userId: userData.uid,
        userFirstName: userData.firstName || "",
        userLastName: userData.lastName || "",
        userEmail: userData.email || "",
        userPhone: userData.phone || "",
        userAddress: userData.address || "",
        userImageUrl: userData.imageUrl || "",
        userInitials: initials || "",
      },
    });
  };

  // Fonction de déconnexion universelle (Firebase + Clerk)
  const handleSignOut = async () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🚪 Starting logout process...");
              
              // Déconnexion Firebase
              const firebaseUser = auth.currentUser;
              if (firebaseUser) {
                console.log("Logging out from Firebase...");
                await signOut(auth);
              }
              
              // Déconnexion Clerk
              if (isSignedIn) {
                console.log("Logging out from Clerk...");
                await clerkSignOut();
              }
              
              // Réinitialiser l'état
              setUserData(undefined);
              setInitials(null);
              setLocalInitials(null);
              setIsConnected(false);
              setUserMenuVisible(false);
              
              console.log("✅ Logout successful");
              
              Alert.alert("Déconnecté ✅", "Vous avez été déconnecté avec succès.");
              
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Erreur", "Impossible de se déconnecter.");
            }
          },
        },
      ]
    );
  };

  return (
    <View>
      {/* --- Header fixe (identique à Home) --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerButton}>
          <Ionicons name="menu-outline" size={28} color="#0F1E33" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bizay</Text>

        <TouchableOpacity
          onPress={() => setUserMenuVisible(true)}
          style={styles.userContainer}
        >
          {isConnected && initials ? (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          ) : (
            <View style={styles.disconnectedBadge}>
              <Ionicons name="person-outline" size={18} color="#999" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* --- Menu de gauche (identique à Home) --- */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.sideMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#0F1E33" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("../Categories");
              }}
            >
              <Ionicons name="apps-outline" size={22} color="#146C6C" />
              <Text style={styles.menuText}>Catégories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleNavigateToAddProducts}
            >
              <Ionicons name="add-circle-outline" size={22} color="#146C6C" />
              <Text style={styles.menuText}>Publier un produit</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("../Apropos");
              }}
            >
              <Ionicons name="information-circle-outline" size={22} color="#146C6C" />
              <Text style={styles.menuText}>À propos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("../Confidentialite");
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color="#146C6C" />
              <Text style={styles.menuText}>Confidentialité</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- Menu utilisateur (droite, identique à Home) --- */}
      <Modal
        transparent
        visible={userMenuVisible}
        animationType="slide"
        onRequestClose={() => setUserMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setUserMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={[styles.sideMenu, { alignSelf: "flex-end" }]}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>
                {isConnected ? "Mon compte" : "Non connecté"}
              </Text>
              <TouchableOpacity onPress={() => setUserMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#0F1E33" />
              </TouchableOpacity>
            </View>

            {isConnected ? (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setUserMenuVisible(false);
                    if (userData) {
                      router.push({
                        pathname: "../MonCompte",
                        params: { userData: JSON.stringify(userData) },
                      });
                    }
                  }}
                >
                  <Ionicons name="person-outline" size={22} color="#146C6C" />
                  <Text style={styles.menuText}>Mon profil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setUserMenuVisible(false);
                    if (userData) {
                      router.push({
                        pathname: "../MonCompte",
                        params: { userId: userData.uid },
                      });
                    }
                  }}
                >
                  <Ionicons name="cube-outline" size={22} color="#146C6C" />
                  <Text style={styles.menuText}>Mes produits</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                  <Ionicons name="log-out-outline" size={22} color="#D9534F" />
                  <Text style={[styles.menuText, { color: "#D9534F" }]}>Déconnexion</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setUserMenuVisible(false);
                    router.push("/Login");
                  }}
                >
                  <Ionicons name="log-in-outline" size={22} color="#146C6C" />
                  <Text style={styles.menuText}>Se connecter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setUserMenuVisible(false);
                    router.push("/Connection");
                  }}
                >
                  <Ionicons name="person-add-outline" size={22} color="#146C6C" />
                  <Text style={styles.menuText}>S'inscrire</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#146C6C",
  },
  userContainer: {
    padding: 5,
  },
  initialsContainer: {
    backgroundColor: "#146C6C",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  disconnectedBadge: {
    backgroundColor: "#F0F0F0",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sideMenu: {
    width: 280,
    backgroundColor: "#fff",
    height: "100%",
    paddingTop: 50,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F1E33",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#0F1E33",
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 10,
  },
});