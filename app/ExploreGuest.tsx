import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { get, ref } from "firebase/database";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../firebaseConfig";
import { ProductData } from "../types/types";

const { width } = Dimensions.get("window");

export default function GuestExploreScreen() {
  const router = useRouter();

  const [menuVisible, setMenuVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  //Récupération des produits
  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const dbRef = ref(db, "products");
      const snapshot = await get(dbRef);
      
      if (!snapshot.exists()) {
        setAllProducts([]);
        setFilteredProducts([]);
        return;
      }

      const data = snapshot.val();
      const tempProducts: ProductData[] = [];

      const productPromises = Object.keys(data).map(async (uid) => {
        const userProducts = data[uid];
        
        //Récupérer le nom du vendeur
        const userSnapshot = await get(ref(db, `users/${uid}`));
        let postedByFirstName = "Anonyme";
        
        if (userSnapshot.exists()) {
          const u = userSnapshot.val();
          postedByFirstName = u.firstName || "Anonyme";
        }

        //Traiter tous les produits de cet utilisateur
        return Object.keys(userProducts).map((key) => {
          const product = userProducts[key];
          return {
            id: key,
            userId: uid,
            title: product.title,
            description: product.description,
            imageUrl: product.imageUrl,
            category: product.category,
            location: product.location,
            contact: product.contact,
            price: product.price,
            postedBy: postedByFirstName,
            createdAt: product.createdAt,
          };
        });
      });

      const results = await Promise.all(productPromises);
      const allProductsArray = results.flat();

      //Trier par date,mettre les plus récents en premier.
      allProductsArray.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      console.log(`✅ ${allProductsArray.length} produits chargés (Mode Invité)`);
      setAllProducts(allProductsArray);
      setFilteredProducts(allProductsArray);
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de récupérer les produits.");
    } finally {
      setLoading(false);
    }
  };

  //Recherche 
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim() === "") {
        setFilteredProducts(allProducts);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      const lowerSearch = searchText.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(lowerSearch)) ||
          (p.description && p.description.toLowerCase().includes(lowerSearch)) ||
          (p.category && p.category.toLowerCase().includes(lowerSearch)) ||
          (p.location && p.location.toLowerCase().includes(lowerSearch)) ||
          (p.postedBy && p.postedBy.toLowerCase().includes(lowerSearch))
      );

      setFilteredProducts(filtered);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, allProducts]);

  //Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllProducts();
    setRefreshing(false);
  }, []);

  //Navigation vers AddProducts mais avec une demande de connexion
  const handleNavigateToAddProducts = () => {
    Alert.alert(
      "Connexion requise",
      "Vous devez créer un compte ou vous connecter pour publier un produit.",
      [
        { text: "Se connecter", onPress: () => router.push("/Login") },
        { text: "S'inscrire", onPress: () => router.push("/Connection") },
        { text: "Annuler", style: "cancel" },
      ]
    );
  };

  //Ouverture d'un produit
  const openProductDetail = useCallback((product: ProductData) => {
    router.push({
      pathname: "../ProductDetailScreen",
      params: {
        product: JSON.stringify(product),
        userId: product.userId ?? "",
        currentUserId: "", //Mode invité
        guestMode: "true",
      },
    });
  }, [router]);

  //Calcul du nombre de vendeurs uniques
  const uniqueSellersCount = useMemo(() => {
    return new Set(allProducts.map(p => p.userId)).size;
  }, [allProducts]);

  //Render d'un produit
  const renderProduct = useCallback(({ item }: { item: ProductData }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.85}
      onPress={() => openProductDetail(item)}
    >
      <Image
        source={{
          uri: item.imageUrl || "https://via.placeholder.com/80?text=Pas+d'image",
        }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {item.title || "Sans titre"}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || "Aucune description"}
        </Text>
        
        <View style={styles.productFooter}>
          {item.price && (
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>{item.price} HTG</Text>
            </View>
          )}
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        
        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#999" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}
        
        {item.postedBy && (
          <Text style={styles.productPostedBy}>Par {item.postedBy}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  ), [openProductDetail]);

  //Empty state
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {searchText ? "Aucun résultat" : "Aucun produit"}
      </Text>
      <Text style={styles.emptyText}>
        {searchText
          ? `Aucun produit trouvé pour "${searchText}"`
          : "Les produits s'afficheront ici"}
      </Text>
      {searchText && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSearchText("")}
        >
          <Text style={styles.clearButtonText}>Effacer la recherche</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [searchText]);

  return (
    <View style={styles.container}>
      {/* Header fixe */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerButton}>
          <Ionicons name="menu-outline" size={28} color="#0F1E33" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bizay</Text>

        <TouchableOpacity
          onPress={() => setUserMenuVisible(true)}
          style={styles.userContainer}
        >
          <View style={styles.disconnectedBadge}>
            <Ionicons name="person-outline" size={18} color="#999" />
          </View>
        </TouchableOpacity>
      </View>

      {/*ScrollView avec tout le contenu */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#146C6C"
            colors={["#146C6C"]}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          {/* Badge Mode Invité avec bouton */}
          <View style={styles.guestBadgeExtended}>
            <View style={styles.guestBadgeHeader}>
              <Ionicons name="eye-outline" size={18} color="#2196F3" />
              <Text style={styles.guestText}>
                Mode Exploration
              </Text>
            </View>
            <Text style={styles.guestSubtext}>
              Créez un compte pour publier vos produits
            </Text>
            <TouchableOpacity
              style={styles.guestBadgeButton}
              onPress={() => router.push("/Connection")}
              activeOpacity={0.85}
            >
              <Text style={styles.guestBadgeButtonText}>Créer un compte</Text>
              <Ionicons name="arrow-forward" size={16} color="#2196F3" />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#555" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher des produits..."
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchLoading && (
              <ActivityIndicator size="small" color="#146C6C" />
            )}
            {searchText.length > 0 && !searchLoading && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Bouton Catégories */}
          <TouchableOpacity
            style={styles.categoriesButton}
            onPress={() => router.push("../Categories")}
            activeOpacity={0.8}
          >
            <View style={styles.categoriesButtonContent}>
              <View style={styles.categoriesIconWrapper}>
                <Ionicons name="apps" size={24} color="#146C6C" />
              </View>
              <View style={styles.categoriesTextContainer}>
                <Text style={styles.categoriesButtonTitle}>Explorer par catégories</Text>
                <Text style={styles.categoriesButtonSubtitle}>
                  Parcourir tous les produits par catégorie
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#146C6C" />
            </View>
          </TouchableOpacity>

          {/* Statistiques */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="cube-outline" size={24} color="#146C6C" />
              <Text style={styles.statNumber}>{allProducts.length}</Text>
              <Text style={styles.statLabel}>Produits</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="search-outline" size={24} color="#146C6C" />
              <Text style={styles.statNumber}>{filteredProducts.length}</Text>
              <Text style={styles.statLabel}>Résultats</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="people-outline" size={24} color="#146C6C" />
              <Text style={styles.statNumber}>{uniqueSellersCount}</Text>
              <Text style={styles.statLabel}>Vendeurs</Text>
            </View>
          </View>

          {/* Titre de section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchText ? `Résultats pour "${searchText}"` : "Produits récents"}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
            </Text>
          </View>

          {/* Liste des produits */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#146C6C" />
              <Text style={styles.loadingText}>Chargement des produits...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <ListEmptyComponent />
          ) : (
            filteredProducts.map((item, index) => (
              <View key={item.id || index.toString()}>
                {renderProduct({ item })}
              </View>
            ))
          )}

          {/* Espace supplémentaire en bas */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Bouton flottant pour créer un compte */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleNavigateToAddProducts}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Menu de gauche */}
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
              onPress={() => {
                setMenuVisible(false);
                handleNavigateToAddProducts();
              }}
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

      {/* Menu utilisateur (droite) - Mode Invité */}
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
              <Text style={styles.menuTitle}>Mode Invité</Text>
              <TouchableOpacity onPress={() => setUserMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#0F1E33" />
              </TouchableOpacity>
            </View>

            <View style={styles.guestMenuBanner}>
              <Ionicons name="eye-outline" size={40} color="#146C6C" />
              <Text style={styles.guestMenuText}>
                Vous explorez Bizay en mode invité
              </Text>
            </View>

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
              <Text style={styles.menuText}>Créer un compte</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <View style={styles.guestFeaturesList}>
              <Text style={styles.guestFeaturesTitle}>Avec un compte, vous pouvez :</Text>
              <View style={styles.guestFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.guestFeatureText}>Publier vos produits</Text>
              </View>
              <View style={styles.guestFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.guestFeatureText}>Gérer vos annonces</Text>
              </View>
              <View style={styles.guestFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.guestFeatureText}>Contacter les vendeurs</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
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
  disconnectedBadge: {
    backgroundColor: "#F0F0F0",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  guestBadgeExtended: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  guestBadgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  guestText: {
    marginLeft: 10,
    color: "#1565C0",
    fontSize: 15,
    fontWeight: "700",
  },
  guestSubtext: {
    color: "#1976D2",
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  guestBadgeButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  guestBadgeButtonText: {
    color: "#2196F3",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6,
  },
  guestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#0F1E33",
  },
  categoriesButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  categoriesButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  categoriesIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoriesTextContainer: {
    flex: 1,
  },
  categoriesButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 2,
  },
  categoriesButtonSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#146C6C",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F1E33",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  priceContainer: {
    backgroundColor: "#146C6C",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productPrice: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  categoryBadge: {
    backgroundColor: "#E8F5F3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: "#146C6C",
    fontSize: 11,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: "#999",
    marginLeft: 4,
    flex: 1,
  },
  productPostedBy: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#999",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  clearButton: {
    backgroundColor: "#146C6C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  bottomSpacer: {
    height: 30,
  },
  ctaContainer: {
    marginVertical: 20,
  },
  ctaCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#146C6C",
    shadowColor: "#146C6C",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F1E33",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaPrimaryButton: {
    backgroundColor: "#146C6C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "100%",
    marginBottom: 12,
    shadowColor: "#146C6C",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  ctaPrimaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  ctaSecondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "100%",
    borderWidth: 2,
    borderColor: "#146C6C",
    marginBottom: 20,
  },
  ctaSecondaryButtonText: {
    color: "#146C6C",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  ctaFeatures: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 15,
  },
  ctaFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ctaFeatureText: {
    fontSize: 13,
    color: "#0F1E33",
    marginLeft: 10,
    fontWeight: "500",
  },
  extraBottomSpacer: {
    height: 50,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#146C6C",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#146C6C",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
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
  guestMenuBanner: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8F9FA",
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
  },
  guestMenuText: {
    marginTop: 10,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  guestFeaturesList: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  guestFeaturesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 12,
  },
  guestFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  guestFeatureText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 10,
  },
});