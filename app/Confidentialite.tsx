import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import AppHeader from "../components/AppHearder";

export default function Confidentialite() {
  const [userInfo, setUserInfo] = React.useState<any>(null);
  const [initials, setInitials] = React.useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
        {/* En-tête avec gradient */}
        <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={["#146C6C", "#00A99D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={50} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Politique de</Text>
            <Text style={styles.headerTitle}>Confidentialité</Text>
            <Text style={styles.headerSubtitle}>
              Votre vie privée est notre priorité
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Illustration centrale */}
        <View style={styles.illustrationContainer}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/9428/9428223.png",
            }}
            style={styles.illustration}
          />
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Chez <Text style={styles.brand}>Bizay</Text>, nous nous engageons à
            protéger vos données personnelles avec la plus grande rigueur.
          </Text>
        </View>

        {/* Cartes de fonctionnalités */}
        <View style={styles.featuresContainer}>
          {/* Card 1 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={28} color="#146C6C" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Protection totale</Text>
              <Text style={styles.featureText}>
                Les informations que vous partagez — nom, téléphone, produits —
                servent uniquement à améliorer votre expérience sur la plateforme.
              </Text>
            </View>
          </View>

          {/* Card 2 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconWrapper}>
              <Ionicons name="eye-off-outline" size={28} color="#146C6C" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Aucun partage</Text>
              <Text style={styles.featureText}>
                Vos données ne sont <Text style={styles.bold}>jamais partagées</Text> avec
                des tiers sans votre consentement explicite. Vous gardez le contrôle
                total.
              </Text>
            </View>
          </View>

          {/* Card 3 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconWrapper}>
              <FontAwesome5 name="database" size={26} color="#146C6C" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Sécurité Firebase</Text>
              <Text style={styles.featureText}>
                Nous utilisons <Text style={styles.bold}>Firebase</Text> pour garantir
                la sécurité, la sauvegarde et la confidentialité de vos données.
              </Text>
            </View>
          </View>

          {/* Card 4 */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconWrapper}>
              <Ionicons name="trash-outline" size={28} color="#146C6C" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Suppression facile</Text>
              <Text style={styles.featureText}>
                Vous pouvez supprimer votre compte et toutes vos données personnelles
                à tout moment via les paramètres de votre profil.
              </Text>
            </View>
          </View>
        </View>

        {/* Section "Vos droits" */}
        <View style={styles.rightsSection}>
          <Text style={styles.rightsSectionTitle}>Vos droits</Text>
          <View style={styles.rightsList}>
            <View style={styles.rightItem}>
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.rightText}>Accéder à vos données</Text>
            </View>
            <View style={styles.rightItem}>
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.rightText}>Modifier vos informations</Text>
            </View>
            <View style={styles.rightItem}>
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.rightText}>Supprimer votre compte</Text>
            </View>
            <View style={styles.rightItem}>
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.rightText}>Exporter vos données</Text>
            </View>
          </View>
        </View>

        {/* Footer avec badge de confiance */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={40} color="#146C6C" />
          <Text style={styles.trustText}>
            Votre confiance est essentielle
          </Text>
          <Text style={styles.trustSubtext}>
            Bizay s'engage à protéger vos informations
          </Text>
        </View>

        <Text style={styles.footer}>© 2025 Bizay — Tous droits réservés</Text>
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
  introCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#146C6C",
  },
  introText: {
    fontSize: 16,
    color: "#37474F",
    lineHeight: 24,
    textAlign: "center",
  },
  brand: {
    color: "#146C6C",
    fontWeight: "700",
    fontSize: 17,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  featureCard: {
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
  featureIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F5F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: "#546E7A",
    lineHeight: 21,
  },
  bold: {
    fontWeight: "700",
    color: "#146C6C",
  },
  rightsSection: {
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
  rightsSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F1E33",
    marginBottom: 20,
    textAlign: "center",
  },
  rightsList: {
    gap: 12,
  },
  rightItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#146C6C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rightText: {
    fontSize: 15,
    color: "#37474F",
    fontWeight: "500",
  },
  trustBadge: {
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: "#E8F5F3",
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#146C6C",
  },
  trustText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#146C6C",
    marginTop: 15,
    textAlign: "center",
  },
  trustSubtext: {
    fontSize: 14,
    color: "#546E7A",
    marginTop: 5,
    textAlign: "center",
  },
  footer: {
    marginTop: 10,
    marginBottom: 20,
    color: "#90A4AE",
    fontSize: 13,
    textAlign: "center",
  },
});