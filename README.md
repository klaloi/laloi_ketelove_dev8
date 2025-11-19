# Bizay - Marketplace Haïtienne 

Application mobile de vente locale pour les petits commerçants et entrepreneurs haïtiens.

## 🚀 Installation rapide
```bash
# Cloner le projet
git clone https://github.com/votre-username/bizay.git
cd bizay

# Installer les dépendances
npm install

# Lancer l'application
npx expo start
```

## 📋 Prérequis

- Node.js 16+
- React native Expo
- Compte Firebase (Auth + Realtime Database + Storage)
- Compte Clerk (pour OAuth)

## ⚙️ Configuration

### 1. Firebase

Créez `firebaseConfig.ts` à la racine :
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  databaseURL: "VOTRE_DATABASE_URL",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
```

### 2. Clerk (OAuth)

Créez `.env` à la racine :
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
```

### 3. Structure Firebase Database
```json
{
  "users": {
    "userId": {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "initials": "string"
    }
  },
  "products": {
    "userId": {
      "productId": {
        "title": "string",
        "description": "string",
        "price": "string",
        "imageUrl": "string",
        "category": "string",
        "location": "string",
        "contact": "string",
        "createdAt": "timestamp"
      }
    }
  }
}
```

## ✨ Fonctionnalités

- Authentification (Email/Password, Google, Apple, Facebook)
- Publication et gestion de produits
- Recherche et filtrage par catégories
- Contact vendeur via WhatsApp
- Gestion de profil utilisateur
- Mode invité pour explorer

## 🛠️ Technologies

- React Native + Expo
- TypeScript
- Firebase (Auth, Realtime Database, Storage)
- Clerk (OAuth)
- Expo Router (Navigation)

## 📂 Structure du projet
```
bizay/
├── app/                    # Routes Expo Router
│   ├── (tabs)/
|       └── _layout.tsx
│   │   └── Home.tsx
|   |   └── MonCompte.tsx
|
|   ├── _layout.tsx
│   ├── Connection.tsx            # Inscription
│   ├── Login.tsx                 # Connexion
│   ├── AddProducts.tsx           # Ajout produits
│   ├── Categories.tsx            # categories de tous les produits
│   ├── ProductDetailScreen.tsx   #Pour les details des produits
|   ├── index.tsx                 #Page d'acceuil
|   ├── ExploreGuest.tsx
|   ├── Apropos.tsx
|   ├── Confidentialite.tsx 
├── components/
│   └── AppHeader.tsx
├── firebaseConfig.ts             # Config Firebase
└── types/types.ts
```



## 🐛 Problèmes courants

**Erreur Clerk**
```bash
npx expo start -c
```

**Firebase Permission denied**
- Vérifiez les règles de sécurité Firebase

**Images ne s'affichent pas**
- Vérifiez les permissions Storage



## 📞 Contact

- Email: ketelovelaloi647@gmail.com
- WhatsApp: +509 3121 6802

---
