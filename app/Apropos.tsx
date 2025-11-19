import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Animated,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHearder";

export default function Apropos() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  //Liens de contact
  const handleEmail = () => {
    Linking.openURL(
      "mailto:ketelovelaloi647@gmail.com?subject=Contact%20depuis%20l'application%20Bizay"
    );
  };

  const handleWhatsApp = () => {
    Linking.openURL(
      "https://wa.me/50931216802?text=Bonjour%20Bizay%20!%20J'aimerais%20avoir%20plus%20d'informations."
    );
  };

  const handleCall = () => {
    Linking.openURL("tel:+50931216802");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <AppHeader
        userData={userInfo}
        setUserData={setUserInfo}
        setInitials={setInitials}
      />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/*En tête avec gradient */}
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={["#146C6C", "#00A99D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="information-circle" size={50} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>À propos</Text>
            <Text style={styles.headerTitle}>de Bizay</Text>
            <Text style={styles.headerSubtitle}>
              La marketplace haïtienne de proximité
            </Text>
          </LinearGradient>
        </Animated.View>

        {/*Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/9196/9196233.png",
            }}
            style={styles.illustration}
          />
        </View>

        {/*Mission Card */}
        <View style={styles.missionCard}>
          <View style={styles.missionHeader}>
            <Ionicons name="rocket" size={30} color="#146C6C" />
            <Text style={styles.missionTitle}>Notre Mission</Text>
          </View>
          <Text style={styles.missionText}>
            <Text style={styles.brand}>Bizay</Text> est une plateforme innovante
            conçue pour les petits commerçants et entrepreneurs haïtiens. Elle permet
            à chacun de publier, vendre et découvrir des produits à travers tout le
            pays, en toute simplicité.
          </Text>
        </View>

        {/*Valeurs */}
        <View style={styles.valuesContainer}>
          <Text style={styles.sectionTitle}>Nos Valeurs</Text>
          
          <View style={styles.valueCard}>
            <View style={styles.valueIconWrapper}>
              <Ionicons name="people" size={28} color="#146C6C" />
            </View>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Accessibilité</Text>
              <Text style={styles.valueText}>
                Faciliter les échanges commerciaux locaux pour tous les Haïtiens
              </Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueIconWrapper}>
              <Ionicons name="trending-up" size={28} color="#146C6C" />
            </View>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Croissance</Text>
              <Text style={styles.valueText}>
                Promouvoir la croissance économique et l'autonomie des entrepreneurs
              </Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueIconWrapper}>
              <Ionicons name="link" size={28} color="#146C6C" />
            </View>
            <View style={styles.valueContent}>
              <Text style={styles.valueTitle}>Connexion</Text>
              <Text style={styles.valueText}>
                Créer une Haïti plus connectée où la technologie soutient l'économie
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="people-outline" size={32} color="#146C6C" />
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="cube-outline" size={32} color="#146C6C" />
            <Text style={styles.statNumber}>5000+</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="location-outline" size={32} color="#146C6C" />
            <Text style={styles.statNumber}>10+</Text>
            <Text style={styles.statLabel}>Départements</Text>
          </View>
        </View>

        {/* Section Contact */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>
            <Ionicons name="chatbubbles" size={24} color="#146C6C" /> Contactez-nous
          </Text>
          <Text style={styles.contactSubtitle}>
            Notre équipe est là pour vous aider
          </Text>

          <TouchableOpacity 
            style={styles.contactButton} 
            onPress={handleEmail}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#146C6C", "#00A99D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <MaterialCommunityIcons name="email-outline" size={22} color="#fff" />
              <Text style={styles.buttonText}>Par Email</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactButton} 
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#25D366", "#1EBE57"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <FontAwesome5 name="whatsapp" size={22} color="#fff" />
              <Text style={styles.buttonText}>WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactButton} 
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#007AFF", "#0056D2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="call-outline" size={22} color="#fff" />
              <Text style={styles.buttonText}>Appeler</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerCard}>
          <Image
            source={require("../assets/images/download.png")}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerSlogan}>
            Ensemble, construisons une économie plus forte
          </Text>
          <Text style={styles.footer}>© 2025 Bizay — Tous droits réservés</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F7FA",
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 10,
    textAlign: "center",
  },
  illustrationContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  illustration: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  missionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#146C6C",
  },
  missionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  missionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F1E33",
    marginLeft: 10,
  },
  missionText: {
    fontSize: 15,
    color: "#546E7A",
    lineHeight: 24,
  },
  brand: {
    color: "#146C6C",
    fontWeight: "700",
    fontSize: 16,
  },
  valuesContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 20,
    textAlign: "center",
  },
  valueCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  valueIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F5F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 6,
  },
  valueText: {
    fontSize: 14,
    color: "#546E7A",
    lineHeight: 21,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#146C6C",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: "#546E7A",
    marginTop: 4,
  },
  contactSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F1E33",
    textAlign: "center",
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: "#546E7A",
    textAlign: "center",
    marginBottom: 20,
  },
  contactButton: {
    marginBottom: 12,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  footerCard: {
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: "#E8F5F3",
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
  },
  footerLogo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  footerSlogan: {
    fontSize: 16,
    fontWeight: "600",
    color: "#146C6C",
    textAlign: "center",
    marginBottom: 15,
  },
  footer: {
    color: "#90A4AE",
    fontSize: 13,
    textAlign: "center",
  },
});