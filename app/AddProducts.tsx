import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHearder";
import { addProduct, auth } from "../firebaseConfig";

const categories = [
  "Épices",
  "Légumes",
  "Denrées",
  "Fruits",
  "Vetements Hommes",
  "Vêtements Femmes",
  "Vêtements pour enfants",
  "Accessoires",
  "Condiments",
  "Tubercules",
  "Boissons",
  "Produits laitiers",
  "Céréales",
  "Viandes",
  "Poissons & Fruits de mer",
  "Œufs",
  "Huiles & Graisses",
  "Produits sucrés",
  "Produits de boulangerie",
  "Herbes aromatiques",
  "Noix & Graines",
  "Produits transformés",
  "Aliments secs",
  "Produits bio",
  "Produits importés",
  "Produits locaux",
  "Conserves",
  "Surgelés",
  "Snacks & Collations",
  "Autres",
];

export default function AddProductScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  //
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  
  //Récupération des informations de l'utilisateur depuis les paramètres OU Clerk OU Firebase
  const userId = (params.userId as string) || clerkUser?.id || auth.currentUser?.uid;
  const userFirstName = (params.userFirstName as string) || clerkUser?.firstName || "";
  const userLastName = (params.userLastName as string) || clerkUser?.lastName || "";
  const userEmail = (params.userEmail as string) || clerkUser?.primaryEmailAddress?.emailAddress || "";
  const userPhone = (params.userPhone as string) || clerkUser?.primaryPhoneNumber?.phoneNumber || "";
  const userAddress = (params.userAddress as string) || "";
  const userImageUrl = (params.userImageUrl as string) || clerkUser?.imageUrl || "";
  const userInitials = (params.userInitials as string) || "";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState<string>("");
  
  //État pour AppHeader
  const [userInfo, setUserInfo] = useState<any>(null);
  const [initials, setInitials] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  //Charger les informations utilisateur au chargement de la page
  useEffect(() => {
    console.log("🔍 AddProduct - Chargement des données utilisateur");
    console.log("- userId (params):", params.userId);
    console.log("- Clerk user:", clerkUser?.id);
    console.log("- Firebase user:", auth.currentUser?.uid);
    console.log("- userId final:", userId);

    //Transferer userData depuis n'importe quelle source disponible
    if (userId) {
      const userData = {
        uid: userId,
        firstName: userFirstName,
        lastName: userLastName,
        email: userEmail,
        phone: userPhone,
        address: userAddress,
        imageUrl: userImageUrl,
        initials: userInitials || `${userFirstName[0]?.toUpperCase() || ""}${userLastName[0]?.toUpperCase() || ""}`,
      };
      
      setUserInfo(userData);
      setInitials(userData.initials);

      // Remplir au chargement le contact et l'adresse si disponibles
      if (userPhone) {
        const phoneWithoutPrefix = userPhone.replace(/^509/, "");
        setContact(phoneWithoutPrefix);
      }
      if (userAddress) {
        setLocation(userAddress);
      }
    } else {
      Alert.alert(
        "Non connecté",
        "Vous devez vous connecter pour publier un produit.",
        [
          {
            text: "Se connecter",
            onPress: () => router.push("/Login")
          },
          {
            text: "Annuler",
            style: "cancel",
            onPress: () => router.back()
          }
        ]
      );
    }
  }, [userId, userFirstName, userLastName, userEmail, userPhone, userAddress, userImageUrl, userInitials, clerkUser, clerkLoaded]);

  //Choisir une image
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission refusée", "Autorisez l'accès à vos photos pour ajouter une image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  //Publier un produit
  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (!name || !description || !price || !image || !selectedCategory || !contact || !location) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs, ajouter une image et une localisation !");
      return;
    }

    if (contact.length !== 8) {
      Alert.alert("Erreur", "Le numéro doit contenir exactement 8 chiffres après le +509.");
      return;
    }

    //
    let uid = userId;
    
    // Si pas d'uid dans les params, essayer les autres sources
    if (!uid) {
      //Dans clerk, else dans firebase
      if (clerkLoaded && clerkUser?.id) {
        uid = clerkUser.id;
      } else if (auth.currentUser?.uid) {
        uid = auth.currentUser.uid;
      }
    }


    if (!uid) {
      Alert.alert(
        "Erreur de connexion",
        "Impossible d'identifier votre compte. Veuillez vous reconnecter.",
        [
          {
            text: "Se reconnecter",
            onPress: () => router.push("/Login")
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
      return;
    }

    try {
      const fullContact = "509" + contact;
      //Ajouter le produit produit avec l'id de l'utilisateur connecté
      await addProduct(uid, {
        title: name,
        price,
        description,
        imageUrl: image,
        category: selectedCategory,
        location,
        contact: fullContact,
      });

      Alert.alert(
        "🎉 Succès", 
        `Produit "${name}" ajouté avec succès !`,
        [
          {
            text: "OK",
            onPress: () => {
              //Réinitialiser les champs
              setName("");
              setDescription("");
              setPrice("");
              setImage(null);
              setSelectedCategory(null);
              setContact(userPhone ? userPhone.replace(/^509/, "") : "");
              setLocation(userAddress || "");
              
              //Scroll vers le haut
              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert("Erreur", "Une erreur est survenue lors de la publication du produit.");
    }
  };

  //Rendu d'une catégorie dans le modal
  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedCategory(item);
        setCategoryModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item}</Text>
      {selectedCategory === item && (
        <Ionicons name="checkmark-circle" size={24} color="#0F8B8B" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppHeader userData={userInfo} setUserData={setUserInfo} setInitials={setInitials} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          <Text style={styles.title}>Publier un produit</Text>

          {/*Badge de statut de connexion */}
          {userInfo && (
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.connectedText}>
                Connecté en tant que {userInfo.firstName || userInfo.email || "utilisateur"}
              </Text>
            </View>
          )}

          {/*Image */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="image-outline" size={40} color="#888" />
                <Text style={styles.imageText}>Ajouter une image</Text>
              </>
            )}
          </TouchableOpacity>

          {/*Pour la Catégorie - Ouvre le modal */}
          <TouchableOpacity
            style={styles.categoryPicker}
            onPress={() => {
              Keyboard.dismiss();
              setCategoryModalVisible(true);
            }}
          >
            <Text style={{ color: selectedCategory ? "#0F1E33" : "#888" }}>
              {selectedCategory || "Sélectionner une catégorie"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#0F1E33" />
          </TouchableOpacity>

          {/*Nom du produit */}
          <TextInput
            style={styles.input}
            placeholder="Nom du produit"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          {/*Description */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
            returnKeyType="next"
          />

          {/*Prix */}
          <TextInput
            style={styles.input}
            placeholder="Prix (en gourdes)"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            returnKeyType="next"
          />

          {/*Localisation */}
          <TextInput
            style={styles.input}
            placeholder="Votre localisation"
            value={location}
            onChangeText={setLocation}
            returnKeyType="next"
          />

          {/* Contact */}
          <View style={styles.contactContainer}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefixText}>+509</Text>
            </View>
            <TextInput
              style={styles.contactInput}
              placeholder="Ex : 36301234"
              keyboardType="phone-pad"
              maxLength={8}
              value={contact}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "");
                setContact(cleaned);
              }}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bouton Publier en bas */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Publier</Text>
        </TouchableOpacity>
      </View>

      {/* Boutton de selection des catégories*/}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setCategoryModalVisible(false)}
          />
          <View style={styles.modalContainer}>
            {/*Header du modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une catégorie</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#0F1E33" />
              </TouchableOpacity>
            </View>

            {/*Liste des catégories */}
            <FlatList
              data={categories}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={renderCategoryItem}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 100,
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#0F1E33", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#81C784",
  },
  connectedText: {
    marginLeft: 8,
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600",
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  imageText: { color: "#888", marginTop: 5 },
  previewImage: { width: "100%", height: "100%", borderRadius: 10 },
  categoryPicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  prefixContainer: {
    backgroundColor: "#E6F2F2",
    paddingHorizontal: 12,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  prefixText: { fontWeight: "bold", color: "#0F1E33", fontSize: 14 },
  contactInput: { 
    flex: 1, 
    padding: 12,
    fontSize: 14,
  },

  //Bouton FIXE
  fixedButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0F8B8B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#0F8B8B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600", 
    marginLeft: 8 
  },

  //Styles du Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F1E33",
  },
  modalList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  modalItemText: {
    fontSize: 16,
    color: "#0F1E33",
  },
});