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

  //Rendu d'un produit
  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.8}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#fff" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || "Aucune description"}
        </Text>
        {item.price && (
          <Text style={styles.productPrice}>{item.price} HTG</Text>
        )}
        {item.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={12} color="#fff" />
            <Text style={styles.productLocation}>{item.location}</Text>
          </View>
        )}
      </View>
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
      <Text style={styles.productsTitle}>
        {selectedCategory ? `Produits - ${selectedCategory}` : "Tous les produits"}
      </Text>
    </>
  );

  //Composant si aucun produit
  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>
        {selectedCategory
          ? `Aucun produit dans la catégorie "${selectedCategory}"`
          : "Aucun produit disponible"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
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
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
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
    color: "#146C6C",
    fontWeight: "600",
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
    backgroundColor: "#F0F0F0",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryButtonSelected: {
    backgroundColor: "#146C6C",
    borderColor: "#00FFCC",
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
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeSelected: {
    backgroundColor: "#00FFCC",
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F1E33",
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
  productsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F1E33",
    marginTop: 10,
    marginBottom: 15,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F8B8B",
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  productDescription: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 4,
  },
  productPrice: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  productLocation: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 15,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});