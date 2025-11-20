import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { get, ref } from "firebase/database";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHearder";
import { db } from "../firebaseConfig";

type Product = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  userId: string;
  price?: string;
  location?: string;
  postedBy?: string;
};

export default function CategoriesScreen() {
  const router = useRouter();
  const { selectedCategory: initialCategory, currentUserId: initialUserId } =
    useLocalSearchParams<{ selectedCategory?: string; currentUserId?: string }>();
  const currentUserId = initialUserId ?? "";

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [initials, setInitials] = useState<string | null>(null);

  //Récupération optimisée des produits
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      try {
        //Récupérer tous les produits
        const productsRef = ref(db, "products");
        const snapshot = await get(productsRef);
        
        if (!snapshot.exists()) {
          setAllProducts([]);
          setCategories([]);
          setLoading(false);
          return;
        }

        const data = snapshot.val();
        const tempProducts: Product[] = [];
        const categorySet = new Set<string>();

        //Parcourir tous les utilisateurs et leurs produits
        const userIds = Object.keys(data);
        
        for (const uid of userIds) {
          const userProducts = data[uid];
          const productIds = Object.keys(userProducts);
          
          // Récupérer les infos du vendeur
          const userSnapshot = await get(ref(db, `users/${uid}`));
          let postedByFirstName = "Anonyme";
          
          if (userSnapshot.exists()) {
            const u = userSnapshot.val();
            postedByFirstName = u.firstName || "Anonyme";
          }
          
          for (const pid of productIds) {
            const p = userProducts[pid];
            const category = p.category || "Autres";

            const product: Product = {
              id: pid,
              name: p.title || "Produit",
              description: p.description || "",
              imageUrl: p.imageUrl,
              category,
              userId: uid,
              price: p.price,
              location: p.location || "",
              postedBy: postedByFirstName,
            };

            tempProducts.push(product);
            categorySet.add(category);
          }
        }

        setAllProducts(tempProducts);
        setCategories(Array.from(categorySet).sort());

        //Sélectionner la catégorie initiale si fournie.
        if (initialCategory && categorySet.has(initialCategory)) {
          setSelectedCategory(initialCategory);
        }
        
      } catch (error: any) {
        Alert.alert(
          "Erreur",
          "Impossible de récupérer les produits. Veuillez réessayer plus tard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [initialCategory]);

  //Filtrer les produits par catégorie.
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
      return allProducts;
    }
    return allProducts.filter((p) => p.category === selectedCategory);
  }, [allProducts, selectedCategory]);

  // Compter les produits par catégorie
  const categoryCount = useMemo(() => {
    const counts: { [key: string]: number } = {};
    allProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

  //Gérer le clic sur un produit.
  const handleProductPress = (product: Product) => {
    router.push({
      pathname: "/ProductDetailScreen",
      params: {
        product: JSON.stringify(product),
        userId: product.userId,
        currentUserId,
      },
    });
  };

  //Gérer la sélection de catégorie.
  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null); // Désélectionner
    } else {
      setSelectedCategory(category);
    }
  };

  //Rendu d'un bouton de catégorie
  const renderCategoryButton = ({ item }: { item: string }) => {
    const isSelected = selectedCategory === item;
    const count = categoryCount[item] || 0;

    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          isSelected && styles.categoryButtonSelected,
        ]}
        onPress={() => handleCategorySelect(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.categoryTextSelected,
          ]}
        >
          {item}
        </Text>
        <View style={[
          styles.countBadge,
          isSelected && styles.countBadgeSelected
        ]}>
          <Text style={[
            styles.countText,
            isSelected && styles.countTextSelected
          ]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  //Rendu d'un produit (style identique à Home)
  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.85}
      onPress={() => handleProductPress(item)}
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
          {item.name || "Sans titre"}
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
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
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
  );

  //Header de la liste des produits
  const ListHeaderComponent = () => (
    <>
      {/* Titre de la section */}
      <View style={styles.headerContainer}>
        <Text style={styles.pageTitle}>Catégories</Text>
        <Text style={styles.pageSubtitle}>
          {allProducts.length} produit{allProducts.length > 1 ? "s" : ""} disponible{allProducts.length > 1 ? "s" : ""}
        </Text>
      </View>

      {/* Liste des catégories */}
      <FlatList
        data={categories}
        renderItem={renderCategoryButton}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.categoryRow}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Aucune catégorie disponible</Text>
          </View>
        }
      />

      {/* Badge de catégorie sélectionnée */}
      {selectedCategory && (
        <View style={styles.selectedCategoryBadge}>
          <Ionicons name="filter" size={16} color="#146C6C" />
          <Text style={styles.selectedCategoryText}>
            {selectedCategory} ({filteredProducts.length})
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={styles.clearFilterButton}
          >
            <Ionicons name="close-circle" size={18} color="#146C6C" />
          </TouchableOpacity>
        </View>
      )}

      {/* Titre de la section produits */}
      <View style={styles.sectionHeader}>
        <Text style={styles.productsTitle}>
          {selectedCategory ? `Produits - ${selectedCategory}` : "Tous les produits"}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
        </Text>
      </View>
    </>
  );

  //Composant si aucun produit
  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {selectedCategory
          ? "Aucun produit"
          : "Aucun produit disponible"}
      </Text>
      <Text style={styles.emptyText}>
        {selectedCategory
          ? `Aucun produit dans la catégorie "${selectedCategory}"`
          : "Les produits s'afficheront ici"}
      </Text>
      {selectedCategory && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={styles.clearButtonText}>Voir tous les produits</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
        <AppHeader
          userData={userInfo}
          setUserData={setUserInfo}
          setInitials={setInitials}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#146C6C" />
          <Text style={styles.loadingText}>Chargement des produits...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <AppHeader
        userData={userInfo}
        setUserData={setUserInfo}
        setInitials={setInitials}
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingTop: 60,
    backgroundColor: "#F8F9FA",
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  headerContainer: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F1E33",
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  categoryRow: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryButtonSelected: {
    backgroundColor: "#146C6C",
    borderColor: "#146C6C",
  },
  categoryText: {
    fontSize: 14,
    color: "#0F1E33",
    fontWeight: "600",
    flex: 1,
  },
  categoryTextSelected: {
    color: "#fff",
  },
  countBadge: {
    backgroundColor: "#E8F5F3",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeSelected: {
    backgroundColor: "#fff",
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#146C6C",
  },
  countTextSelected: {
    color: "#146C6C",
  },
  selectedCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 12,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#81C784",
  },
  selectedCategoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    flex: 1,
  },
  clearFilterButton: {
    padding: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  productsTitle: {
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
  categoryBadgeText: {
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
});