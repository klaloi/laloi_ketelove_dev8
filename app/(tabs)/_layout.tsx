import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";

//Icône personnalisée pour les onglets.
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        //Couleurs des onglets selon si ils ont le focus sur eux ou pas
        tabBarActiveTintColor: "#00FFCC",//Couleur pour celui qui est actif
        tabBarInactiveTintColor: "#928a8aff",//Couleur pour celui qui est inactif
        
        //On change la couleur par defaut qu'avait l'entete des ecrans qui sont dans (tabs)
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: "#146C6C",//Le bacgraround du header
          elevation: 4,
          shadowOpacity: 0.3,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        },
        headerTintColor: "#fff",//Le texte header toujours en blanc
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
          color: "#fff",
        },
        //headerTitleAlign: "center",//Pour centre le titre
        headerShadowVisible: true,

        //Style de la barre des onglets
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: "#146C6C",
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIconStyle: {
          marginTop: -10,
        },
      }}
    >
      {/*L'onglet Accueil*/}
      <Tabs.Screen
        name="Home"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerTitle: "Accueil",
        }}
      />

      {/*L'onglet Mon Compte */}
      <Tabs.Screen
        name="MonCompte"
        options={{
          title: "Mon Compte",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerTitle: "Mon Compte",
        }}
      />
    </Tabs>
  );
}