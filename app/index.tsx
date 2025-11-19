import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../types/types";

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  //Animations avancées
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    //Animation d'entrée sophistiquée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    //Animation de rotation continue pour le logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    //Animation de pulsation pour le bouton
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    //Animation flottante pour l'image
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#0A1628", "#0F2744", "#146C6C", "#1A8B8B"]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.container}
      >
        {/* Cercles décoratifs en arrière-plan */}
        <View style={styles.backgroundCircles}>
          <Animated.View
            style={[
              styles.circle1,
              {
                transform: [{ rotate: spin }],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.circle2,
              {
                transform: [{ rotate: spin }],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.08],
                }),
              },
            ]}
          />
        </View>

        {/* Logo avec effet glassmorphism */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Text style={styles.logoText}>B</Text>
            </LinearGradient>
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.brandName}>Bizay</Text>
          <View style={styles.taglineContainer}>
            <View style={styles.dot} />
            <Text style={styles.tagline}>Achetez</Text>
            <View style={styles.dot} />
            <Text style={styles.tagline}>Vendez</Text>
            <View style={styles.dot} />
            <Text style={styles.tagline}>Gagnez</Text>
            <View style={styles.dot} />
          </View>
        </Animated.View>

        {/* Contenu principal */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.title}>
            Bienvenue dans{"\n"}votre marketplace 👋
          </Text>
          <Text style={styles.subtitle}>
            Découvrez une nouvelle façon d'acheter et de vendre des produits
            locaux, facilement et en toute confiance.
          </Text>

          {/* Features cards */}
          <View style={styles.featuresContainer}>
            {[
              { icon: "🛍️", text: "Achat rapide" },
              { icon: "💰", text: "Vente facile" },
              { icon: "🔒", text: "100% sécurisé" },
            ].map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 50 + index * 10],
                        }),
                      },
                      { scale: scaleAnim },
                    ],
                  },
                ]}
              >
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Image flottante */}
        <Animated.Image
          source={require("../assets/images/download.png")}
          style={[
            styles.image,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: floatAnim },
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
            },
          ]}
          resizeMode="contain"
        />

        {/* Bouton*/}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50],
                  }),
                },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("./Connection")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Commencer maintenant</Text>
              <Text style={styles.buttonEmoji}>🚀</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Utilisateurs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Produits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.8★</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  backgroundCircles: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle1: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#FFD700",
    top: -100,
    right: -150,
  },
  circle2: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#FFA500",
    bottom: -80,
    left: -100,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  logoWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  logoGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFD700",
    opacity: 0.2,
    top: -10,
    left: -10,
  },
  logoText: {
    color: "#0A1628",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 2,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagline: {
    color: "#B0C4DE",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFD700",
  },
  contentContainer: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    color: "#B0C4DE",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  featuresContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  featureCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    minWidth: 90,
    backdropFilter: "blur(10px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  featureText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  image: {
    width: width * 0.7,
    height: height * 0.25,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: "row",
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#0A1628",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonEmoji: {
    fontSize: 18,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    color: "#B0C4DE",
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});