import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { get, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHearder";
import { db, deleteProduct, updateProduct } from "../firebaseConfig";

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth();

  //Hooks Clerk
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isSignedIn: isClerkSignedIn } = useAuth();

  //Récupération sécurisée des paramètres
  const productStr = typeof params.product === "string" ? params.product : "{}";
  const productOwnerId = typeof params.userId === "string" ? params.userId : "";
  const guestMode = params.guestMode === "true";

  //Parsing sécurisé du produit
  let product;
  try {
    product = JSON.parse(productStr);
  } catch (error) {
    product = {};
  }

  //États
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sellerInfo, setSellerInfo] = useState<any>(null);

  const [title, setTitle] = useState(product.title || "");
  const [price, setPrice] = useState(product.price || "");
  const [description, setDescription] = useState(product.description || "");
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [location, setLocation] = useState(product.location || "");
  const [contact, setContact] = useState(product.contact || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [userInfo, setUserInfo] = useState<any>(null);
  const [initials, setInitials] = useState<string | null>(null);

  //Déterminer l'utilisateur actuel et vérifier la propriété
  useEffect(() => {
    const determineCurrentUser = async () => {
      setLoading(true);

      let userId = "";

      //Mode invité - pas d'utilisateur
      if (guestMode) {
        setLoading(false);
        return;
      }

      // 1.Vérifier Clerk d'abord.
      if (clerkLoaded && isClerkSignedIn && clerkUser) {
        userId = clerkUser.id;
      }
      // 2.Sinon Firebase.
      else if (auth.currentUser) {
        userId = auth.currentUser.uid;
      } else {
        Alert.alert("⚠️ Aucun utilisateur connecté");
      }

      setCurrentUserId(userId);

      //Vérifier si c'est le propriétaire
      const ownerStatus = userId === productOwnerId || userId === product.userId;
      setIsOwner(ownerStatus);


      // Charger les infos du vendeur si ce n'est pas le propriétaire.
      if (!ownerStatus && (productOwnerId || product.userId)) {
        await loadSellerInfo(productOwnerId || product.userId);
      }

      setLoading(false);
    };

    determineCurrentUser();
  }, [clerkLoaded, isClerkSignedIn, clerkUser, auth.currentUser, guestMode]);

  //Charger les informations du vendeur
  const loadSellerInfo = async (sellerId: string) => {
    try {
      const userRef = ref(db, `users/${sellerId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setSellerInfo(data);

        //Si le produit n'a pas de contact, utiliser celui du vendeur
        if (!contact && data.phone) {
          setContact(data.phone);
        }
      } else {
        Alert.alert("⚠️ Aucune info vendeur trouvée");
      }
    } catch (error) {
      Alert.alert("❌ Erreur chargement infos vendeur.");
    }
  };

  //Sélection d'une image dans la galerie
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission refusée", "Autorisez l'accès à la galerie.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      setImageUrl(selectedImage);
    }
  };

  //Enregistrement des modifications
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Erreur", "Le titre est obligatoire.");
      return;
    }

    if (!price.trim()) {
      Alert.alert("Erreur", "Le prix est obligatoire.");
      return;
    }

    setSaving(true);

    try {
      const ownerId = productOwnerId || product.userId;


      await updateProduct(ownerId, product.id, {
        title: title.trim(),
        price: price.trim(),
        description: description.trim(),
        imageUrl,
        location: location.trim(),
        contact: contact.trim(),
      });

      Alert.alert("✅ Succès", "Produit mis à jour avec succès !");
      setEditing(false);

    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de mettre à jour le produit.");
    } finally {
      setSaving(false);
    }
  };

  //Suppression du produit
  const handleDelete = async () => {
    Alert.alert(
      "Suppression",
      "Voulez-vous vraiment supprimer ce produit ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const ownerId = productOwnerId || product.userId;

              await deleteProduct(ownerId, product.id);

              Alert.alert("✅ Supprimé", "Le produit a été supprimé.");

              router.back();
            } catch (err) {
              Alert.alert("Erreur", "Suppression impossible.");
            }
          },
        },
      ]
    );
  };

  //Contacter le vendeur via WhatsApp
  const handleContactSeller = () => {
    if (guestMode) {
      Alert.alert(
        "Connexion requise",
        "Créez un compte pour contacter les vendeurs.",
        [
          { text: "Plus tard", style: "cancel" },
          {
            text: "Créer un compte",
            onPress: () => router.push("/Connection")
          }
        ]
      );
      return;
    }

    //Priorité : contact du produit > phone du vendeur
    let phoneNumber = contact || sellerInfo?.phone || "";

    //Nettoyer le numéro (enlever espaces, tirets, etc.)
    phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

    if (!phoneNumber) {
      Alert.alert(
        "Numéro indisponible",
        "Le vendeur n'a pas fourni de numéro de contact."
      );
      return;
    }

    //S'assurer que le numéro commence par le code pays (509 pour Haïti)
    if (!phoneNumber.startsWith("509") && !phoneNumber.startsWith("+509")) {
      phoneNumber = "509" + phoneNumber;
    }

    //Enlever le + si présent
    phoneNumber = phoneNumber.replace("+", "");

    const sellerName = sellerInfo
      ? `${sellerInfo.firstName || ""} ${sellerInfo.lastName || ""}`.trim()
      : "le vendeur";

    const message = `Bonjour ${sellerName}, je suis intéressé(e) par votre produit "${title}" publié sur Bizay.`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;


    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert(
            "WhatsApp non disponible",
            "Impossible d'ouvrir WhatsApp. Assurez-vous que l'application est installée."
          );
        }
      })
      .catch((err) => {
        Alert.alert("Erreur", "Impossible d'ouvrir WhatsApp.");
      });
  };

  //Rendu du header de la FlatList
  const renderHeader = () => (
    <>
      {/* Image du produit */}
      <TouchableOpacity
        disabled={!isOwner || !editing}
        onPress={pickImage}
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri:
              imageUrl ||
              "https://cdn-icons-png.flaticon.com/512/3081/3081986.png",
          }}
          style={styles.image}
        />
        {isOwner && editing && (
          <View style={styles.editImageBadge}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.editImageText}>Modifier l'image</Text>
          </View>
        )}
      </TouchableOpacity>

      {/*Badge de propriété */}
      {isOwner && (
        <View style={styles.ownerBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
          <Text style={styles.ownerText}>Votre produit</Text>
        </View>
      )}

      {/*Badge mode invité */}
      {guestMode && (
        <View style={styles.guestBadge}>
          <Ionicons name="eye-outline" size={18} color="#FF9800" />
          <Text style={styles.guestText}>Mode lecture seule</Text>
        </View>
      )}

      {/*Mode édition */}
      {editing ? (
        <View style={styles.editContainer}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Titre du produit"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Prix (HTG) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Prix en HTG"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            placeholder="Description détaillée du produit"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Localisation</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Ex: Port-au-Prince, Delmas 33"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Numéro de contact (WhatsApp)</Text>
          <TextInput
            style={styles.input}
            value={contact}
            onChangeText={setContact}
            placeholder="Ex: +509 1234 5678"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />

          <Text style={styles.requiredNote}>* Champs obligatoires</Text>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setEditing(false)}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /*Mode lecture */
        <View style={styles.detailContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.price}>{price} HTG</Text>

          {product.category && (
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={16} color="#146C6C" />
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>📝 Description</Text>
          <Text style={styles.desc}>
            {description || "Aucune description disponible."}
          </Text>

          <View style={styles.divider} />

          {location ? (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#146C6C" />
              <Text style={styles.location}>{location}</Text>
            </View>
          ) : (
            <Text style={styles.locationEmpty}>
              📍 Localisation non spécifiée
            </Text>
          )}

          {/* nformations du vendeur (si pas propriétaire) */}
          {!isOwner && sellerInfo && (
            <View style={styles.sellerCard}>
              <Text style={styles.sellerTitle}>👤 Vendeur</Text>
              <Text style={styles.sellerName}>
                {sellerInfo.firstName} {sellerInfo.lastName}
              </Text>
              {sellerInfo.email && (
                <Text style={styles.sellerInfo}>📧 {sellerInfo.email}</Text>
              )}
              {(contact || sellerInfo.phone) && (
                <Text style={styles.sellerInfo}>
                  📞 {contact || sellerInfo.phone}
                </Text>
              )}
            </View>
          )}

          {/*Boutons d'action */}
          {isOwner ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setEditing(!editing)}
                disabled={saving}
              >
                <Ionicons
                  name={editing ? "close-circle" : "create"}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>
                  {editing ? "Annuler" : "Modifier"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
                disabled={saving}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.buttonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.contactButton]}
              onPress={handleContactSeller}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              <Text style={styles.buttonText}>
                {guestMode ? "Créer un compte pour contacter" : "Contacter sur WhatsApp"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Message si pas de numéro disponible */}
          {!isOwner && !guestMode && !contact && !sellerInfo?.phone && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color="#FF9800" />
              <Text style={styles.warningText}>
                Le vendeur n'a pas fourni de numéro de contact.
              </Text>
            </View>
          )}
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#146C6C" />
        <Text style={{ color: "#146C6C", marginTop: 10 }}>
          Chargement du produit...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {!guestMode && (
        <AppHeader
          userData={userInfo}
          setUserData={setUserInfo}
          setInitials={setInitials}
        />
      )}

      <FlatList
        data={[]} // Pas de données, juste le header
        renderItem={null}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.flatListContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

//Styles
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  flatListContent: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 30,
  },
  image: {
    width: "100%",
    height: 280,
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
  },
  editImageBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#146C6C",
    borderRadius: 10,
    padding: 12,
    marginTop: -60,
    marginHorizontal: 60,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  editImageText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#81C784",
  },
  ownerText: {
    marginLeft: 8,
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "600",
  },
  guestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  guestText: {
    marginLeft: 8,
    color: "#F57C00",
    fontSize: 14,
    fontWeight: "600",
  },
  editContainer: {
    marginTop: 10,
  },
  detailContainer: {
    marginTop: 10,
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
    marginBottom: 10,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  requiredNote: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 5,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F1E33",
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    color: "#146C6C",
    fontWeight: "700",
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F2F2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 13,
    color: "#146C6C",
    fontWeight: "600",
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 10,
  },
  desc: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  location: {
    fontSize: 15,
    color: "#444",
    marginLeft: 8,
    fontWeight: "500",
  },
  locationEmpty: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 10,
    fontStyle: "italic",
  },
  sellerCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sellerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 10,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#146C6C",
    marginBottom: 5,
  },
  sellerInfo: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 60,
    gap: 10,
  },
  button: {
    flexDirection: "row",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  editButton: {
    backgroundColor: "#146C6C",
  },
  deleteButton: {
    backgroundColor: "#D9534F",
  },
  contactButton: {
    backgroundColor: "#25D366",
    marginTop: 15,
    marginBottom: 40,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
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
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  warningText: {
    marginLeft: 10,
    color: "#F57C00",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
});