import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { child, get, onValue, ref, update } from "firebase/database";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../../components/AppHearder";
import { db } from "../../firebaseConfig";
import { ProductData, UserData } from "../../types/types";

export default function MonCompteScreen() {
  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [userProducts, setUserProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Champs d'édition
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const auth = getAuth();
  const router = useRouter();

  //Hooks Clerk pour supporter OAuth
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isSignedIn: isClerkSignedIn } = useAuth();

  //Charger les données utilisateur (Firebase + Clerk)
  useEffect(() => {
    let productsUnsubscribe: (() => void) | null = null;

    const loadUser = async () => {
      setLoading(true);

      //On vérifie d'abord si connecté via Clerk
      if (clerkLoaded && isClerkSignedIn && clerkUser) {

        const userId = clerkUser.id;
        await loadUserInfo(userId);

        //Écouter les produits de cet utilisateur qui est connecté
        const userProductsRef = ref(db, `products/${userId}`);
        
        productsUnsubscribe = onValue(
          userProductsRef,
          (snapshot) => {
            const products: ProductData[] = [];
            
            if (snapshot.exists()) {
              snapshot.forEach((childSnap) => {
                const val = childSnap.val();
                products.push({
                  id: childSnap.key || "",
                  key: childSnap.key || "",
                  ...val,
                });
              });
            } else {
              Alert.alert("Vous n'avez pas encore posté de produits.");
            }

            products.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            //On fait le total des produits chargés
            setUserProducts(products);
            setLoading(false);
          },
          (err) => {
            Alert.alert("❌ Erreur lors de l'écoute des produits:");
            setUserProducts([]);
            setLoading(false);
          }
        );

        return;
      }

      //Puis on verifie si l'utilisateur est connecté avec Firebase Auth
      const unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {          
          await loadUserInfo(user.uid);

          const userProductsRef = ref(db, `products/${user.uid}`);
          
          productsUnsubscribe = onValue(
            userProductsRef,
            (snapshot) => {
              const products: ProductData[] = [];
              
              if (snapshot.exists()) {
                snapshot.forEach((childSnap) => {
                  const val = childSnap.val();
                  products.push({
                    id: childSnap.key || "",
                    key: childSnap.key || "",
                    ...val,
                  });
                });
              } else {
                Alert.alert("Aucun produit trouvé pour cet utilisateur");
              }

              products.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
              });

              setUserProducts(products);
              setLoading(false);
            },
            (err) => {
              Alert.alert("On n'arrive pas a trouver vos produits pour l'instant, Veuillez réessayer plus tard !",);
              setUserProducts([]);
              setLoading(false);
            }
          );
        } else {
          setUserInfo(null);
          setUserProducts([]);
          setLoading(false);

          //Redirection vers connexion
          Alert.alert(
            "Non connecté",
            "Vous devez vous connecter pour accéder à votre compte.",
            [
              {
                text: "Se connecter",
                onPress: () => router.push("/Login")
              },
              {
                text: "S'inscrire",
                onPress: () => router.push("/Connection")
              }
            ]
          );
        }
      });

      return () => {
        if (unsubAuth) unsubAuth();
      };
    };

    loadUser();

    //Nettoyage de l'ecouteur des produits
    return () => {
      if (productsUnsubscribe) {
        productsUnsubscribe();
      }
    };
  }, [clerkLoaded, isClerkSignedIn, clerkUser]);

  //Recharger l'info utilisateur quand l'écran est focus
  useFocusEffect(
    useCallback(() => {
      const loadOnFocus = async () => {
        //Priorité à Clerk
        if (clerkLoaded && isClerkSignedIn && clerkUser) {
          await loadUserInfo(clerkUser.id);
        } 
        //Sinon Firebase
        else if (auth.currentUser) {
          await loadUserInfo(auth.currentUser.uid);
        }
      };

      loadOnFocus().catch((err) => {
        Alert.alert("Erreur de chargement des produits.", err);
      });
    }, [clerkLoaded, isClerkSignedIn, clerkUser])
  );

  //Lecture des informations utilisateur
  const loadUserInfo = async (uid: string) => {
    try {
      console.log("📖 Chargement des infos utilisateur:", uid);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${uid}`));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userData = { ...data, uid };
        setUserInfo(userData);

        //Pré-remplissage des champs d'édition
        setEditFirstName(data.firstName || "");
        setEditLastName(data.lastName || "");
        setEditPhone(data.phone || "");
        setEditAddress(data.address || "");

        //Créer les initials des utilisateurs
        const fInitial = (data.firstName?.[0] || "").toUpperCase();
        const lInitial = (data.lastName?.[0] || "").toUpperCase();
        setInitials(fInitial + lInitial);
        
      } else {
        Alert.alert("Aucune info utilisateur trouvée pour l'utilisateur.");
        
        //Si connecté via Clerk mais pas de données Firebase, utiliser Clerk
        if (clerkUser) {
          const firstName = clerkUser.firstName || "";
          const lastName = clerkUser.lastName || "";
          const fInitial = firstName[0]?.toUpperCase() || "";
          const lInitial = lastName[0]?.toUpperCase() || "";
          
          const clerkData: UserData = {
            uid: clerkUser.id,
            firstName: firstName,
            lastName: lastName,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            phone: clerkUser.primaryPhoneNumber?.phoneNumber || "",
            address: "",
            initials: fInitial + lInitial,
          };
          //Utilisation des données sur clerk
          setUserInfo(clerkData);
          setInitials(fInitial + lInitial);
          setEditFirstName(firstName);
          setEditLastName(lastName);
          setEditPhone(clerkUser.primaryPhoneNumber?.phoneNumber || "");
          
        
        } else {
          setUserInfo(null);
        }
      }
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de charger vos informations utilisateur.");
      setUserInfo(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      //Priorité à Clerk
      if (clerkUser) {
        await loadUserInfo(clerkUser.id);
      } 
      //Sinon Firebase
      else if (auth.currentUser) {
        await loadUserInfo(auth.currentUser.uid);
      }
    } catch (err) {
      Alert.alert("Erreur lors du rafraîchissement");
    } finally {
      setRefreshing(false);
    }
  };

  const openEditModal = () => {
    if (!userInfo) {
      Alert.alert("Erreur", "Aucune information utilisateur disponible.");
      return;
    }

    setEditFirstName(userInfo.firstName || "");
    setEditLastName(userInfo.lastName || "");
    setEditPhone(userInfo.phone || "");
    setEditAddress(userInfo.address || "");

    setEditModalVisible(true);
  };

  const handleSaveChanges = async () => {
    if (!userInfo || !userInfo.uid) {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
      return;
    }

    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert("Erreur", "Le prénom et le nom sont obligatoires.");
      return;
    }

    setIsEditing(true);

    try {
      const userRef = ref(db, `users/${userInfo.uid}`);

      const updates: any = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
      };

      //Mettre à jour les initiales apres modification
      const fInitial = editFirstName[0]?.toUpperCase() || "";
      const lInitial = editLastName[0]?.toUpperCase() || "";
      updates.initials = fInitial + lInitial;

      await update(userRef, updates);

      //Mettre à jour l'état local
      const updatedUserInfo = {
        ...userInfo,
        ...updates,
      };

      setUserInfo(updatedUserInfo);
      setInitials(updates.initials);

      Alert.alert("Succès ✅", "Vos informations ont été mises à jour.");
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    } finally {
      setIsEditing(false);
    }
  };

  const openProductDetail = (product: ProductData) => {
    if (!userInfo) {
      Alert.alert("Erreur", "Informations utilisateur non disponibles.");
      return;
    }

    //Récupérer l'ID utilisateur (Clerk ou Firebase)
    const currentUid = clerkUser?.id || auth.currentUser?.uid || "";


    router.push({
      pathname: "../ProductDetailScreen",
      params: {
        product: JSON.stringify(product),
        userId: currentUid,
        currentUserId: currentUid,
        userFirstName: userInfo.firstName || "",
        userLastName: userInfo.lastName || "",
        userEmail: userInfo.email || "",
        userPhone: userInfo.phone || "",
        userAddress: userInfo.address || "",
        userImageUrl: userInfo.imageUrl || "",
        userInitials: initials || "",
      },
    });
  };

  const navigateToAddProducts = () => {
    if (!userInfo) {
      Alert.alert("Erreur", "Veuillez vous connecter pour ajouter un produit.");
      return;
    }

    router.push({
      pathname: "../AddProducts",
      params: {
        userId: userInfo.uid,
        userFirstName: userInfo.firstName || "",
        userLastName: userInfo.lastName || "",
        userEmail: userInfo.email || "",
        userPhone: userInfo.phone || "",
        userAddress: userInfo.address || "",
        userImageUrl: userInfo.imageUrl || "",
        userInitials: initials || "",
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#146C6C" />
        <Text style={{ color: "#146C6C", marginTop: 10 }}>
          Chargement de vos informations...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppHeader
        userData={userInfo}
        setUserData={setUserInfo}
        setInitials={setInitials}
      />

      <FlatList
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/*Section Profil*/}
            {userInfo ? (
              <View style={styles.userInfo}>
                <Image
                  source={{
                    uri:
                      userInfo.imageUrl ||
                      clerkUser?.imageUrl ||
                      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                  }}
                  style={styles.avatar}
                />
                <Text style={styles.name}>
                  {userInfo.firstName} {userInfo.lastName}
                </Text>
                <Text style={styles.email}>{userInfo.email}</Text>

                {/* Badge du provider */}
                {clerkUser && (
                  <View style={styles.providerBadge}>
                    <Ionicons name="logo-google" size={14} color="#4285F4" />
                    <Text style={styles.providerText}>Connecté via OAuth</Text>
                  </View>
                )}

                {userInfo.phone && (
                  <Text style={styles.infoText}>📞 {userInfo.phone}</Text>
                )}
                {userInfo.address && (
                  <Text style={styles.infoText}>📍 {userInfo.address}</Text>
                )}

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={openEditModal}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.editButtonText}>Modifier mes informations</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noInfoBox}>
                <Ionicons name="person-add-outline" size={60} color="#ccc" />
                <Text style={styles.noInfoText}>
                  Vous n'avez pas encore créé de compte.
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => router.push("/Connection")}
                >
                  <Text style={styles.addButtonText}>Créer un compte</Text>
                </TouchableOpacity>
              </View>
            )}

            {/*Section Produits */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🛍️ Mes produits postés</Text>
              <Text style={styles.productCount}>({userProducts.length})</Text>
            </View>
          </>
        }
        data={userProducts}
        keyExtractor={(item, index) => item.id || item.key || index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            activeOpacity={0.8}
            onPress={() => openProductDetail(item)}
          >
            <Image
              source={{
                uri:
                  item.imageUrl ||
                  "https://cdn-icons-png.flaticon.com/512/3081/3081986.png",
              }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.productPrice}>{item.price} HTG</Text>
              <Text style={styles.productDesc} numberOfLines={2}>
                {item.description}
              </Text>
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={60} color="#ccc" />
            <Text style={styles.noProduct}>
              Vous n'avez encore posté aucun produit.
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={navigateToAddProducts}
            >
              <Text style={styles.addButtonText}>+ Ajouter mon premier produit</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          userProducts.length > 0 ? (
            <TouchableOpacity
              style={[styles.addButton, { marginTop: 20, marginBottom: 20 }]}
              onPress={navigateToAddProducts}
            >
              <Text style={styles.addButtonText}>+ Ajouter un autre produit</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/*Modal d'édition des informations de l'utilisateur */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier mes informations</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="Prénom"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Nom"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Ex: +509 1234 5678"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Adresse</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Adresse complète"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.requiredNote}>* Champs obligatoires</Text>

              <TouchableOpacity
                style={[styles.saveButton, isEditing && styles.buttonDisabled]}
                onPress={handleSaveChanges}
                disabled={isEditing}
              >
                {isEditing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
                disabled={isEditing}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

//Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Profil
  userInfo: { alignItems: "center", marginVertical: 20, paddingHorizontal: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#146C6C",
  },
  name: { fontSize: 22, fontWeight: "bold", color: "#0F1E33", marginTop: 8 },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 8,
  },
  providerText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  infoText: {
    color: "#555",
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#146C6C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  //Sections vides
  noInfoBox: {
    alignItems: "center",
    marginVertical: 30,
    padding: 20,
  },
  noInfoText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 15,
    fontSize: 16,
  },
  emptyBox: {
    alignItems: "center",
    marginVertical: 20,
    padding: 20,
  },
  noProduct: {
    textAlign: "center",
    color: "#999",
    marginVertical: 15,
    fontSize: 15,
  },

  //Section produits
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#146C6C",
  },
  productCount: {
    fontSize: 16,
    color: "#999",
    marginLeft: 8,
  },
  productCard: {
    flexDirection: "row",
    marginVertical: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  productInfo: { flex: 1, marginLeft: 12 },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F1E33",
  },
  productPrice: {
    fontSize: 15,
    color: "#146C6C",
    marginVertical: 4,
    fontWeight: "600",
  },
  productDesc: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: "#E6F2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  categoryText: {
    fontSize: 11,
    color: "#146C6C",
    fontWeight: "600",
  },

  //Boutons
  addButton: {
    backgroundColor: "#146C6C",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  //Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F1E33",
  },
  modalContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F1E33",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F6F6F6",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#0F1E33",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  requiredNote: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 10,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#146C6C",
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});