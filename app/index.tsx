
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";

import { useRouter } from "expo-router";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { RootStackParamList } from "../types/types";
const router = useRouter();

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  // --- Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={["#0F1E33", "#146C6C"]} style={styles.container}>
      {/* --- Logo animé --- */}
      <Animated.View
        style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>Bizay</Text>
        </View>
        <Text style={styles.tagline}>Achetez • Vendez • Gagnez</Text>
      </Animated.View>

      {/* --- Texte principal --- */}
      <Animated.View
        style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <Text style={styles.title}>Bienvenue sur Bizay 👋</Text>
        <Text style={styles.subtitle}>
          Découvrez une nouvelle façon d’acheter et de vendre des produits
          locaux, facilement et en toute confiance.
        </Text>
      </Animated.View>

      {/* --- Illustration flottante --- */}
      <Animated.Image
        source={require("../assets/images/download.png")}
        style={[
          styles.image,
          {
            transform: [
              { translateY: slideAnim },
              { scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
            ],
          },
        ]}
        resizeMode="contain"
      />

      {/* --- Bouton d’entrée --- */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("./Connection")}
          activeOpacity={0.9}
        >
          <LinearGradient colors={["#D6B48B", "#C9A27D", "#B68B60"]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Commencer l’aventure 🚀</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Des milliers d’opportunités vous attendent 💰
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#D6B48B",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  logoText: {
    color: "#0F1E33",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tagline: {
    color: "#E6E6E6",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#E6E6E6",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  image: {
    width: width * 0.8,
    height: height * 0.3,
  },
  button: {
    width: width * 0.8,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#0F1E33",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footerText: {
    color: "#E6E6E6",
    fontSize: 13,
    marginTop: 15,
    textAlign: "center",
    opacity: 0.8,
  },
});
