import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { tokenCache } from '../cache';

export {
  ErrorBoundary
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <RootLayoutNav />
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Configuration adaptative selon le thème
  const screenOptions = {
    headerStyle: {
      backgroundColor: colorScheme === 'dark' ? '#0d4f4f' : '#146C6C',
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: 'bold' as const,
      fontSize: 18,
    },
    headerShadowVisible: true,
    headerBackTitleVisible: false,
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={screenOptions}>
        {/* Écran d'accueil */}
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />

        {/* Tabs */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />

        {/* Écrans d'authentification */}
        <Stack.Screen 
          name="Connection" 
          options={{ 
            title: 'Créer un compte',
            headerShown: true,
          }} 
        />
        
        <Stack.Screen 
          name="Login" 
          options={{ 
            title: 'Connexion',
            headerShown: true,
          }} 
        />

        {/* Écrans produits */}
        <Stack.Screen 
          name="AddProducts" 
          options={{ 
            title: 'Ajouter un produit',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="ProductDetailScreen" 
          options={{ 
            title: 'Détails du produit',
            headerShown: true,
            headerTintColor: "#fff",
          }}
        />

        <Stack.Screen 
          name="Categories" 
          options={{ 
            title: 'Catégories',
            headerShown: true,
          }} 
        />

        {/* Page invités */}
        <Stack.Screen 
          name="ExploreGuest" 
          options={{ 
            headerShown: false, 
          }} 
        />

        {/* Pages informatives */}
        <Stack.Screen 
          name="Apropos" 
          options={{ 
            title: 'À propos',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="Confidentialite" 
          options={{ 
            title: 'Politique de confidentialité',
            headerShown: true,
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}